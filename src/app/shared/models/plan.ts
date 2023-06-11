import { HttpClient } from '@angular/common/http';

export interface PlanInfo {
	id: number;
	name: string;
	author: string;
	path: string;
	days: number;
}
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

	constructor(json: any) {
		for(let key in json) {
			//@ts-ignore
			this[key as keyof Plan] = json[key];
		}
	}

	getChapters(partName: string, day: number): {chapter: string, done: boolean}[] {
		if(day < 1)
			return [];

		let res: {chapter: string, done: boolean}[] = [];
		let part = this.parts.find(el => el.name == partName);
		if(part) {
			let dayObj: any = part.days.find(el => el.day == day);
			if(dayObj) {
				for(let i = 0; i < dayObj.chapters.length; i++) {
					res.push({chapter: dayObj.chapters[i], done: dayObj.readDone[i]});
				}
			} else {
				if(day > part.days[part.days.length - 1].day) { // skip to next part

				}
				return this.getChapters(this.parts[this.parts.indexOf(part) + 1].name, day - part.days.length);
			}
		}
		return res;
	}

	nextDay(): {
		partName: string,
		dayObj: {
			day: number,
			chapters: string[],
			done: boolean,
			readDone: boolean[]
		}
	}|null {
		for(let part of this.parts) {
			if(!part.done) {
				for(let dayObj of part.days) {
					if(!dayObj.done) {
						return {
							partName: part.name,
							dayObj: {
								day: dayObj.day,
								chapters: dayObj.chapters,
								done: false,
								readDone: dayObj.readDone
							}
						};
					}
				}
			}
		}

		// plan is completed. return first day.
		let aux = {
			partName: this.parts[0].name,
			dayObj: {
				day: this.parts[0].days[0].day,
				chapters: this.parts[0].days[0].chapters,
				done: false,
				readDone: []
			}
		};
		for(let i = 0; i < aux.dayObj.chapters.length; i++){
			aux.dayObj.readDone = []
			// @ts-ignore
			aux.dayObj.readDone.push(false);
		}

		return aux;
	}

	partRead(partName: string) {
		let part = this.parts.find(el => el.name == partName);
		if(part) {
			for(let dayObj of part.days) {
				this.dayRead(partName, dayObj.day);
			}
			part.done = true;
		}
		this.save();
	}
	dayRead(partName: string, day: number) {
		let part = this.parts.find(el => el.name == partName);
		if(part) {
			let dayObj = part.days.find(el => el.day == day);
			if(dayObj) {
				dayObj.readDone = [];
				for(let i = 0; i < dayObj.chapters.length; i++)
					dayObj.readDone.push(true);

				dayObj.done = true;
			}
		}
		this.save();
	}
	chapterRead(partName: string, day: number, chapter: string) {
		let part = this.parts.find(el => el.name == partName);
		if(part) {
			let dayObj = part.days.find(el => el.day == day);
			if(dayObj) {
				let idx = dayObj.chapters.indexOf(chapter);
				dayObj.readDone[idx] = true;

				// check if day is complete
				dayObj.done = true;
				for(let val of dayObj.readDone) {
					if(!val)
						dayObj.done = false;
				}
				// check if part is complete
				if(dayObj.done) {
					part.done = true;
					for(let day of part.days) {
						if(!day.done)
							part.done = false;
					}
				}
				// check if plan is complete
				this.done = true;
				for(let part of this.parts) {
					if(!part.done)
						this.done = false;
				}

			}
		}
		this.save();
	}

	clear() {
		this.done = false;
		for(let part of this.parts) {
			part.done = false;
			for(let dayObj of part.days) {
				dayObj.done = false;
				dayObj.readDone = [];
				for(let i = 0; i < dayObj.chapters.length; i++)
					dayObj.readDone.push(false);
			}
		}
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