import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { SmartAudioService } from './shared/services/smart-audio.service';
import { DownloaderService } from './shared/services/downloader.service';
import { PermissionsService } from './shared/services/permissions.service';
import { Media } from '@awesome-cordova-plugins/media/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { HttpClientModule } from '@angular/common/http';

import { ForegroundService } from '@awesome-cordova-plugins/foreground-service/ngx';
import { BackgroundMode } from '@awesome-cordova-plugins/background-mode/ngx';


@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule],
  providers: [
    DownloaderService,
    SmartAudioService,
    Media,
    File,
    HTTP,
    PermissionsService,
    ForegroundService,
    BackgroundMode,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
