import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioControlsModule } from '../audio-controls/audio-controls.module';

import { BibleRoutingModule } from './bible-routing.module';
import { BibleComponent } from './bible.component';

@NgModule({
  declarations: [BibleComponent],
  imports: [
    IonicModule,
    FormsModule,
    CommonModule,
    BibleRoutingModule,
    AudioControlsModule
  ],
  exports: [BibleComponent],
})
export class BibleModule { }
