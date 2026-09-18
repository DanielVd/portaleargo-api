import type { Json } from "./general";

export type FamigliaAPIResponse<T = Json> = {
	success: boolean;
	data: T;
	msg?: string | null;
	message?: string | null;
};

export type FamigliaAPILogin = FamigliaAPIResponse<
	{

			codMin: string;
			opzioni: {
				valore: boolean;
				chiave: string;
			}[];
			isPrimoAccesso: boolean;
			profiloDisabilitato: boolean;
			isResetPassword: boolean;
			isSpid: boolean;
			token: string;
			username: string;
	}[]
> & {
	total: number;
};

type FamigliaAnno = {
	anno: string;
	dataInizio: string;
	dataFine: string;
};

export type FamigliaAPIProfilo = FamigliaAPIResponse<{
	resetPassword: boolean;
	ultimoCambioPwd: string | null;
	anno: FamigliaAnno;
	annoCorrente: FamigliaAnno;
	genitore: {
		desEMail: string;
		nominativo: string;
		genitorePK: string;
	};
	profiloDisabilitato: boolean;
	isSpid: boolean;
	alunno: {
		isUltimaClasse: boolean;
		nominativo: string;
		cognome: string;
		nome: string;
		alunnoPK: string;
		maggiorenne: boolean;
		desEmail: string | null;
	};
	scheda: {
		pk: string;
		anno: number;
		aggiornaSchedaPK: boolean;
		classe: {
			pk: string;
			desDenominazione: string;
			desSezione: string;
		};
		sede: {
			pk: string;
			descrizione: string;
		};
		scuola: {
			pk: string;
			desOrdine: string;
			descrizione: string;
		};
		corso: {
			pk: string;
			descrizione: string;
		};
	};
	primoAccesso: boolean;
	profiloStorico: boolean;
}>;

export type FamigliaAPIDettagliProfilo = FamigliaAPIResponse<{
	utente: {
		flgUtente: string;
	};
	genitore: {
		pk: string;
		desNome: string;
		desCognome: string;
		flgSesso: string;
		datNascita: string;
		desTelefono: string;
		desCellulare: string | null;
		desEMail: string;
	};
	titoliStudio: {
		prgTitolo: number;
		desTitolo: string;
	}[];
	alunno: {
		pk: string;
		nome: string;
		cognome: string;
		desEmail: string | null;
		maggiorenne: boolean;
		sesso: string;
		datNascita: string;
		desTelefono: string;
		desCellulare: string | null;
		desCf: string;
		desVia: string;
		desCap: string;
		desComuneResidenza: string;
		desComuneNascita: string;
		desComuneRecapito: string;
		desIndirizzoRecapito: string;
		cittadinanza: string;
		desCapResidenza: string;
		ultimaClasse: boolean;
	};
	attivita: {
		codAttivita: string;
		desDescrizione: string;
	}[];
}>;

export type FamigliaAPIDashboard = FamigliaAPIResponse<{
	dati: {
		[key: string]: Json;
	}[];
}>;

export type FamigliaAPIOrarioGiornaliero = FamigliaAPIResponse<{
	dati: Record<
		string,
		{
			scuAnagrafePK: string;
			desNome: string;
			desCognome: string;
			desEmail: string;
			docente: string;
			desDenominazione: string;
			desSezione: string;
			materia: string;
			numOra: number;
			mostra: boolean;
		}[]
	>;
}>;

export type FamigliaBachecaItem = {
	pk: string;
	categoria: string;
	messaggio: string;
	autore: string;
	data: string;
	dataScadenza: string;
	url: string;
	isPresaVisione: boolean;
	dataConfermaPresaVisione?: string;
	isPresaAdesioneConfermata: boolean;
	adRichiesta: boolean;
	pvRichiesta: boolean;
	listaAllegati: {
		pk: string;
		url: string;
		path: string;
		descrizioneFile: string;
		nomeFile: string;
	}[];
	operazione: "I";
	datEvento: string;
};

export type FamigliaAPIBacheca = FamigliaAPIResponse<{
	bacheca: FamigliaBachecaItem[];
}>;

export type FamigliaBachecaAlunnoItem = {
	operazione: string;
	nomeFile: string;
	datEvento: string;
	messaggio: string;
	data: string;
	flgDownloadGenitore: string;
	isPresaVisione: boolean;
	pk: string;
};

export type FamigliaAPIBachecaAlunno = FamigliaAPIResponse<{
	bachecaAlunno: FamigliaBachecaAlunnoItem[];
}>;

export type FamigliaAPIDownloadAllegato =
	| {
			success: false;
			msg?: string | null;
			message?: string | null;
	  }
	| {
			success: true;
			url: string;
	  };

export type FamigliaAPIRicevutaTelematica =
	| {
			success: false;
			msg?: string | null;
			message?: string | null;
	  }
	| {
			success: true;
			fileName: string;
			url: string;
	  };

export type FamigliaAPITassa = {
	nominativo: string;
	descrizione: string;
	importoTassa: string;
	importoPrevisto: string;
	importoPagato: string | null;
	dataPagamento: string | null;
	scadenza: string;
	pagabileOltreScadenza: boolean;
	rata: string;
	iuv: string | null;
	stato: string;
	status: string;
	rtPresent: boolean;
	rptPresent: boolean;
	isPagoOnLine: boolean;
	dataCreazione: string | null;
	debitore: string;
	idTax: string;
	isEditable: boolean;
	importoMin: string;
	importoMax: string;
	isVolontario: boolean;
	isPagoInRete: boolean;
	isAvvisoPagoInRete: boolean;
	cfPagatore: string;
	listaSingoliPagamenti:
		| {
				importoTassa: string;
				importoPrevisto: string;
		  }[]
		| null;
};

export type FamigliaAPITasse = {
	success: boolean;
	isPagoOnlineAttivo: boolean;
	isPagOnlineAttivo: boolean;
	data: FamigliaAPITassa[];
	listaTasse: FamigliaAPITassa[];
	msg?: string | null;
	message?: string | null;
};

export type FamigliaAPIVotiScrutinio = FamigliaAPIResponse<{
	votiScrutinio: {
		periodi?: Json[];
	}[];
}>;

export type FamigliaAPIRicevimenti = FamigliaAPIResponse<{
	disponibilita: Record<string, Json>;
	genitoreOAlunno: {
		desEMail: string;
		nominativo: string;
		pk: string;
		telefono: string;
	}[];
	listaDisponibilita: Json[];
	tipoAccesso: string;
	prenotazioni: Json[];
}>;

export type FamigliaAPICorsiRecupero = FamigliaAPIResponse<{
	corsiRecupero: Json[];
	periodi: Json[];
}>;

export type FamigliaAPICurriculum = FamigliaAPIResponse<{
	curriculum: {
		pkScheda: string;
		classe: string;
		anno: number;
		esito: Json;
		mostraCredito: boolean;
		credito: number;
		isSuperiore: boolean;
		isInterruzioneFR: boolean;
		media?: string;
		ordineScuola: string;
		mostraInfo: boolean;
		cvabilitato: boolean;
	}[];
}>;
