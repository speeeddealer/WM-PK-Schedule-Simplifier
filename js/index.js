const fs = require("fs");
const http = require("http");
const url = require("url");
const path = require("path");
const { JSDOM } = require("jsdom");
const Schedule = require("./schedule");

const port = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
	const search = url.parse(req.url, true);
	const pathName = search.pathname;
	//console.log(search, pathName);

	if (pathName === "/home" || pathName === "/") {
		fs.readFile(
			`${path.join(__dirname, "..", "html", "index.html")}`,
			"utf-8",
			(err, data) => {
				if (err) console.log(err);
				res.writeHead(200, { "Content-type": "text/html" });
				res.end(data);
			}
		);
	} else if (pathName === "/editor") {
		fs.readFile(
			`${path.join(__dirname, "..", "html", "editor.html")}`,
			"utf-8",
			async (err, data) => {
				if (err) console.log(err);
				res.writeHead(200, { "Content-type": "text/html" });
				let output = data;
				// 1. Getting whole schedule
				const schedule = new Schedule();
				await schedule.getSchedule();

				let groups = search.query;
				groups.gr_cw = groups.gr_cw ? ` Ć${groups.gr_cw}` : undefined;
				groups.gr_komp = groups.gr_komp
					? ` K${groups.gr_komp}`
					: undefined;
				groups.gr_lab = groups.gr_lab
					? ` L${groups.gr_lab}`
					: undefined;
				groups.gr_proj = groups.gr_proj
					? ` P${groups.gr_proj}`
					: undefined;
				groups.gr_wf = groups.gr_wf ? groups.gr_wf : undefined;
				groups.gr_semi = groups.gr_semi
					? ` S${groups.gr_semi}`
					: undefined;

				// 2. Checking groups input
				if (groups.gr_std && schedule.resp) {
					// 3. Searching specific gr_std htmlRef
					groups.gr_std = groups.gr_std.toUpperCase();
					const index = schedule.resp.search(groups.gr_std);
					let groupRef = schedule.resp.substring(
						index - 24,
						index - 16
					);
					if (groupRef && groupRef[0] != "o")
						groupRef = `o${groupRef}`;
					// 4. Getting an html of a specific group
					await schedule.getGroupSchedule(groupRef);

					if (schedule.groupResp) {
						output = output.replace(
							"<!--{%TABLE%}-->",
							schedule.generateSchedule(groups)
						);
					}
				}
				res.end(output);
			}
		);
	} else if (/\.js$/i.test(pathName)) {
		fs.readFile(
			`${path.join(__dirname, "..", pathName)}`,
			"utf-8",
			(err, data) => {
				if (err) console.log(err);
				res.writeHead(200, { "Content-type": "text/javascript" });
				res.end(data);
			}
		);
	} else if (/\.css$/i.test(pathName)) {
		fs.readFile(
			`${path.join(__dirname, "..", pathName)}`,
			"utf-8",
			(err, data) => {
				if (err) console.log(err);
				res.writeHead(200, { "Content-type": "text/css" });
				res.end(data);
			}
		);
	} else if (/\.(jpg|jpeg|png|gif|svg)$/i.test(pathName)) {
		fs.readFile(`${path.join(__dirname, "..", pathName)}`, (err, data) => {
			res.writeHead(200, { "Content-type": "image/jpg" });
			res.end(data);
		});
	} else {
		res.writeHead(404, { "Content-type": "text/html" });
		res.end("URL was not found on the server");
	}
});

server.listen(port, () => {
	console.log("Listening for requests");
});
