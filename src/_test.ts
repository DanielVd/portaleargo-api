import "dotenv/config";
import { Client } from "./Client";

console.time();
const client = new Client({ debug: true });

await client.login();
const uid = client.dashboard?.bacheca.find((e) => e.listaAllegati.length)
	?.listaAllegati[0]?.pk;

if (uid) {
	const response = await client.downloadAllegato(uid);
	const data = await response.arrayBuffer();

	if (!data.byteLength) throw new Error("Downloaded attachment is empty");

	console.log(
		`Attachment download OK: ${response.status} ${response.headers.get("content-type") ?? "unknown"} ${data.byteLength} bytes`,
	);
}

await Promise.allSettled([
	client.getCorsiRecupero(),
	client
		.getCurriculum()
		.then((c) =>
			Promise.allSettled([
				client.getStoricoBacheca(c.at(-1)!.pkScheda),
				client.getStoricoBachecaAlunno(c.at(-1)!.pkScheda),
			]),
		),
	client.getDettagliProfilo(),
	client.getOrarioGiornaliero(),
	client.getPCTOData(),
	client.getRicevimenti(),
	client.getTasse(),
	client.getVotiScrutinio(),
]);
await client.logOut();
console.timeEnd();
