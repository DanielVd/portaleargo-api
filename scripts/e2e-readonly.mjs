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
	["getVotiScrutinio", () => client.getVotiScrutinio()],
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

const schema = (value) => {
	if (value === null) return "null";
	if (Array.isArray(value))
		return {
			type: "array",
			length: value.length,
			item: value.length > 0 ? schema(value[0]) : "unknown",
		};
	if (value && typeof value === "object")
		return Object.fromEntries(
			Object.entries(value).map(([key, child]) => [key, schema(child)]),
		);
	return typeof value;
};

const results = new Map();

for (const [name, run] of checks) {
	const result = await run();
	results.set(name, result);
	console.log(`✅ ${name}: ${describe(result)}`);
}

const probe = async (name, path, body) => {
	const response = await client.famigliaRequest(path, {
		method: "POST",
		body,
		noWait: true,
	});

	let payload;
	try {
		payload = await response.json();
	} catch {
		payload = { nonJson: true };
	}

	console.log(
		`🔎 ${name}: HTTP ${response.status} ${JSON.stringify(schema(payload))}`,
	);

	return { response, payload };
};

const studentBoard = await probe(
	"storicobachecaalunno",
	"famiglia/storicobachecaalunno",
	{ pkScheda },
);

const studentBoardItems = studentBoard.payload?.data?.bachecaAlunno;
if (Array.isArray(studentBoardItems) && studentBoardItems.length > 0)
	console.log(
		`🔎 storicobachecaalunno first item: ${JSON.stringify(schema(studentBoardItems[0]))}`,
	);

await probe("pcto", "famiglia/pcto", { pkScheda });

const taxes = results.get("getTasse");
const receiptTax =
	taxes && typeof taxes === "object" && Array.isArray(taxes.tasse)
		? taxes.tasse.find(
				(tax) =>
					tax &&
					typeof tax === "object" &&
					tax.rtPresent === true &&
					typeof tax.iuv === "string" &&
					tax.iuv.length > 0,
			)
		: undefined;

if (receiptTax)
	await probe("ricevutatelematica", "pagamenti/ricevutatelematica", {
		iuv: receiptTax.iuv,
	});
else console.log("ℹ️ ricevutatelematica: SKIP_NO_RECEIPT");

console.log("✅ Famiglia read-only E2E completed");
