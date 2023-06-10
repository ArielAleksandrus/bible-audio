import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { AudioControlsComponent } from './audio-controls.component';

@NgModule({
  declarations: [AudioControlsComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ],
  exports: [AudioControlsComponent]
})
export class AudioControlsModule { }
