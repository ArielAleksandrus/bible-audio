import { Injectable } from '@angular/core';

import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';


export interface DownloadObject {
  id: number,
  url: string, 
  filename: string,
  saveInFolder: string, 
  status: 'pending'|'done'|'fail',
  blob?: Blob
};

@Injectable({
  providedIn: 'root'
})
export class DownloaderService {
  queue: DownloadObject[] = [];
  downloadedFiles: DownloadObject[] = [];

  constructor(private http: HTTP, private file: File) { }

  downloadFile(url: string, saveInFolder: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let id = Math.floor(Math.random() * 100000);
      let info: DownloadObject = {
        id: id,
        url: url,
        filename: url.substr(url.lastIndexOf('/') + 1),
        saveInFolder: saveInFolder,
        status: 'pending'
      };
      this.queue.push(info);
      this.http.sendRequest(url, {method: "get", responseType: "arraybuffer"}).then(
        res => {
          info.blob = new Blob([res.data], {type: 'audio/mp3'});
          info.status = 'done';
          this.queue.splice(this.queue.indexOf(info), 1);
          this.downloadedFiles.push(info);
          this.handleFiles().then(res => resolve(res)).catch(err => reject(err));
        }
      );
    });
  }

  handleFiles(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if(this.downloadedFiles.length == 0) {
        resolve(true);
        return;
      }

      let downloadedFile = this.downloadedFiles[0];
      this.downloadedFiles.splice(0, 1);

      this.file.createFile(downloadedFile.saveInFolder, downloadedFile.filename, true).then(
        _ => {
          if(downloadedFile == null || downloadedFile.blob == null) {
            console.error("Downloaded file is null");
            reject(false);
          } else {
            this.file.writeFile(downloadedFile.saveInFolder, downloadedFile.filename, downloadedFile.blob, {replace: true}).then(_ => {
              console.log("File created");
              this.handleFiles().then(res => resolve(res)).catch(err => reject(err));
            });
          }
        }
      ).catch(
        err => {
          console.error("Could not create file", err);
          reject(false);
        }
      );
    });
  }
}
