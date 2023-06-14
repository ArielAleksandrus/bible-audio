import { Injectable } from '@angular/core';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {

  private neededPermissions: string[] = [];

  private permissionsStatus: {
    name: string,
    granted: boolean
  }[] = [];

  constructor(private aPerm: AndroidPermissions) { }

  setNeededPermissions(perms: string[], osType: 'android'|'ios'|'web') {
    this.neededPermissions = perms;
    this._checkAll(perms, osType);
  }

  private _checkAll(perms: string[], osType: 'android'|'ios'|'web', idx: number = 0): Promise<boolean> {
    if(idx == 0)
      this.permissionsStatus = [];

    return new Promise((resolve) => {
      switch(osType) {
        case "android": {
          this.permissionsStatus.push({name: perms[idx], granted: false});
          this.checkAndroid(perms[idx]).then(res => { 
            this.permissionsStatus[idx].granted = res;
            if(idx == perms.length - 1) {
              resolve(res);
              return;
            } else {
              return this._checkAll(perms, osType, idx + 1);
            }
          });
          break;
        }
        case "ios": {
          //TODO
          throw new Error("PermissionsService: ios permissions not implemented!");
          break;
        }
        case "web": {
          //TODO
          throw new Error("PermissionsService: web permissions not implemented!");
          break;
        }
      }
    });
  }

  blockedPermissions(): string[] {
    let res: string[] = [];
    for(let permStatus of this.permissionsStatus) {
      if(!permStatus.granted)
        res.push(permStatus.name);
    }
    return res;
  }

  retry(osType: 'ios'|'android'|'web'): Promise<boolean> {
    return new Promise((resolve) => {
      let blocked = this.blockedPermissions();
      if(blocked.length == 0) {
        resolve(true);
        return;
      }
      switch(osType) {
        case "android": {
          this.aPerm.requestPermissions(blocked).then(res => {
            console.log("Granted? ", res);
            resolve(res.hasPermission);
          })
          break;
        }
        case "ios": {
          //TODO
          throw new Error("PermissionsService: ios permissions not implemented!");
          break;
        }
        case "web": {
          //TODO
          throw new Error("PermissionsService: web permissions not implemented!");
          break;
        }
      }
    });
  }

  checkAndroid(perm: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.aPerm.checkPermission(perm).then(res => {
        console.log("Has permission? ", res);
        resolve(res.hasPermission);
      });
    });
  }
  requestAndroid(perm: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.aPerm.requestPermission(perm).then(res => {
        console.log("Granted? ", res);
        resolve(res.hasPermission);
      });
    });
  }
  requestAllAndroid(perms: string[]): Promise<{name: string, granted: boolean}[]> {
    return new Promise((resolve) => {
      this.aPerm.requestPermissions(perms).then(res => {
        this._checkAll(perms, 'android').then(res2 => {
          resolve(this.permissionsStatus);
        })
      });
    });
  }
}
