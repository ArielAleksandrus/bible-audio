import { BibleBook, BibleBooks } from '../constants/bible-books';
import { File } from '@awesome-cordova-plugins/file/ngx';

import { DownloaderService } from '../services/downloader.service';
import { environment } from '../../../environments/environment';

export interface BookDownloadInfo {
	bookTitle: string,
	chapterCount: number,
	status: 'complete'|'incomplete',
	chapters: {
		chapter: number,
		found: boolean
	}[]
};
export class BibleDownloadHelper {
	existing: BookDownloadInfo[] = [];

	buildAll() {
		this.existing = [];
		for(let book of BibleBooks) {
			let info: BookDownloadInfo = {
				bookTitle: book.title,
				chapterCount: book.chapterCount,
				status: 'complete',
				chapters: []
			}
			for(let i = 1; i <= book.chapterCount; i++) {
				info.chapters.push({chapter: i, found: false});
			}
			this.existing.push(info);
		}
	}
	checkAll(bookIdx: number = 0): Promise<BookDownloadInfo[]> {
		if(bookIdx == 0) {
			this.buildAll();
		}

		

		return new Promise((resolve, reject) => {
			if(bookIdx >= BibleBooks.length) {
				resolve(this.existing);
				return;
			}

			let book = BibleBooks[bookIdx];
			let info = this.existing[bookIdx];
			info.status = 'complete';

			// check if book directory exists
			this.file.checkDir(this.file.externalApplicationStorageDirectory , book.title).then(_ => {
				// book directory exists
				// check if all chapters are downloaded
				this.checkChapters(book).then(res => {
					return this.checkAll(bookIdx + 1);
				});
			}).catch(_ => {
				// book directory does not exist
				for(let i = 0; i < book.chapterCount; i++) {
					info.chapters[i].found = false;
				}
				info.status = 'incomplete';
				return this.checkAll(bookIdx + 1);
			});
		})
	}
	checkChapters(book: BibleBook, idx: number = 1): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if(idx > book.chapterCount) {
				resolve(true);
				return;
			}
			this.file.checkFile(`${this.file.externalApplicationStorageDirectory}`, `${book.title}/${book.title} ${idx}.mp3`).then(_ => {
				// file exists
				let info = this.existing.find(el => el.bookTitle == book.title);
				if(info) {
					info.chapters[idx -1].found = true;
				}
				return this.checkChapters(book, idx + 1);
			}).catch(_ => {
				// file does not exist
				let info = this.existing.find(el => el.bookTitle == book.title);
				if(info) {
					info.chapters[idx -1].found = false;
					info.status = 'incomplete';
				}
				return this.checkChapters(book, idx + 1);
			})
		});
	}

	downloadAll(bookIdx: number = 0): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if(bookIdx >= BibleBooks.length) {
				resolve(true);
				return;
			}

			let book = BibleBooks[bookIdx];

			// check if book directory exists
			this.file.checkDir(this.file.externalApplicationStorageDirectory , book.title).then(_ => {
				// book directory exists
				// check if all chapters are downloaded
				this.downloadChapters(book).then(res =>{ this.downloadAll(bookIdx + 1); resolve(true)});
			}).catch(_ => {
				// book directory does not exist. create it.
				this.file.createDir(this.file.externalApplicationStorageDirectory, book.title, false).then(_ => {
					this.downloadChapters(book).then(res =>{ this.downloadAll(bookIdx + 1); resolve(true)});
				}).catch(e => {
					if(e.message == "PATH_EXISTS_ERR") {
						this.downloadChapters(book).then(res =>{ this.downloadAll(bookIdx + 1); resolve(true)});
						return;
					}
					console.error("CheckDownload createDir error", e);
					reject(false);
				})
			});
		});
	}

	downloadChapters(book: BibleBook, idx: number = 1): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if(idx > book.chapterCount) {
				resolve(true);
				return;
			}

			this.file.checkFile(`${this.file.externalApplicationStorageDirectory}`, `${book.title}/${book.title} ${idx}.mp3`).then(_ => {
				// file exists. do nothing
				console.log(`File "${book.title} ${idx}.mp3" exists`);
				this._updateInfo(book, idx, true);
				this.downloadChapters(book, idx + 1).then(res => resolve(res)).catch(err => reject(err));
			}).catch(_ => {
				// file does not exist. download it.
				console.log(`File "${book.title} ${idx}.mp3" DOES NOT EXIST. download it!`);
				this.downloader.downloadFile(
						`${environment.resource_url}/audio/${book.title}/${book.title} ${idx}.mp3`,
						`${this.file.externalApplicationStorageDirectory}${book.title}`).then(res => {
					this._updateInfo(book, idx, true);
					this.downloadChapters(book, idx + 1).then(res => resolve(res)).catch(err => reject(err));
				}).catch(err => {
					console.log("Error Downloading: ", err);
					this._updateInfo(book, idx, false);
					reject(false);
				});
			});
		});
	}

	private _updateInfo(book: BibleBook, idx: number = 1, exists: boolean) {
		for(let i = 0; i < this.existing.length; i++) {
			if(this.existing[i].bookTitle == book.title) {
				for(let j = 0; j < this.existing[i].chapters.length; j++) {
					if(this.existing[i].chapters[j].chapter == idx) {
						this.existing[i].chapters[j].found = exists;
						let notFound = this.existing[i].chapters.find(el => el.found == false);
						if(!notFound)
							this.existing[i].status = 'complete';
						return;
					}
				}
			}
		}
	}

	constructor(private file: File, private downloader: DownloaderService) {
	}
}