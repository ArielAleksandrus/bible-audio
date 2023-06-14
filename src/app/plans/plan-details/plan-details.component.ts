import { Component, OnInit, ViewChild } from '@angular/core';
import { IonAccordion } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { Platform } from '@ionic/angular';

import { environment } from '../../../environments/environment';
import { Plan, PlanInfo, PlanChapter } from '../../shared/models/plan';
import { SoundEl } from '../../audio-controls/sound-el';

import { SmartAudioService } from '../../shared/services/smart-audio.service';

@Component({
  selector: 'app-plan-details',
  templateUrl: './plan-details.component.html',
  styleUrls: ['./plan-details.component.scss'],
})
export class PlanDetailsComponent  implements OnInit {
  plan: Plan|null = null;
  sounds: SoundEl[] = [];

  active: SoundEl|null = null;
  previousSound: SoundEl|null = null;
  nextSound: SoundEl|null = null;

  playlist: PlanChapter[] = [];
  curIdx: number = 0;

  loading: boolean = true;

  deviceType: 'native'|'html' = 'html';

  constructor(private router: Router,
              private route: ActivatedRoute,
              public smartAudio: SmartAudioService,
              private platform: Platform,
              private file: File) { 

    if(platform.is('cordova')){
      this.deviceType = 'native';
    }
  }

  ngOnInit() {
    this._loadData();
  }

  private _loadData(): Promise<boolean> {
    this.loading = true;
    return new Promise((resolve, reject) => {
      this.route.params.subscribe(params => {
        this.plan = Plan.loadSaved(Number(params['id']));
        this.loading = false;
        resolve(true);
      });
    });
  }

  continue() {
    if(!this.plan)
      return;

    let aux = this.plan.getPlaylist();
    this.playlist = aux.playlist;

    if(this.playlist.length == 0) {
      if(confirm("Você completou o plano! Gostaria de resetar seu progresso e começar DO ZERO?")) {
        this.plan.clear();
        this.continue();
      }
    } else {
      this.playPlaylist(aux.selectedIdx);
    }
  }

  toggleDay(partIdx: number, dayIdx: number) {
    if(!this.plan)
      return;

    let part = this.plan.parts[partIdx];
    let dayObj = part.days[dayIdx];
    let action = dayObj.done ? "NÃO LIDO" : "LIDO";
    if(confirm(`Deseja marcar como ${action} o dia ${dayObj.day} de ${part.name}?`)) {
      let affected: 'plan'|any = this.plan.dayToggle(partIdx, dayIdx);
      if(affected == 'plan' && action == "NÃO LIDO") {
        this.finishedPlan();
      }
    }
  }

  playPlaylist(fromIdx: number = 0) {
    if(!this.playlist || fromIdx < 0 || fromIdx >= this.playlist.length) {
      console.error("PlanDetails playPlaylist: Cannot play!", this.playlist, fromIdx);
      return;
    }
    this.createSounds();
    this.playSound(fromIdx);
  }
  playDay(partIdx: number, dayIdx: number, chapterIdx: number = 0) {
    if(!this.plan)
      return;

    let globalIdx = this.plan.getGlobalIdx(partIdx, dayIdx, chapterIdx);
    let aux = this.plan.getPlaylist(globalIdx, 3, 7);
    this.playlist = aux.playlist;

    this.createSounds();
    this.playSound(aux.selectedIdx);
    this.closeAccordions();
  }

  playSound(idx: number = 0) {
    this.curIdx = idx;

    let sound: SoundEl = this.sounds[idx];
    if(this.active)
      this.smartAudio.stop();

    this.active = sound;

    this.smartAudio.playSound(this, this.active, {
      soundEnded: this.finishedAudio,
      onPrev: this.prev,
      onNext: this.next
    });

    if(idx < this.sounds.length - 1)
      this.smartAudio.setNext(this.sounds[idx + 1]);
    if(idx > 0)
      this.smartAudio.setPrev(this.sounds[idx-1]);
  }

  finishedAudio(context: any, sound: SoundEl) {
    context.markRead(context);
    context.next();
    console.log("Finished: ", sound);
  }
  next(context = this) {
    if(!context.plan || !context.active)
      return;

    let newIdx = context.curIdx + 1;

    if(newIdx >= context.playlist.length - 2){
      let curChap: PlanChapter = context.playlist[newIdx];
      let globalIdx = context.plan.getGlobalIdx(curChap.partIdx, curChap.dayObjIdx, curChap.chapterIdx);
      let aux = context.plan.getPlaylist(globalIdx);
      context.playlist = aux.playlist;
      context.playPlaylist(aux.selectedIdx);
    } else {
      context.playSound(newIdx);
    }
  }
  prev(context = this) {
    context.smartAudio.position().then(secs => {
      if(!context.active || !context.plan)
        return;
      // go to audio's beginning if played more than 5 seconds
      if(secs > 5) {       
        context.playSound(context.curIdx);
      } else { // go to previous audio
        let newIdx = context.sounds.indexOf(context.active) - 1;
        if(newIdx < 0) { // if audio is already first, replay it
          context.playSound(context.curIdx);
        } else if(newIdx <= 1) { // reload playlist if we are reaching begining of playlist
          let curChap: PlanChapter = context.playlist[newIdx];
          let globalIdx = context.plan.getGlobalIdx(curChap.partIdx, curChap.dayObjIdx, curChap.chapterIdx);
          let aux = context.plan.getPlaylist(globalIdx, 5, 5, false);
          context.playlist = aux.playlist;
          context.playPlaylist(aux.selectedIdx);
        } else {
          context.playSound(newIdx);
        }
      }
      
    });
  }
  toggle() {
    if(this.smartAudio.active)
      this.smartAudio.toggle();
  }
  stop() {
    if(this.smartAudio.active) 
      this.smartAudio.stop();
  }

  markRead(context: any) {
    if(!context.plan || context.curIdx < 0 || context.playlist.length == 0)
      return;

    let chap: PlanChapter = context.playlist[context.curIdx];
    if(chap && !chap.done) {
      let affected: 'plan'|any = context.plan.chapterToggle(chap);
      if(affected == 'plan') {
        context.finishedPlan();
      }
    }
  }

  finishedPlan() {
    alert("PARABÉNS! VOCÊ CONCLUIU SEU PLANO!");
  }

  createSounds(chapters?: PlanChapter[]) {
    if(!chapters) {
      chapters = this.playlist;
    }
    this.sounds = [];
    for(let chapter of chapters) {
      this.sounds.push(this.createSound(chapter.chapter));
    }
  }
  createSound(chapterRaw: string): SoundEl {
    let book: string = chapterRaw.split(' ')[0];
    let chapter: number = Number(chapterRaw.split(' ')[1]);
    let id = `${book}${chapter}`;
    let asset = `${environment.resource_url}/audio/${book}/${book} ${chapter}.mp3`;
    if(this.deviceType == 'native') {
      asset = `${this.file.externalApplicationStorageDirectory}${book}/${book} ${chapter}.mp3`;
    }
    return {
      key: id,
      name: `${book} ${chapter}`,
      asset: asset,
      type: this.deviceType
    };
  }
  closeAccordions() {
    const accordionGroup = document.querySelector('ion-accordion-group');
    if(accordionGroup)
      accordionGroup.value = "undefined";
  }
}
