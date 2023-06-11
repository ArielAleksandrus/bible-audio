import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { HttpClient } from '@angular/common/http';
import { Plan, PlanInfo } from '../shared/models/plan';

@Component({
  selector: 'app-plans',
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss'],
})
export class PlansComponent  implements OnInit {
  savedPlansList: {id: number, name: string}[] = [];
  localPlansInfo: PlanInfo[] = [];
  loading: boolean = false;

  constructor(private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute) { }


  ngOnInit() {
    Plan.listLocal(this.http).then(res => {
      this.localPlansInfo = res;
    });
    this.savedPlansList = Plan.listSaved();
  }

  clickSaved(plan: {id: number, name: string}) {
    this.loading = true;
    setTimeout(() => {
      this.router.navigate([plan.id], {relativeTo: this.route}).then(_ => {this.loading = false}).catch(_ => {this.loading = false});
    }, 100);
  }
  clickLocal(plan: PlanInfo) {
    this.loading = true;
    Plan.loadLocal(plan, this.http).then(
      res => {
        res.clear();
        res.save();
        this.loading = false;
        this.router.navigate([res.id], {relativeTo: this.route});
      }
    ).catch(err => {
      console.error(err);
      this.loading = false;
    });
  }
}
