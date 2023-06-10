export class Book {
	title: string;
	author: string;
	description: string;
	chapterCount: number;
	chapters: number[];

	constructor(json: any) {
		this.title = json["title"];
		this.author = json["author"];
		this.description = json["descripton"];
		this.chapterCount = json["chapterCount"];
		this.chapters = [];
		if(this.chapterCount) {
			for(let i = 0; i < this.chapterCount; i++) {
				this.chapters.push(i+1);
			}
		}
	}
}