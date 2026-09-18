import { Client } from "../dist/index.js";

const client = new Client({
	dataProvider: null,
	debug: false,
});

await client.bootstrapSession();

const schemaForDashboard = (value) => {
	if (value === null || value === undefined) return String(value);
	if (Array.isArray(value))
		return {
			type: "array",
			length: value.length,
			item:
				value.length > 0 && value[0] && typeof value[0] === "object"
					? Object.fromEntries(
							Object.entries(value[0]).map(([key, child]) => [
								key,
								Array.isArray(child)
									? `array(${child.length})`
									: child === null
										? "null"
										: typeof child,
							]),
						)
					: "unknown",
		};
	return typeof value === "object"
		? Object.keys(value)
		: typeof value;
};

const profile = await client.getProfilo();
const pkScheda = profile.scheda.pk;
const dashboard = await client.getDashboard();

console.log(
	`🔎 dashboard.bachecaAlunno: ${JSON.stringify(schemaForDashboard(dashboard.bachecaAlunno))}`,
);

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

const curriculum = results.get("getCurriculum");
const schede = [
	pkScheda,
	...(Array.isArray(curriculum)
		? curriculum
				.map((entry) =>
					entry && typeof entry === "object" ? entry.pkScheda : undefined,
				)
				.filter((value) => typeof value === "string")
		: []),
].filter((value, index, values) => values.indexOf(value) === index);

let studentAttachmentCandidate;
let readStudentNoticeCandidate;

for (const [index, schedaPk] of schede.entries()) {
	const studentBoardItems = await client.getStoricoBachecaAlunno(schedaPk);

	console.log(
		`✅ getStoricoBachecaAlunno[${index}]: array(${studentBoardItems.length})`,
	);

	if (studentBoardItems.length > 0) {
		console.log(
			`🔎 getStoricoBachecaAlunno[${index}] first item: ${JSON.stringify(schema(studentBoardItems[0]))}`,
		);

		const firstItem = studentBoardItems[0];
		if (!studentAttachmentCandidate && typeof firstItem.pk === "string")
			studentAttachmentCandidate = {
				uid: firstItem.pk,
				pkScheda: schedaPk,
			};

		const alreadyRead = studentBoardItems.find(
			(item) => item?.isPresaVisione === true && typeof item.pk === "string",
		);
		if (!readStudentNoticeCandidate && alreadyRead)
			readStudentNoticeCandidate = {
				prgMessaggio: alreadyRead.pk,
			};
	}
}

if (studentAttachmentCandidate) {
	const response = await client.downloadAllegatoStudente(
		studentAttachmentCandidate.uid,
		studentAttachmentCandidate.pkScheda,
	);
	const data = await response.arrayBuffer();

	if (!data.byteLength)
		throw new Error("Downloaded student attachment is empty");

	console.log(
		`✅ downloadAllegatoStudente: ${response.status} ${response.headers.get("content-type") ?? "unknown"} ${data.byteLength} bytes`,
	);
} else console.log("ℹ️ downloadAllegatoStudente: SKIP_NO_ATTACHMENT");

const bacheca = results.get("getStoricoBacheca");
const readBachecaNotice =
	Array.isArray(bacheca)
		? bacheca.find(
				(item) => item?.isPresaVisione === true && typeof item.pk === "string",
			)
		: undefined;

if (readBachecaNotice)
	await probe("idempotent-presavisione", "famiglia/presavisione", {
		pkScheda,
		prgMessaggio: readBachecaNotice.pk,
	});
else console.log("ℹ️ idempotent-presavisione: SKIP_NO_ALREADY_READ_NOTICE");

if (readStudentNoticeCandidate)
	await probe(
		"idempotent-presavisionebachecaalunno",
		"famiglia/presavisionebachecaalunno",
		readStudentNoticeCandidate,
	);
else
	console.log(
		"ℹ️ idempotent-presavisionebachecaalunno: SKIP_NO_ALREADY_READ_NOTICE",
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

if (receiptTax) {
	const receipt = await client.getRicevuta(receiptTax.iuv);
	console.log(`✅ getRicevuta: ${JSON.stringify(schema(receipt))}`);
} else console.log("ℹ️ getRicevuta: SKIP_NO_RECEIPT");

console.log("✅ Famiglia read-only E2E completed");
