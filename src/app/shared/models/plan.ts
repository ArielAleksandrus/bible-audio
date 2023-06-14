import { HttpClient } from '@angular/common/http';

export interface PlanInfo {
	id: number;
	name: string;
	author: string;
	path: string;
	days: number;
}
export interface PlanChapter {
	chapter: string,
	done: boolean,
	partIdx: number,
	dayObjIdx: number,
	chapterIdx: number,
	globalIdx: number
};
export class Plan implements PlanInfo {
	id: number = -1;
	name: string = '';
	author: string = '';
	path: string = '';
	days: number = -1;

	parts: {
		name: string,
		days: {
			day: number,
			chapters: string[],
			readDone: boolean[],
			done: boolean // for storing progress
		}[],
		done: boolean // for storing progress
	}[] = [];
	done: boolean = false; // for storing progress

	//for optimizing media play
	private _allChapters: PlanChapter[] = [];

	constructor(json: any) {
		for(let key in json) {
			//@ts-ignore
			this[key as keyof Plan] = json[key];
		}
		this._initData();
	}

	getAllChapters(): PlanChapter[] {
		return this._allChapters;
	}
	getGlobalIdx(partIdx: number, dayIdx: number, chapterIdx: number): number {
		let res = 0;
		for(let i = 0; i < this.parts.length; i++) {
			for(let j = 0; j < this.parts[i].days.length; j++)
				for(let k = 0; k < this.parts[i].days[j].chapters.length; k++) {
					if(partIdx == i && dayIdx == j && chapterIdx == k) {
						return res;
					} else {
						res++;
					}
				}
		}
		return -1;
	}
	getPlaylist(fromIdx: number = 0, elementsBefore: number = 5, elementsAfter: number = 5): {playlist: PlanChapter[], selectedIdx: number} {
		let playlist: PlanChapter[] = [];
		let selectedIdx: number = 0;
		for(let i = fromIdx; i < this._allChapters.length; i++) {
			let chap: PlanChapter = this._allChapters[i];
			if(!chap.done) {
				playlist.push(chap);
				elementsAfter--;
				if(elementsAfter <= 0) {
					break;
				}
			}
		}
		for(let i = fromIdx - 1; i >= 0; i--) {
			let chap: PlanChapter = this._allChapters[i];
			if(!chap.done) {
				playlist.unshift(chap);
				selectedIdx++;
				elementsBefore--;
				if(elementsBefore <= 0) {
					break;
				}
			}
		}
		return {playlist: playlist, selectedIdx: selectedIdx};
	}

	partToggle(partIdx: number): 'part'|'plan' {
		let res: 'part'|'plan' = 'part';
		let part = this.parts[partIdx];
		let curValue = part.done;


		// updates all days and chapters
		for(let dayObj of part.days) {
			for(let i = 0; i < dayObj.readDone.length; i++) {
				dayObj.readDone[i] = !curValue;
			}
			dayObj.done = !curValue;
		}

		// check if plan was affected
		this.done = true;
		for(let part of this.parts) {
			if(!part.done)
				this.done = false;
		}

		if(this.done == !curValue)
			res = 'plan';

		this.save();
		return res;
	}
	dayToggle(partIdx: number, dayIdx: number): 'day'|'part'|'plan' {
		let res: 'day'|'part'|'plan' = 'day';
		let part = this.parts[partIdx];
		let dayObj = part.days[dayIdx];
		let curValue = dayObj.done;

		// updates the 'readDone' variable in dayObj
		for(let i = 0; i < dayObj.readDone.length; i++) {
			dayObj.readDone[i] = !curValue;
		}
		dayObj.done = !curValue;

		// check if part was affected
		if(dayObj.done == !curValue) {
			part.done = true;
			for(let day of part.days) {
				if(!day.done)
					part.done = false;
			}
		}
		// check if plan was complete
		if(part.done == !curValue) {
			res = 'part';
			this.done = true;
			for(let part of this.parts) {
				if(!part.done)
					this.done = false;
			}
		}
		if(this.done == !curValue) {
			res = 'plan';
		}

		// update this._allChapters variable
		for(let chap of this._allChapters) {
			if(chap.partIdx == chap.partIdx && chap.dayObjIdx == dayIdx)
				chap.done = !curValue;
		}
		this.save();
		return res;
	}
	chapterToggle(chap: PlanChapter): 'chapter'|'day'|'part'|'plan' {
		let res: 'chapter'|'day'|'part'|'plan' = 'chapter';
		let part = this.parts[chap.partIdx];
		let dayObj = part.days[chap.dayObjIdx];
		let curValue = dayObj.readDone[chap.chapterIdx];
		dayObj.readDone[chap.chapterIdx] = !curValue;

		// check if day was affected
		dayObj.done = true;
		for(let val of dayObj.readDone) {
			if(!val)
				dayObj.done = false;
		}
		// check if part was affected
		if(dayObj.done == !curValue) {
			res = 'day';
			part.done = true;
			for(let day of part.days) {
				if(!day.done)
					part.done = false;
			}
		}
		// check if plan was complete
		if(part.done == !curValue) {
			res = 'part';
			this.done = true;
			for(let part of this.parts) {
				if(!part.done)
					this.done = false;
			}
		}
		if(this.done == !curValue) {
			res = 'plan';
		}

		this._allChapters[chap.globalIdx].done = !curValue;
		this.save();
		return res;
	}

	clear() {
		this.done = false;
		for(let part of this.parts) {
			part.done = false;
			for(let dayObj of part.days) {
				dayObj.done = false;
				for(let i = 0; i < dayObj.chapters.length; i++)
					dayObj.readDone[i] = false;
			}
		}
		for(let chap of this._allChapters) {
			chap.done = false;
		}
		this.save();
	}
	save() {
		localStorage.setItem(`plan ${this.id}`, JSON.stringify(this));

		let arr: {id: number, name: string}[] = [];

		let str = localStorage.getItem('savedPlans');
		if(str) {
			arr = JSON.parse(str);
			let found = arr.find(el => el.id == this.id);
			if(!found) {
				arr.push({id: this.id, name: this.name});
				
			}
		} else {
			arr = [{id: this.id, name: this.name}];
		}
		localStorage.setItem('savedPlans', JSON.stringify(arr));
	}

	/**
	 * Creates the this._allChapters variable.
	 * It is an array of all chapters that the plan includes.
	 */
	private _initData() {
		this._allChapters = [];
		let idx = 0;
		for(let i = 0; i < this.parts.length; i++) {
			let part = this.parts[i];
			for(let j = 0; j < part.days.length; j++) {
				let dayObj = part.days[j];
				if(!dayObj.readDone) {
					// add the 'readDone' array if doesn't exist.
					dayObj.readDone = [];
					for(let k = 0; k < dayObj.chapters.length; k++)
						dayObj.readDone.push(false);
				}
				for(let k = 0; k < dayObj.chapters.length; k++) {
					let planChap: PlanChapter = {
						chapter: dayObj.chapters[k],
						done: dayObj.readDone[k],
						chapterIdx: k,
						dayObjIdx: j,
						partIdx: i,
						globalIdx: idx
					};
					this._allChapters.push(planChap);
					idx++;
				}
			}
		}
	}

	static listSaved(): {id: number, name: string}[] {
		let str = localStorage.getItem('savedPlans');
		if(str) {
			let arr: {id: number, name: string}[] = JSON.parse(str);
			return arr;
		} else {
			return [];
		}
	}
	static loadSaved(id: number): Plan|null {
		let str = localStorage.getItem(`plan ${id}`);
		if(!str)
			return null;

		return new Plan(JSON.parse(str));
	}

	static listLocal(http: HttpClient): Promise<PlanInfo[]> {
		return new Promise((resolve, reject) => {
			http.get('/assets/plans/index.json').subscribe(res => {
				resolve(<PlanInfo[]>res);
				console.log(res);
			}, err => {
				console.error("Plan listLocal", err);
				reject(err);
			})
		});
	}
	static loadLocal(info: PlanInfo, http: HttpClient): Promise<Plan> {
		return new Promise((resolve, reject) => {
			http.get(info.path).subscribe(res => {
				resolve(new Plan(res));
				console.log(res);
			}, err => {
				console.error("Plan loadLocal", err);
				reject(err);
			});
		});
	}
}