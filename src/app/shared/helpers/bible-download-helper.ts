import { BibleBook, BibleBooks } from '../constants/bible-books';
import { File } from '@awesome-cordova-plugins/file/ngx';

import { DownloaderService } from '../services/downloader.service';
import { environment } from '../../../environments/environment';


export class BibleDownloadHelper {
	checkDownloaded(idx: number = 0): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if(idx >= BibleBooks.length) {
				resolve(true);
				return;
			}

			let book = BibleBooks[idx];

			// check if book directory exists
			this.file.checkDir(this.file.externalApplicationStorageDirectory , book.title).then(_ => {
				// book directory exists
				// check if all chapters are downloaded
				this.downloadChapters(book).then(res =>{ this.checkDownloaded(idx + 1); resolve(true)});
			}).catch(_ => {
				// book directory does not exist. create it.
				this.file.createDir(this.file.externalApplicationStorageDirectory, book.title, false).then(_ => {
					this.downloadChapters(book).then(res =>{ this.checkDownloaded(idx + 1); resolve(true)});
				}).catch(e => {
					if(e.message == "PATH_EXISTS_ERR") {
						this.downloadChapters(book).then(res =>{ this.checkDownloaded(idx + 1); resolve(true)});
						return;
					}
					console.error("CheckDownload createDir error", e);
					reject(false);
				})
			});
		});
	}

	downloadChapters(book: BibleBook, idx: number = 1): Promise<boolean> {
		console.log(`${this.file.externalApplicationStorageDirectory}${book.title}`);
		return new Promise((resolve, reject) => {
			if(idx > book.chapterCount) {
				resolve(true);
				return;
			}

			this.file.checkFile(`${this.file.externalApplicationStorageDirectory}${book.title}`, `${book.title} ${idx}.mp3`).then(_ => {
				// file exists. do nothing
				console.log(`File "${book.title} ${idx}.mp3" exists`);
				this.downloadChapters(book, idx + 1).then(res => resolve(res)).catch(err => reject(err));
			}).catch(_ => {
				// file does not exist. download it.
				console.log(`File "${book.title} ${idx}.mp3" DOES NOT EXIST. download it!`);
				this.downloader.downloadFile(
						`${environment.resource_url}/audio/${book.title}/${book.title} ${idx}.mp3`,
						`${this.file.externalApplicationStorageDirectory}${book.title}`).then(res => {
					this.downloadChapters(book, idx + 1).then(res => resolve(res)).catch(err => reject(err));
				}).catch(err => {
					console.log("Error Downloading: ", err);
					reject(false);
				});
			});
		});
	}

	constructor(private file: File, private downloader: DownloaderService) {
	}
}