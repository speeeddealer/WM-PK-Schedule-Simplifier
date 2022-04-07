const axios = require("axios").default;
const { JSDOM } = require("jsdom");
const path = require("path");

class Schedule {
	constructor() {
		this.resp;
		this.groupResp;
	}

	async getSchedule() {
		try {
			const response = await axios(
				"http://podzial.mech.pk.edu.pl/stacjonarne/html/lista.html"
			);
			this.resp = response.data;
		} catch (err) {
			console.log(err);
		}
	}

	async getGroupSchedule(group) {
		try {
			const groupResponse = await axios(
				`http://podzial.mech.pk.edu.pl/stacjonarne/html/plany/${group}`
			);
			this.groupResp = groupResponse.data;
		} catch (err) {
			console.log(err);
		}
	}

	generateSchedule(groups) {
		try {
			const editorHTML = new JSDOM(
				`${path.join(__dirname, "..", "html", "editor.html")}`
			);
			const formObject = editorHTML.window.document.createElement("div");
			formObject.innerHTML = this.groupResp;
			const table =
				formObject.querySelectorAll("tbody")[1].firstElementChild
					.firstChild;
			this.formatSchedule(table, groups);
			const markup = `
                <div id="to-print" class="schedule__wrapper">
                    <p class="schedule__header">${groups.gr_std}</p>
                    ${table.innerHTML}
                </div>
                <a href="javascript:void(0);" onclick="printPageArea('to-print')" id="printer">Wydrukuj plan</a>           
            `;
			return markup;
		} catch (err) {
			console.log(err);
			return '<p class="schedule__error__msg">Nie znaleziono grupy studenckiej...</p>';
		}
	}

	formatSchedule(table, groups) {
		const lElements = table.querySelectorAll(".l");
		Array.from(lElements).forEach((el) => {
			const lChildren = el.children;
			const elementsStack = [[]];
			let i = 0;
			Array.from(lChildren).forEach((lEl) => {
				if (
					lEl.classList.contains("p") ||
					lEl.classList.contains("n") ||
					lEl.classList.contains("s")
				) {
					elementsStack[i].push(lEl);
					//console.log(`Pushed element: ${lEl} : ${lEl.textContent}`);
					if (lEl.classList.contains("s")) {
						elementsStack.push([]);
						i++;
					}
				}
				if (lEl.hasAttribute("style")) {
					//console.log(`Element has style attribute`);
					//Then select child elements
					const styleElChildren = lEl.children;
					Array.from(styleElChildren).forEach((styleEl) => {
						if (
							styleEl.classList.contains("p") ||
							styleEl.classList.contains("n") ||
							styleEl.classList.contains("s")
						) {
							elementsStack[i].push(styleEl);
							//console.log(`Pushed style sub element: ${styleEl} : ${styleEl.textContent}`);
							if (styleEl.classList.contains("s")) {
								elementsStack.push([]);
								i++;
							}
						}
					});
				}
			});
			//console.log(`Elements: ${elementsStack}`);

			// Creating templates from elements in array
			if (elementsStack[0].length > 0) {
				let elMarkup = "";
				elementsStack.forEach((arr) => {
					if (arr.length > 0) {
						// Getting name and week
						const roomArray =
							arr[arr.length - 1].innerHTML.split("-");
						const week =
							roomArray[roomArray.length - 1].toUpperCase();
						const name = arr[0].innerHTML.split("-")[0];

						const fullName = `<span class="p">${name}-${week}</span>`;

						//Check if element has any of groups
						const groupsArr = [
							" W-",
							" S-",
							" Ć-",
							" K-",
							" L-",
							" P-",
							"angielski",
							"rosyjski",
							"niemiecki",
							...Object.values(groups),
						];
						//console.log(groupsArr);
						if (!groupsArr.some((gr) => fullName.includes(gr))) {
							return;
						}

						let additionalHref;
						let additionalElement;
						if (arr[1].hasAttribute("href")) {
							additionalHref = `http://podzial.mech.pk.edu.pl/stacjonarne/html/plany/${arr[1].href}`;
							additionalElement = `<a class="n bold" href="${additionalHref}">${arr[1].innerHTML}</a>`;
						} else {
							additionalElement = `<span class="p bold">${arr[1].innerHTML}</span>`;
						}

						let classHref;
						let classElement;
						if (arr[2].hasAttribute("href")) {
							classHref = `http://podzial.mech.pk.edu.pl/stacjonarne/html/plany/${arr[2].getAttribute(
								"href"
							)}`;
							classElement = `<a class="s" href="${classHref}">${arr[2].innerHTML}</a>`;
						} else {
							classElement = `<span class="s">${arr[2].innerHTML}</span>`;
						}

						elMarkup += `${fullName} ${additionalElement} ${classElement}<br>`;
					}
					// Setting new innerHTML
					el.innerHTML = elMarkup;
				});
			}
		});
	}
}

module.exports = Schedule;
