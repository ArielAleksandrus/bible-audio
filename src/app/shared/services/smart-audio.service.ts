import { Injectable } from '@angular/core';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { Platform } from '@ionic/angular';

import { Media, MediaObject } from '@awesome-cordova-plugins/media/ngx';
import { MediaSession } from '@jofr/capacitor-media-session';
import { SoundEl } from '../../audio-controls/sound-el';

@Injectable({
  providedIn: 'root'
})
export class SmartAudioService {
  id: string = '';
  filepath: string = '';

  audioType: string = 'html5';

  active: SoundEl|null = null;
  context: any = null;
  private previousSound: SoundEl|null = null;
  private nextSound: SoundEl|null = null;
  private soundEnded?: (context: any, sound: SoundEl) => void;
  private onPrev?: (context: any) => void;
  private onNext?: (context: any) => void;
  private ending: boolean = false;

  mediaProgressTimeout: any = null;

  constructor(private platform: Platform,
              private media: Media,
              private file: File) {
    if(platform.is('cordova')){
      this.audioType = 'native';
    }
  }

  playSound(context: any, sound: SoundEl, callbacks?: {
    soundEnded?: (context: any, sound: SoundEl) => void,
    onNext?: () => void,
    onPrev?: () => void
  }) {
    this.context = context;

    if(callbacks) {
      this.soundEnded = callbacks.soundEnded;
      this.onPrev = callbacks.onPrev;
      this.onNext = callbacks.onNext;
    }

    let file: MediaObject = this.media.create(sound.asset);
    file.onStatusUpdate.subscribe((statusId: number) => {
      this.updateStatus(statusId);
    });
    file.onSuccess.subscribe(() => {
      //console.log("Playing sound!");
    });
    file.onError.subscribe(err => {
      console.error("SmartAudio playing error", err);
    });

    sound.status = "playing";
    sound.mediaObj = file;

    if(this.active) {
      this.stop();
    }
    this.active = sound;
    file.play();

    this.setMediaSession(sound);
  }
  playFile(context: any, id: string, folder: string, filename: string, audioName: string, callbacks?: {
    soundEnded?: (context: any, sound: SoundEl) => void,
    onNext?: () => void,
    onPrev?: () => void
  }, extra?: {
    artist: string,
    album: string
  }) {
    let sound: SoundEl = {
      key: id,
      asset: folder + '/' + filename,
      name: audioName,
      extra: extra,
      type: 'native'
    };
    this.playSound(context, sound, callbacks);
  }
  stop() {
    if(!this.active || !this.active.mediaObj) {
      return;
    }
    this.active.mediaObj.stop();
    this.active.mediaObj.release();
    this.active = null;
  }
  toggle() {
    if(!this.active || !this.active.mediaObj) {
      return;
    }
    if(this.active.status == "playing"){
      this.active.mediaObj.pause();
    } else {
      this.active.mediaObj.play();
    }
    this.active.status = this.active.status == "paused" ? "playing" : "paused";
  }

  position(): Promise<number> {
    return new Promise((resolve, reject) => {
      if(!this.active || !this.active.mediaObj)
        return reject(-1);
      else
        this.active.mediaObj.getCurrentPosition((res: number) => {
          resolve(res);
        }, (err: any) => {
          console.error("SmartAudio: position()", err);
          reject(-1);
        })
    });
  }

  setPrev(prev: SoundEl) {
    this.previousSound = prev;
  }
  setNext(next: SoundEl) {
    this.nextSound = next;
  }

  setMediaSession(sound: SoundEl) {
    this.updatePlaybackState();
    MediaSession.setMetadata({
      title: sound.name,
      artist: sound.name.split(' ')[0],
      album: sound.name.split(' ')[0]
    });
    MediaSession.setActionHandler({action: 'play'}, () => {
      if(this.active) {
        this.toggle();
      }
    });
    MediaSession.setActionHandler({action: 'pause'}, () => {
      if(this.active) {
        this.toggle();
      }
    });
    MediaSession.setActionHandler({action: 'seekto'}, (details) => {
      if(this.active && details.seekTime != null) {
        this.active.mediaObj.seekTo(details.seekTime * 1000);
      }
    });
    MediaSession.setActionHandler({action: 'previoustrack'}, () => {
      console.log(this.active, this.previousSound);
      if(this.active && this.previousSound) {
        if(this.onPrev)
          this.onPrev(this.context);
      }
    });
    MediaSession.setActionHandler({action: 'nexttrack'}, () => {
      if(this.active && this.nextSound) {
        if(this.onNext)
          this.onNext(this.context);
      }
    });

    this.setMediaSessionPosition();
  }
  setMediaSessionPosition() {
    if(this.mediaProgressTimeout) {
      clearTimeout(this.mediaProgressTimeout);
    }

    this.position().then(secs => {
      if(this.active && this.active.status == "playing") {
        let duration = this.active.mediaObj.getDuration();
        this.ending = duration - secs < 3;
        MediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: secs
        });
      }
    });
    this.mediaProgressTimeout = setTimeout(() => {
      if(this.active)
        this.setMediaSessionPosition();
    }, 1000);
  }
  updateStatus(statusId: number) {
    switch(statusId) {
    case 4: { // media stopped. may have finished
      if(this.active && this.ending) {
        this.active.status = 'finished';
        if(this.soundEnded) {
          this.soundEnded(this.context, this.active);
        }
      }
      break;
    }
    }
    this.updatePlaybackState();
  }
  updatePlaybackState() {
    const playbackState = this.active ? (this.active.status == "paused" ? "paused" : "playing") : "none";
    MediaSession.setPlaybackState({
      playbackState: playbackState
    });
  }
}
