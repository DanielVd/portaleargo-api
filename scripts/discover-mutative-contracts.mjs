const base = "https://www.portaleargo.it/famiglia/";

const htmlResponse = await fetch(base);
if (!htmlResponse.ok)
	throw new Error(`Frontend HTTP ${htmlResponse.status}`);

const html = await htmlResponse.text();
const sources = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
	.map((match) => new URL(match[1], base).href);

console.log(`frontend scripts: ${sources.length}`);

const needles = [
	"presavisioneadesione",
	"presavisionebachecaalunno",
	"presaadesione",
	"presavisione",
	"presavisionenote",
];

for (const url of sources) {
	const response = await fetch(url);
	if (!response.ok) continue;

	const body = await response.text();

	for (const needle of needles) {
		let offset = 0;
		let count = 0;

		while (count < 4) {
			const index = body.indexOf(needle, offset);
			if (index < 0) break;

			const start = Math.max(0, index - 700);
			const end = Math.min(body.length, index + needle.length + 1000);
			const snippet = body
				.slice(start, end)
				.replace(/\s+/g, " ")
				.slice(0, 1800);

			console.log(`\n### ${needle} @ ${url}\n${snippet}`);
			offset = index + needle.length;
			count += 1;
		}
	}
}
