import { Component, OnInit, ViewChild } from '@angular/core';
import { Book } from '../shared/models/book';
import { BibleBooks } from '../shared/constants/bible-books';

import { Platform } from '@ionic/angular';
import { SmartAudioService } from '../shared/services/smart-audio.service';
import { DownloaderService } from '../shared/services/downloader.service';
import { BibleDownloadHelper } from '../shared/helpers/bible-download-helper';

import { SoundEl } from '../audio-controls/sound-el';

import { File } from '@awesome-cordova-plugins/file/ngx';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { HttpClient } from '@angular/common/http';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-bible',
  templateUrl: './bible.component.html',
  styleUrls: ['./bible.component.scss'],

})
export class BibleComponent  implements OnInit {
  books: Book[] = [];

  chapterSelected: {
    book: Book,
    chapter: number,
    id: string,
    folder: string,
    filename: string
  }|null = null;

  deviceType: 'native'|'html' = 'html';

  constructor(public smartAudio: SmartAudioService,
              private file: File,
              private http: HTTP,
              private httpCli: HttpClient,
              private platform: Platform,
              private downloader: DownloaderService,
              private aPerm: AndroidPermissions) {

    if(platform.is('cordova')){
      this.deviceType = 'native';
    }
  }

  checkPermission() {
    this.aPerm.checkPermission(this.aPerm.PERMISSION.WRITE_EXTERNAL_STORAGE).then(
      res => {
        if(!res.hasPermission)
          return this.askStoragePermission();
      },
      err => {
        return this.askStoragePermission();
      }
    );
  }
  askStoragePermission() {
    this.aPerm.requestPermissions([this.aPerm.PERMISSION.READ_EXTERNAL_STORAGE, this.aPerm.PERMISSION.WRITE_EXTERNAL_STORAGE]).then(
      res => {
        console.log("Permission: ", res);
      },
      err => {
        console.error("Permission: ", err);
      }
    );
  }

  ngOnInit() {
    this._loadBooksInfo();
  }

  selectChapter(book: Book, chapter: number) {
    if(this.chapterSelected) {
      this.smartAudio.stop();
    }
    let id = `${book.title}${chapter}`;
    this.chapterSelected = {
      book: book,
      chapter: chapter,
      id: id,
      folder: `${this.file.externalApplicationStorageDirectory}${book.title}`,
      filename: `${book.title} ${chapter}.mp3`
    };

    this.smartAudio.playSound(this, this.createSound(book, chapter), {
      soundEnded: this.finishedAudio,
      onPrev: this.prev,
      onNext: this.next
    });

    let nxt = this.nextChapter();
    if(nxt)
      this.smartAudio.setNext(this.createSound(nxt.book, nxt.chapter));
    let prv = this.prevChapter();
    if(prv)
      this.smartAudio.setPrev(this.createSound(prv.book, prv.chapter));
  }

  createSound(book: Book, chapter: number): SoundEl {
    let id = `${book.title}${chapter}`;
    return {
      key: id,
      name: `${book.title} ${chapter}`,
      asset: `${this.file.externalApplicationStorageDirectory}${book.title}/${book.title} ${chapter}.mp3`,
      type: 'native'
    };
  }

  finishedAudio(context: any, sound: SoundEl) {
    context.next();
    console.log("Finished: ", sound);
  }

  toggle() {
    if(this.smartAudio.active)
      this.smartAudio.toggle();
  }
  nextChapter(): {book: Book, chapter: number}|null {
    if(!this.chapterSelected) {
      return null;
    }
    let chapter = this.chapterSelected.chapter;
    let book = this.chapterSelected.book;

    if(chapter >= book.chapterCount) { // go to next book
      let idx = this.books.indexOf(book);
      if(this.books[idx + 1]) { // has next
        book = this.books[idx + 1];
        chapter = 1;
      } else { // is last. Revelation book.
        book = this.books[0];
      }
    } else { // go to next chapter
      chapter += 1;
    }
    return {book: book, chapter: chapter};
  }
  next(context = this) {
    let res = context.nextChapter();
    if(res)
      context.selectChapter(res.book, res.chapter);
  }

  prevChapter(): {book: Book, chapter: number}|null {
    if(!this.chapterSelected) {
      return null;
    }

    let chapter = this.chapterSelected.chapter;
    let book = this.chapterSelected.book;  

    if(chapter <= 1) { // go to prev book
      let idx = this.books.indexOf(book);
      if(idx > 0) { // has prev
        book = this.books[idx - 1];
      } else { // is First. Genesis book.
        book = this.books[this.books.length - 1];
      }
      chapter = book.chapterCount;
    } else { // go to prev chapter
      chapter -= 1;
    }
    return {book: book, chapter: chapter};
  }
  prev(context = this) {
    context.smartAudio.position().then(secs => {
      if(!context.chapterSelected)
        return;
      console.log(secs, context.chapterSelected.book, context.chapterSelected.chapter);
      // go to audio's beginning if played more than 5 seconds
      if(secs > 5) {       
        context.selectChapter(context.chapterSelected.book, context.chapterSelected.chapter);
      } else {
        let res = context.prevChapter();
        if(res)
          context.selectChapter(res.book, res.chapter);
      }
      
    });
  }

  downloadBible() {
    /*if(this.deviceType == 'native') {
      this._downloadBibleNative();
      return;
    }

    let url = `${environment.resource_url}/audio.zip`;
    if(confirm("Quer baixar a Bíblia inteira? O download é de 1.6Gb. Recomendado fazer via Wi-Fi")) {
      window.open(url);
    }*/
    this._downloadBibleNative();
  }
  private _downloadBibleNative() {
    let helper = new BibleDownloadHelper(this.file, this.downloader);
    helper.checkDownloaded();
  }

  private _loadBooksInfo() {
    this.books = [];
    for(let book of BibleBooks) {
      this.books.push(new Book(book));
    }
  }
}
