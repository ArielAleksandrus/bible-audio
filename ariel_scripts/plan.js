let result = {};
let dayLinks = document.getElementsByClassName("slick-slide");

function checkLinks(links, i) {
  if(i == 0)
  	result = {
	    name: document.getElementsByClassName("plan-title")[0].innerHTML.split('(')[1].split(')')[0],
	    days: []
    }
	if(i > links.length) {
	  console.log(result);
	}
	links[i].click();

  result.days.push({
  	day: i+1,
  	chapters: []
  });
	setTimeout(() => {
		let ul = document.getElementsByClassName("no-bullets plan-pieces")[0];
		let rows = ul.getElementsByTagName("a");
		for(let row of rows) {
		  if(row.href.length > 10) {
		    result.days[i].chapters.push(row.innerHTML);
		  }
		}
		checkLinks(links, i+1);
	}, 2000);
}
checkLinks(dayLinks, 0);