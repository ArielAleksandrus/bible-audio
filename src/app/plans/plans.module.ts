import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { PlansRoutingModule } from './plans-routing.module';

import { AudioControlsModule } from '../audio-controls/audio-controls.module';

import { PlansComponent } from './plans.component';
import { PlanDetailsComponent } from './plan-details/plan-details.component';


@NgModule({
  declarations: [PlansComponent, PlanDetailsComponent],
  imports: [
    IonicModule,
    FormsModule,
    CommonModule,
    HttpClientModule,
    PlansRoutingModule,

    AudioControlsModule
  ],
  exports: [PlansComponent, PlanDetailsComponent]
})
export class PlansModule { }
