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

  loading: boolean = true;

  constructor(private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute) { }


  ngOnInit() {
    this._loadData();
  }

  private _loadData(): Promise<boolean> {
    this.loading = true;
    return new Promise((resolve, reject) => {
      this.savedPlansList = Plan.listSaved();
      Plan.listLocal(this.http).then(res => {
        this.localPlansInfo = res;
        this.loading = false;
        resolve(true);
      }).catch(err => {
        console.log("Error loading local plans", err);
        this.loading = false;
        resolve(false);
      });
    });
  }

  clickSaved(plan: {id: number, name: string}) {
    this.loading = true;
    setTimeout(() => {
      new Promise((resolve, reject) => {
        this.router.navigate([plan.id], {relativeTo: this.route}).then(_ => {
          this.loading = false;
          resolve(true);
        }).catch(_ => {this.loading = false; resolve(false)});
      });
    }, 1000);
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
