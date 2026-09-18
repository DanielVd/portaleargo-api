const base = "https://www.portaleargo.it/famiglia/";

const needles = [
	"storicobacheca",
	"bachecaAlunno",
	"bachecaalunno",
	"adesione",
	"visione",
	"presaVisione",
	"presaAdesione",
	"presavisioneadesione",
	"presavisionebachecaalunno",
	"presaadesione",
	"presavisione",
	"presavisionenote",
];

const htmlResponse = await fetch(base);
if (!htmlResponse.ok)
	throw new Error(`Frontend HTTP ${htmlResponse.status}`);

const html = await htmlResponse.text();
const initial = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
	.map((match) => new URL(match[1], base).href);

console.log(`frontend scripts: ${initial.length}`);
for (const url of initial) console.log(`script: ${url}`);

const queue = [...initial];
const seen = new Set();
let matches = 0;

while (queue.length > 0 && seen.size < 300) {
	const url = queue.shift();
	if (seen.has(url)) continue;
	seen.add(url);

	let response;
	try {
		response = await fetch(url);
	} catch {
		continue;
	}
	if (!response.ok) continue;

	const body = await response.text();

	for (const needle of needles) {
		let offset = 0;
		let count = 0;

		while (count < 6) {
			const index = body.indexOf(needle, offset);
			if (index < 0) break;

			const start = Math.max(0, index - 900);
			const end = Math.min(body.length, index + needle.length + 1500);
			const snippet = body
				.slice(start, end)
				.replace(/\s+/g, " ")
				.slice(0, 2500);

			console.log(`\n### ${needle} @ ${url}\n${snippet}`);
			matches += 1;
			offset = index + needle.length;
			count += 1;
		}
	}

	for (const match of body.matchAll(/["']([^"'\\s]+\.js(?:\?[^"']*)?)["']/g)) {
		try {
			const child = new URL(match[1], url).href;
			if (
				child.startsWith(new URL(base).origin) &&
				!seen.has(child) &&
				!queue.includes(child)
			)
				queue.push(child);
		} catch {
			// Ignore non-URL strings.
		}
	}
}

console.log(`scanned scripts: ${seen.size}`);
console.log(`mutative matches: ${matches}`);
