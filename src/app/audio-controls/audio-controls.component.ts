import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { IonRange } from '@ionic/angular';
import { SoundEl } from './sound-el';

@Component({
  selector: 'app-audio-controls',
  templateUrl: './audio-controls.component.html',
  styleUrls: ['./audio-controls.component.scss'],
})

export class AudioControlsComponent  implements OnInit {
  @Input() active: SoundEl|null = null;
  @Output() prev: EventEmitter<any> = new EventEmitter();
  @Output() next: EventEmitter<any> = new EventEmitter();
  @Output() toggle: EventEmitter<any> = new EventEmitter();
  @Output() stop: EventEmitter<any> = new EventEmitter();
  @ViewChild('range', {static: false}) range?: IonRange;

  progress: number = 0;

  constructor() { }

  ngOnInit() {
    this.updateProgress();
  }

  updateProgress() {
    setTimeout(() => {
      this.updateProgress();

      if(!this.active)
        return;

      let seek = this.active.mediaObj.getCurrentPosition((pos: number) => {
        if(!this.active)
          return;
        
        if(pos == null)
          pos = this.active.mediaObj.currentTime;

        this.progress = (pos / this.active.mediaObj.getDuration()) * 100 || 0;
      });
    }, 1000);
  }

  prevEl() {
    this.prev.emit(null);
  }
  nextEl() {
    this.next.emit(null);
  }
  toggleEl() {
    this.toggle.emit(null);
  }
  stopEl() {
    this.stop.emit(null);
  }
  seek() {
    if(!this.range || !this.active)
      return;
    let newValue = +this.range.value;
    let duration = this.active.mediaObj.getDuration();
    this.active.mediaObj.seekTo(duration * (newValue / 100) * 1000);
  }
}
