import { Client } from "../dist/index.js";

const client = new Client({
	dataProvider: null,
	debug: false,
});

await client.getToken();
await client.bootstrapSession();

const profile = await client.getProfilo();
const pkScheda = profile.scheda.pk;

const checks = [
	["getDettagliProfilo", () => client.getDettagliProfilo()],
	["getOrarioGiornaliero", () => client.getOrarioGiornaliero()],
	["getRicevimenti", () => client.getRicevimenti()],
	["getTasse", () => client.getTasse(pkScheda)],
	["getCorsiRecupero", () => client.getCorsiRecupero(pkScheda)],
	["getCurriculum", () => client.getCurriculum(pkScheda)],
	["getStoricoBacheca", () => client.getStoricoBacheca(pkScheda)],
];

const describe = (value) => {
	if (Array.isArray(value)) return `array(${value.length})`;
	if (value === null) return "null";
	if (value && typeof value === "object")
		return `object{${Object.keys(value).join(",")}}`;
	return typeof value;
};

for (const [name, run] of checks) {
	const result = await run();
	console.log(`✅ ${name}: ${describe(result)}`);
}

console.log("✅ Famiglia read-only E2E completed");
