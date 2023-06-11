import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PlansComponent } from './plans.component';
import { PlanDetailsComponent } from './plan-details/plan-details.component';

const routes: Routes = [{
  path: '',
  component: PlansComponent
},{
  path: ':id',
  component: PlanDetailsComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlansRoutingModule { }
