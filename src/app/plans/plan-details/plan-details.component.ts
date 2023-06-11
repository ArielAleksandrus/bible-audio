import { Component, OnInit, ViewChild } from '@angular/core';
import { IonAccordion } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { File } from '@awesome-cordova-plugins/file/ngx';

import { Plan, PlanInfo } from '../../shared/models/plan';
import { SoundEl } from '../../audio-controls/sound-el';

import { SmartAudioService } from '../../shared/services/smart-audio.service';

@Component({
  selector: 'app-plan-details',
  templateUrl: './plan-details.component.html',
  styleUrls: ['./plan-details.component.scss'],
})
export class PlanDetailsComponent  implements OnInit {
  plan: Plan|null = null;
  current: {partName: string, day: number}|null = null;
  sounds: SoundEl[] = [];
  history: SoundEl[] = [];
  active: SoundEl|null = null;
  previousSound: SoundEl|null = null;
  nextSound: SoundEl|null = null;

  constructor(private router: Router,
    private route: ActivatedRoute,
    public smartAudio: SmartAudioService,
    private file: File) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.plan = Plan.loadSaved(Number(params['id']));
    });
  }

  continue() {
    if(!this.plan)
      return;

    let nextDay = this.plan.nextDay();
    if(nextDay) {
      let fromIdx: number = 0;
      for(let i = 0; i < nextDay.dayObj.readDone.length; i++) {
        let done = nextDay.dayObj.readDone[i];
        if(done) {
          fromIdx = i+1;
        }
      }
      if(fromIdx >= nextDay.dayObj.readDone.length)
        fromIdx = nextDay.dayObj.readDone.length;
      this.playDay(nextDay.partName, nextDay.dayObj.day, fromIdx);
    }
  }

  clickDayDone(partName: string, day: number) {
    if(confirm(`Deseja marcar como LIDO o dia ${day} de ${partName}?`)) {
      if(this.plan)
        this.plan.dayRead(partName, day);
    }
  }

  playDay(partName: string, day: number, fromIdx: number = 0) {
    if(!this.plan)
      return;

    this.current = {
      partName: partName,
      day: day
    };

    let chapters: {chapter: string, done: boolean}[] = this.plan.getChapters(partName, day);

    let nextDayChapters: {chapter: string, done: boolean}[] = this.plan.getChapters(partName, day+1);
    let nextDayChapter: string|null = nextDayChapters[0] ? nextDayChapters[0].chapter : null;

    // if all tracks were played, we start from track 0.
    // if not all tracks were played, start with lowest index track.
    let firstToPlay: number = 0;
    for(let i = 0; i < chapters.length; i++) {
      let chapter = chapters[i];
      if(!chapter.done && firstToPlay == 0) {
        firstToPlay = i;
      }
    }

    this.createSounds(chapters, nextDayChapter, firstToPlay);
    this.playSound(this.sounds[fromIdx]);
    this.closeAccordions();
  }

  playSound(sound: SoundEl) {
    if(this.active)
      this.smartAudio.stop();

    this.active = sound;
    let idx = this.sounds.indexOf(this.active);

    this.smartAudio.playSound(this, this.active, {
      soundEnded: this.finishedAudio,
      onPrev: this.prev,
      onNext: this.next
    });

    this.smartAudio.setNext(this.sounds[idx+1]);
    let prev: SoundEl = idx < 0 ? this.sounds[0] : this.sounds[idx-1];
    this.smartAudio.setPrev(prev);
  }

  finishedAudio(context: any, sound: SoundEl) {
    context.next();
    console.log("Finished: ", sound);
  }
  next(context = this) {
    if(!context.active)
      return;

    let idx = context.sounds.indexOf(context.active);

    context.markRead(context, idx);
  }
  prev(context = this) {
    if(!context.active)
      return;

    context.smartAudio.position().then(secs => {
      if(!context.active)
        return;
      // go to audio's beginning if played more than 5 seconds
      if(secs > 5) {       
        context.playSound(context.active);
      } else {
        let idx = context.sounds.indexOf(context.active);
        if(idx == 0) {
          idx = 1; // prevent negative index
        } else {
          context.playSound(context.sounds[idx - 1]);
        }
      }
      
    });
  }
  toggle() {
    if(this.smartAudio.active)
      this.smartAudio.toggle();
  }

  markRead(context: any, idx: number) {
    if(!context.plan || !context.current)
      return;

    let sound = context.sounds[idx];
    let doneDay = idx == context.sounds.length - 2;

    context.plan.chapterRead(context.current.partName, context.current.day, sound.name);

    if(doneDay) {
      //@ts-ignore
      let part = context.plan.parts.find(el => el.name == context.current.partName);
      if(part) {
        let lastDay = context.current.day == part.days.length;
        if(lastDay) { // part is finished. fetch next part
          let partIdx = context.plan.parts.indexOf(part);
          let lastPart = partIdx == context.plan.parts.length - 1;
          if(lastPart) {
            // stop fetching if is last part. user finished the plan
          } else {
            // start next part from day 1
            context.playDay(context.plan.parts[partIdx + 1].name, 1);
          }
        } else { // get next day
          context.playDay(context.current.partName, context.current.day + 1);
        }
      }
    } else {
      context.playSound(context.sounds[idx + 1]);
    }
  }

  createSounds(chapters: {chapter: string, done: boolean}[], nextDayChapter: string|null, firstToPlay: number = 0) {
    this.sounds = [];
    for(let chapter of chapters) {
      this.sounds.push(this.createSound(chapter.chapter));
    }
    if(nextDayChapter) {
      this.sounds.push(this.createSound(nextDayChapter));
    }
    this.active = this.sounds[firstToPlay];
  }
  createSound(chapterRaw: string): SoundEl {
    let book: string = chapterRaw.split(' ')[0];
    let chapter: number = Number(chapterRaw.split(' ')[1]);
    let id = `${book}${chapter}`;
    return {
      key: id,
      name: `${book} ${chapter}`,
      asset: `${this.file.externalApplicationStorageDirectory}${book}/${book} ${chapter}.mp3`,
      type: 'native'
    };
  }
  closeAccordions() {
    const accordionGroup = document.querySelector('ion-accordion-group');
    if(accordionGroup)
      accordionGroup.value = "undefined";
  }
}
