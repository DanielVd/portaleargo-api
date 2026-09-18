const base = "https://www.portaleargo.it/famiglia/";

const getText = async (url) => {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
	return response.text();
};

const html = await getText(base);
const mainSrc = html.match(/<script[^>]+src=["']([^"']*main-[^"']+\.js)["']/i)?.[1];
if (!mainSrc) throw new Error("main bundle not found");

const mainUrl = new URL(mainSrc, base).href;
const main = await getText(mainUrl);

const bachecaPath = main.match(/["']([^"']*BachecaView-[^"']+\.js)["']/)?.[1];
if (!bachecaPath) throw new Error("BachecaView bundle not found");

const bachecaUrl = new URL(bachecaPath, base).href;
const bacheca = await getText(bachecaUrl);

const dashboardPath =
	bacheca.match(/from["']\.\/(dashboard-[^"']+\.js)["']/)?.[1] ??
	bacheca.match(/["']\.\/(dashboard-[^"']+\.js)["']/)?.[1];
if (!dashboardPath) throw new Error("dashboard service import not found");

const dashboardUrl = new URL(dashboardPath, bachecaUrl).href;
const dashboard = await getText(dashboardUrl);

console.log(`main: ${mainUrl}`);
console.log(`bacheca: ${bachecaUrl}`);
console.log(`dashboard: ${dashboardUrl}`);
console.log(`dashboard bytes: ${dashboard.length}`);

for (const needle of [
	"presaVisioneBacheca",
	"presaAdesioneBacheca",
	"downloadAllegatoBacheca",
	"presavisione",
	"presaadesione",
	"adesione",
]) {
	let index = dashboard.indexOf(needle);
	console.log(`\n=== ${needle} ===`);
	if (index < 0) {
		console.log("NOT FOUND");
		continue;
	}
	console.log(
		dashboard
			.slice(Math.max(0, index - 1500), Math.min(dashboard.length, index + 3500))
			.replace(/\s+/g, " "),
	);
}
