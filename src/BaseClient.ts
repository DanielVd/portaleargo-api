import type {
	APIBachecaAlunno,
	APIDashboard,
	APIDownloadAllegato,
	APIPresavisioneAdesione,
	APILogin,
	APIPCTO,
	APIProfilo,
	APIResponse,
	APIRicevutaTelematica,
	APIToken,
	APIWhat,
	ClientOptions,
	Credentials,
	Dashboard,
	HttpMethod,
	Json,
	LoginLink,
	FamigliaAPIBacheca,
	FamigliaAPICurriculum,
	FamigliaAPIDettagliProfilo,
	FamigliaAPIDashboard,
	FamigliaAPIDownloadAllegato,
	FamigliaAPILogin,
	FamigliaAPIOrarioGiornaliero,
	FamigliaAPIProfilo,
	FamigliaAPIRicevimenti,
	FamigliaAPICorsiRecupero,
	FamigliaAPITasse,
	FamigliaAPIVotiScrutinio,
	ReadyClient,
	Token,
} from "./types";
import {
	clientId,
	defaultVersion,
	formatDate,
	getToken,
	handleOperation,
	randomString,
} from "./util";

/**
 * Un client per interagire con l'API
 */
export abstract class BaseClient {
	static readonly BASE_URL = "https://www.portaleargo.it";
	static readonly FAMIGLIA_BASE_URL = "https://didattica.portaleargo.it/famiglia/api";
	static readonly FAMIGLIA_VERSION = "4.1.0";

	/**
	 * A custom fetch implementation
	 */
	fetch = fetch;

	/**
	 * I dati del token
	 */
	token?: Token;

	/**
	 * I dati del login
	 */
	loginData?: APILogin["data"][number];

	/**
	 * Dati della sessione applicativa della API Famiglia.
	 *
	 * Restano separati da loginData finché la migrazione non è completa.
	 */
	apiSession?: FamigliaAPILogin["data"][number];

	/**
	 * Profilo restituito dalla API Famiglia.
	 */
	famigliaProfile?: FamigliaAPIProfilo["data"];

	/**
	 * Dashboard restituita dalla API Famiglia.
	 *
	 * Resta separata da dashboard finché la migrazione non è completa.
	 */
	famigliaDashboard?: FamigliaAPIDashboard["data"]["dati"][number];

	/**
	 * I dati del profilo
	 */
	profile?: APIProfilo["data"];

	/**
	 * I dati della dashboard
	 */
	dashboard?: Dashboard;

	/**
	 * Se scrivere nella console alcuni dati utili per il debug
	 */
	debug: boolean;

	/**
	 * Headers aggiuntivi per ogni richiesta API
	 */
	headers?: Record<string, string>;

	/**
	 * Le funzioni per leggere e scrivere i dati.
	 * Impostare questo valore forzerà `dataPath` a `null`
	 */
	dataProvider?: NonNullable<ClientOptions["dataProvider"]>;

	/**
	 * La versione di didUp da specificare nell'header.
	 * * Modificare questa opzione potrebbe creare problemi nell'utilizzo della libreria
	 */
	version: string;

	/**
	 * Le credenziali usate per l'accesso
	 */
	credentials?: Partial<Credentials>;

	#ready = false;

	/**
	 * @param options - Le opzioni per il client
	 */
	constructor(options: ClientOptions = {}) {
		this.credentials = {
			schoolCode: options.schoolCode,
			password: options.password,
			username: options.username,
		};
		this.token = options.token;
		this.loginData = options.loginData;
		this.profile = options.profile;
		this.dashboard = options.dashboard;
		this.debug = options.debug ?? false;
		this.version = options.version ?? defaultVersion;
		this.headers = options.headers;
		if (options.dataProvider !== null) this.dataProvider = options.dataProvider;
	}

	/**
	 * Controlla se il client è pronto
	 */
	isReady(): this is ReadyClient {
		return this.#ready;
	}

	/**
	 * Effettua una richiesta API.
	 * @param path - Il percorso della richiesta
	 * @param options - Altre opzioni
	 * @returns La risposta
	 */
	apiRequest<T extends Json>(
		path: string,
		options?: Partial<{
			body: Json;
			method: HttpMethod;
			noWait: false;
		}>,
	): Promise<T>;
	apiRequest<T extends Json>(
		path: string,
		options: {
			body?: Json;
			method?: HttpMethod;
			noWait: true;
		},
	): Promise<Omit<Response, "json"> & { json: () => Promise<T> }>;
	async apiRequest(
		path: string,
		options: Partial<{
			body: Json;
			method: HttpMethod;
			noWait: boolean;
		}> = {},
	): Promise<unknown> {
		const headers: Record<string, string> = {
			accept: "application/json",
			"argo-client-version": this.version,
			authorization: `Bearer ${this.token?.access_token ?? ""}`,
		};

		options.method ??= options.body ? "POST" : "GET";
		if (options.body != null) headers["content-type"] = "application/json";
		if (this.loginData) {
			headers["x-auth-token"] = this.loginData.token;
			headers["x-cod-min"] = this.loginData.codMin;
		}
		if (this.token)
			headers["x-date-exp-auth"] = formatDate(this.token.expireDate);
		if (this.headers) Object.assign(headers, this.headers);
		const res = await this.fetch(
			`${BaseClient.BASE_URL}/appfamiglia/api/rest/${path}`,
			{
				headers,
				method: options.method,
				body: options.body != null ? JSON.stringify(options.body) : undefined,
			},
		);

		if (this.debug) console.debug(`${options.method} /${path} ${res.status}`);
		return options.noWait ? res : (res.json() as unknown);
	}

	/**
	 * Effettua una richiesta alla API Famiglia.
	 */
	famigliaRequest<T extends Json>(
		path: string,
		options?: Partial<{
			body: Json;
			method: HttpMethod;
			noWait: false;
		}>,
	): Promise<T>;
	famigliaRequest<T extends Json>(
		path: string,
		options: {
			body?: Json;
			method?: HttpMethod;
			noWait: true;
		},
	): Promise<Omit<Response, "json"> & { json: () => Promise<T> }>;
	async famigliaRequest(
		path: string,
		options: Partial<{
			body: Json;
			method: HttpMethod;
			noWait: boolean;
		}> = {},
	): Promise<unknown> {
		const headers: Record<string, string> = {
			accept: "application/json",
			"argo-client-version": BaseClient.FAMIGLIA_VERSION,
			"os-type": "WEB",
			authorization: `Bearer ${this.token?.access_token ?? ""}`,
		};

		options.method ??= options.body ? "POST" : "GET";

		if (options.body != null)
			headers["content-type"] = "application/json";

		if (this.apiSession) {
			headers["x-auth-token"] = this.apiSession.token;
			headers["x-cod-min"] = this.apiSession.codMin;
		}

		if (this.headers) Object.assign(headers, this.headers);

		const res = await this.fetch(
			`${BaseClient.FAMIGLIA_BASE_URL}/${path}`,
			{
				headers,
				method: options.method,
				body: options.body != null ? JSON.stringify(options.body) : undefined,
			},
		);

		if (this.debug)
			console.debug(
				`${options.method} ${BaseClient.FAMIGLIA_BASE_URL}/${path} ${res.status}`,
			);

		return options.noWait ? res : (res.json() as unknown);
	}

	/**
	 * Inizializza la sessione applicativa della API Famiglia
	 * utilizzando il Bearer OAuth già ottenuto dal client.
	 */
	async bootstrapSession() {
		const login = await this.famigliaRequest<FamigliaAPILogin>("login", {
			body: {},
		});

		if (!login.success)
			throw new Error(
				login.message ?? login.msg ?? "Famiglia API login failed",
			);

		const [apiSession] = login.data;

		if (!apiSession) throw new Error("Famiglia API login returned no session");

		this.apiSession = apiSession;
		return apiSession;
	}

	/**
	 * Recupera il profilo dalla API Famiglia.
	 */
	async getProfilo() {
		if (!this.apiSession) await this.bootstrapSession();

		const profile = await this.famigliaRequest<FamigliaAPIProfilo>("profilo");

		if (!profile.success)
			throw new Error(
				profile.message ?? profile.msg ?? "Famiglia profile request failed",
			);

		this.famigliaProfile = profile.data;
		return this.famigliaProfile;
	}

	/**
	 * Recupera la dashboard dalla API Famiglia.
	 */
	async getDashboard() {
		if (!this.apiSession) await this.bootstrapSession();
		if (!this.famigliaProfile) await this.getProfilo();

		const dashboard = await this.famigliaRequest<FamigliaAPIDashboard>(
			"dashboard/dashboard",
			{
				body: {
					dataultimoaggiornamento: formatDate(
						this.famigliaProfile!.anno.dataInizio,
					),
					opzioni: JSON.stringify(
						Object.fromEntries(
							this.apiSession!.opzioni.map(({ chiave, valore }) => [
								chiave,
								valore,
							]),
						),
					),
				},
			},
		);

		if (!dashboard.success)
			throw new Error(
				dashboard.message ?? dashboard.msg ?? "Famiglia dashboard request failed",
			);

		const [data] = dashboard.data.dati;

		if (!data)
			throw new Error("Famiglia dashboard returned no data");

		this.famigliaDashboard = data;
		return data;
	}

	/**
	 * Effettua il login.
	 * @returns Il client aggiornato
	 */
	async login() {
		await Promise.all([
			this.token && this.dataProvider?.write("token", this.token),
			this.loginData && this.dataProvider?.write("login", this.loginData),
			this.profile && this.dataProvider?.write("profile", this.profile),
			this.dashboard && this.dataProvider?.write("dashboard", this.dashboard),
		]);
		await this.loadData();
		const oldToken = this.token;

		await this.refreshToken();
		if (!this.loginData) await this.getLoginData();
		if (oldToken) {
			this.logToken({
				oldToken,
				isWhat: this.profile !== undefined,
			}).catch(console.error);
			if (this.profile) {
				const whatData = await this.what(
					this.dashboard?.dataAggiornamento ?? this.profile.anno.dataInizio,
				);

				if (whatData.isModificato || whatData.differenzaSchede) {
					Object.assign(this.profile, whatData);
					void this.dataProvider?.write("profile", this.profile);
				}
				this.#ready = true;
				if (whatData.mostraPallino || !this.dashboard)
					await this.getLegacyDashboard();
				this.aggiornaData().catch(console.error);
				return this as ReadyClient & this & { dashboard: Dashboard };
			}
		}
		if (!this.profile) await this.getLegacyProfilo();
		this.#ready = true;
		await this.getLegacyDashboard();
		return this as ReadyClient & this & { dashboard: Dashboard };
	}

	/**
	 * Carica i dati salvati localmente.
	 */
	async loadData() {
		if (!this.dataProvider?.read) return;
		const [token, loginData, profile, dashboard] = await Promise.all([
			this.token ? undefined : this.dataProvider.read("token"),
			this.loginData ? undefined : this.dataProvider.read("login"),
			this.profile ? undefined : this.dataProvider.read("profile"),
			this.dashboard ? undefined : this.dataProvider.read("dashboard"),
		]);

		if (token)
			this.token = { ...token, expireDate: new Date(token.expireDate) };
		if (loginData) this.loginData = loginData;
		if (profile) this.profile = profile;
		if (dashboard)
			this.dashboard = {
				...dashboard,
				dataAggiornamento: new Date(dashboard.dataAggiornamento),
			};
	}

	/**
	 * Aggiorna il client, se necessario.
	 * @returns Il nuovo token
	 */
	async refreshToken() {
		if (!this.token) return this.getToken();
		if (this.token.expireDate.getTime() <= Date.now()) {
			const date = new Date();
			const res = await this.apiRequest<APIToken>("auth/refresh-token", {
				body: {
					"r-token": this.token.refresh_token,
					"client-id": clientId,
					scopes: `[${this.token.scope.split(" ").join(", ")}]`,
					"old-bearer": this.token.access_token,
					"primo-accesso": "false",
					"ripeti-login": "false",
					"exp-bearer": formatDate(this.token.expireDate),
					"ts-app": formatDate(date),
					proc: "initState_global_random_12345",
					username: this.loginData?.username,
				},
				noWait: true,
			});
			const expireDate = new Date(res.headers.get("date") ?? date);
			const token = await res.json();

			if ("error" in token)
				throw new Error(`${token.error} ${token.error_description}`);
			expireDate.setSeconds(expireDate.getSeconds() + token.expires_in);
			this.token = Object.assign(this.token, token, { expireDate });
			void this.dataProvider?.write("token", this.token);
		}
		return this.token;
	}

	/**
	 * Ottieni il token tramite l'API.
	 * @param code - The code for the access
	 * @returns I dati del token
	 */
	async getToken(code?: LoginLink & { code: string }) {
		code ??= await this.getCode();
		const { expireDate, ...token } = await getToken(code);

		this.token = Object.assign(this.token ?? {}, token, { expireDate });
		void this.dataProvider?.write("token", this.token);
		return this.token;
	}

	/**
	 * Rimuovi il profilo.
	 */
	async logOut() {
		if (!this.token || !this.loginData)
			throw new Error("Client is not logged in!");
		await this.rimuoviProfilo();
		delete this.token;
		delete this.loginData;
		delete this.profile;
		delete this.dashboard;
		delete this.apiSession;
		delete this.famigliaProfile;
		delete this.famigliaDashboard;
	}

	/**
	 * Ottieni i dettagli del profilo dello studente.
	 * @returns I dati
	 */
	async getDettagliProfilo<T extends FamigliaAPIDettagliProfilo["data"]>(
		old?: T,
	) {
		if (!this.apiSession) await this.bootstrapSession();

		const body = await this.famigliaRequest<FamigliaAPIDettagliProfilo>(
			"dettaglioprofilo",
			{
				method: "POST",
				body: {},
			},
		);

		if (!body.success)
			throw new Error(
				body.message ?? body.msg ?? "Famiglia profile details request failed",
			);

		return Object.assign(old ?? {}, body.data);
	}

	/**
	 * Ottieni l'orario giornaliero.
	 * @param date - Il giorno dell'orario
	 * @returns Le lezioni della giornata
	 */
	async getOrarioGiornaliero(date?: {
		year?: number;
		month?: number;
		day?: number;
	}) {
		if (!this.apiSession) await this.bootstrapSession();

		const now = new Date();

		const orario =
			await this.famigliaRequest<FamigliaAPIOrarioGiornaliero>(
				"famiglia/orario-giorno",
				{
					body: {
						datGiorno: formatDate(
							`${date?.year ?? now.getFullYear()}-${
								date?.month ?? now.getMonth() + 1
							}-${date?.day ?? now.getDate()}`,
						),
					},
				},
			);

		if (!orario.success)
			throw new Error(
				orario.message ?? orario.msg ?? "Famiglia timetable request failed",
			);

		return Object.values(orario.data.dati).flat();
	}

	/**
	 * Ottieni il link per scaricare un allegato della bacheca.
	 * @param uid - L'uid dell'allegato
	 * @returns L'url
	 */
	async getLinkAllegato(uid: string) {
		if (!this.apiSession) await this.bootstrapSession();

		const download =
			await this.famigliaRequest<FamigliaAPIDownloadAllegato>(
				"famiglia/downloadallegatobacheca",
				{
					body: { uid },
				},
			);

		if (!download.success)
			throw new Error(
				download.message ?? download.msg ?? "Famiglia attachment request failed",
			);

		return download.url;
	}

	/**
	 * Scarica un allegato della bacheca.
	 *
	 * Il link restituito da Argo è temporaneo, quindi viene richiesto e
	 * consumato immediatamente.
	 *
	 * @param uid - L'uid dell'allegato
	 * @returns La risposta HTTP contenente il file
	 */
	async downloadAllegato(uid: string) {
		const url = await this.getLinkAllegato(uid);
		return this.downloadSignedUrl(url);
	}

	/**
	 * Ottieni il link per scaricare un allegato della bacheca alunno.
	 * @param uid - l'uid dell'allegato
	 * @param pkScheda - L'id del profilo
	 * @returns L'url
	 */
	async getLinkAllegatoStudente(
		uid: string,
		pkScheda = this.profile?.scheda.pk,
	) {
		this.checkReady();
		const download = await this.apiRequest<APIDownloadAllegato>(
			"downloadallegatobachecaalunno",
			{ body: { uid, pkScheda } },
		);

		if (!download.success) throw new Error(download.msg);
		return download.url;
	}

	/**
	 * Scarica un allegato della bacheca alunno.
	 *
	 * Il link restituito da Argo è temporaneo, quindi viene richiesto e
	 * consumato immediatamente.
	 *
	 * @param uid - L'uid dell'allegato
	 * @param pkScheda - L'id del profilo
	 * @returns La risposta HTTP contenente il file
	 */
	async downloadAllegatoStudente(
		uid: string,
		pkScheda = this.profile?.scheda.pk,
	) {
		const url = await this.getLinkAllegatoStudente(uid, pkScheda);
		return this.downloadSignedUrl(url);
	}

	/**
	 * Ottieni i dati di una ricevuta telematica.
	 * @param iuv - L'iuv del pagamento
	 * @returns La ricevuta
	 */
	async getRicevuta(iuv: string) {
		this.checkReady();
		const ricevuta = await this.apiRequest<APIRicevutaTelematica>(
			"ricevutatelematica",
			{ body: { iuv } },
		);

		if (!ricevuta.success) throw new Error(ricevuta.msg);
		const { success, msg, ...rest } = ricevuta;

		return rest;
	}

	/**
	 * Ottieni i voti dello scrutinio dello studente.
	 * @returns I dati
	 */
	async getVotiScrutinio() {
		if (!this.apiSession) await this.bootstrapSession();

		const voti = await this.famigliaRequest<FamigliaAPIVotiScrutinio>(
			"famiglia/votiscrutinio",
			{
				method: "POST",
				body: {},
			},
		);

		if (!voti.success)
			throw new Error(
				voti.message ?? voti.msg ?? "Famiglia scrutiny grades request failed",
			);

		return voti.data.votiScrutinio[0]?.periodi;
	}

	/**
	 * Ottieni i dati riguardo i ricevimenti dello studente.
	 * @returns I dati
	 */
	async getRicevimenti<T extends FamigliaAPIRicevimenti["data"]>(old?: T) {
		if (!this.apiSession) await this.bootstrapSession();

		const ricevimenti = await this.famigliaRequest<FamigliaAPIRicevimenti>(
			"ricevimento/load",
			{
				method: "POST",
				body: {},
			},
		);

		if (!ricevimenti.success)
			throw new Error(
				ricevimenti.message ??
					ricevimenti.msg ??
					"Famiglia meetings request failed",
			);

		return Object.assign(old ?? {}, ricevimenti.data);
	}

	/**
	 * Ottieni le tasse dello studente.
	 * @param pkScheda - L'id del profilo
	 * @returns I dati
	 */
	async getTasse(pkScheda?: string) {
		if (!this.apiSession) await this.bootstrapSession();
		if (!pkScheda && !this.famigliaProfile) await this.getProfilo();

		const resolvedPkScheda =
			pkScheda ?? this.famigliaProfile?.scheda.pk ?? this.profile?.scheda.pk;

		if (!resolvedPkScheda)
			throw new Error("Student profile id is unavailable");

		const taxes = await this.famigliaRequest<FamigliaAPITasse>(
			"pagamenti/listatassealunni",
			{
				method: "POST",
				body: { pkScheda: resolvedPkScheda },
			},
		);

		if (!taxes.success)
			throw new Error(
				taxes.message ?? taxes.msg ?? "Famiglia taxes request failed",
			);

		const { success, msg, message, data, ...rest } = taxes;
		void success;
		void msg;
		void message;

		return {
			...rest,
			tasse: data,
		};
	}

	/**
	 * Ottieni i dati del PCTO dello studente.
	 * @param pkScheda - L'id del profilo
	 * @returns I dati
	 */
	async getPCTOData(pkScheda = this.profile?.scheda.pk) {
		this.checkReady();
		const pcto = await this.apiRequest<APIPCTO>("pcto", {
			body: { pkScheda },
		});

		if (!pcto.success) throw new Error(pcto.msg!);
		return pcto.data.pcto;
	}

	/**
	 * Ottieni i dati dei corsi di recupero dello studente.
	 * @param pkScheda - L'id del profilo
	 * @returns I dati
	 */
	async getCorsiRecupero<T extends FamigliaAPICorsiRecupero["data"]>(
		pkScheda = this.profile?.scheda.pk,
		old?: T,
	) {
		void pkScheda;

		if (!this.apiSession) await this.bootstrapSession();

		const courses = await this.famigliaRequest<FamigliaAPICorsiRecupero>(
			"famiglia/corsirecupero",
			{
				method: "POST",
				body: {},
			},
		);

		if (!courses.success)
			throw new Error(
				courses.message ??
					courses.msg ??
					"Famiglia recovery courses request failed",
			);

		return Object.assign(old ?? {}, courses.data);
	}

	/**
	 * Ottieni il curriculum dello studente.
	 * @param pkScheda - L'id del profilo
	 * @returns I dati
	 */
	async getCurriculum(pkScheda = this.profile?.scheda.pk) {
		void pkScheda;

		if (!this.apiSession) await this.bootstrapSession();

		const curriculum = await this.famigliaRequest<FamigliaAPICurriculum>(
			"famiglia/curriculum-alunno",
			{
				method: "GET",
			},
		);

		if (!curriculum.success)
			throw new Error(
				curriculum.message ??
					curriculum.msg ??
					"Famiglia curriculum request failed",
			);

		return curriculum.data.curriculum;
	}

	/**
	 * Ottieni lo storico della bacheca.
	 * @param pkScheda - L'id del profilo
	 * @returns I dati
	 */
	async getStoricoBacheca(pkScheda: string) {
		if (!this.apiSession) await this.bootstrapSession();

		const bacheca = await this.famigliaRequest<FamigliaAPIBacheca>(
			"famiglia/storicobacheca",
			{
				body: { pkScheda },
			},
		);

		if (!bacheca.success)
			throw new Error(
				bacheca.message ?? bacheca.msg ?? "Famiglia bulletin request failed",
			);

		return bacheca.data.bacheca.map(({ operazione, ...item }) => item);
	}

	/**
	 * Ottieni lo storico della bacheca alunno.
	 * @param pkScheda - L'id del profilo
	 * @returns I dati
	 */
	async getStoricoBachecaAlunno(pkScheda: string) {
		this.checkReady();
		const bacheca = await this.apiRequest<APIBachecaAlunno>(
			"storicobachecaalunno",
			{
				body: { pkScheda },
			},
		);

		if (!bacheca.success) throw new Error(bacheca.msg!);
		return handleOperation(bacheca.data.bachecaAlunno);
	}

	/**
	 * Conferma la presa visione di un avviso della bacheca.
	 *
	 * Argo richiede il download di almeno un allegato prima della conferma.
	 * L'allegato viene quindi scaricato realmente tramite il relativo URL
	 * firmato prima di chiamare `presavisioneadesione`.
	 *
	 * @param pkScheda - L'id del profilo
	 * @param prgMessaggio - Il pk dell'avviso
	 * @param allegatoUid - Il pk di un allegato dell'avviso
	 * @returns Il risultato della conferma
	 */
	async confirmPresaVisioneBacheca(
		pkScheda: string,
		prgMessaggio: string,
		allegatoUid: string,
	) {
		this.checkReady();

		const attachment = await this.downloadAllegato(allegatoUid);
		await attachment.arrayBuffer();

		const result = await this.apiRequest<APIPresavisioneAdesione>(
			"presavisioneadesione",
			{ body: { pkScheda, prgMessaggio } },
		);

		if (!result.success) throw new Error(result.message ?? result.msg ?? "Presa visione fallita");
		return result;
	}

	/**
	 * Ottieni i dati della dashboard.
	 * @returns La dashboard
	 */
	private async getLegacyDashboard() {
		this.checkReady();
		const date = new Date();
		const res = await this.apiRequest<APIDashboard>("dashboard/dashboard", {
			body: {
				dataultimoaggiornamento: formatDate(
					this.dashboard?.dataAggiornamento ?? this.profile.anno.dataInizio,
				),
				opzioni: JSON.stringify(
					Object.fromEntries(
						(this.dashboard ?? this.loginData).opzioni.map((a) => [
							a.chiave,
							a.valore,
						]),
					),
				),
			},
			noWait: true,
		});
		const body = await res.json();

		if (!body.success) throw new Error(body.msg!);
		const [data] = body.data.dati;

		this.dashboard = Object.assign(
			(data.rimuoviDatiLocali ? null : this.dashboard) ?? {},
			{
				...data,
				fuoriClasse: handleOperation(
					data.fuoriClasse,
					data.rimuoviDatiLocali ? undefined : this.dashboard?.fuoriClasse,
				),
				promemoria: handleOperation(
					data.promemoria,
					data.rimuoviDatiLocali ? undefined : this.dashboard?.promemoria,
				),
				bacheca: handleOperation(
					data.bacheca,
					data.rimuoviDatiLocali ? undefined : this.dashboard?.bacheca,
				),
				voti: handleOperation(
					data.voti,
					data.rimuoviDatiLocali ? undefined : this.dashboard?.voti,
				),
				bachecaAlunno: handleOperation(
					data.bachecaAlunno,
					data.rimuoviDatiLocali ? undefined : this.dashboard?.bachecaAlunno,
				),
				registro: handleOperation(
					data.registro,
					data.rimuoviDatiLocali ? undefined : this.dashboard?.registro,
				),
				appello: handleOperation(
					data.appello,
					data.rimuoviDatiLocali ? undefined : this.dashboard?.appello,
				),
				prenotazioniAlunni: handleOperation(
					data.prenotazioniAlunni,
					data.rimuoviDatiLocali
						? undefined
						: this.dashboard?.prenotazioniAlunni,
					(a) => a.prenotazione.pk,
				),
				dataAggiornamento: new Date(res.headers.get("date") ?? date),
			},
		);
		void this.dataProvider?.write("dashboard", this.dashboard);
		return this.dashboard;
	}

	/**
	 * Scarica immediatamente un URL firmato restituito da Argo.
	 */
	private async downloadSignedUrl(url: string) {
		const response = await this.fetch(url);

		if (!response.ok)
			throw new Error(
				`Attachment download failed: HTTP ${response.status} ${response.statusText}`,
			);

		return response;
	}

	private async getLegacyProfilo() {
		const profile = await this.apiRequest<APIProfilo>("profilo");

		if (!profile.success) throw new Error(profile.msg!);
		this.profile = Object.assign(this.profile ?? {}, profile.data);
		void this.dataProvider?.write("profile", this.profile);
		return this.profile;
	}

	private async getLoginData() {
		const login = await this.apiRequest<APILogin>("login", {
			body: {
				"lista-opzioni-notifiche": "{}",
				"lista-x-auth-token": "[]",
				clientID: randomString(163),
			},
		});

		if (!login.success) throw new Error(login.msg!);
		this.loginData = Object.assign(this.loginData ?? {}, login.data[0]);
		void this.dataProvider?.write("login", this.loginData);
		return this.loginData;
	}

	private async logToken(options: { oldToken: Token; isWhat?: boolean }) {
		const res = await this.apiRequest<APIResponse>("logtoken", {
			body: {
				bearerOld: options.oldToken.access_token,
				dateExpOld: formatDate(options.oldToken.expireDate),
				refreshOld: options.oldToken.refresh_token,
				bearerNew: this.token?.access_token,
				dateExpNew: this.token?.expireDate && formatDate(this.token.expireDate),
				refreshNew: this.token?.refresh_token,
				isWhat: (options.isWhat ?? false).toString(),
				isRefreshed: (
					this.token?.access_token === options.oldToken.access_token
				).toString(),
				proc: "initState_global_random_12345",
			},
		});

		if (!res.success) throw new Error(res.msg!);
	}

	private async rimuoviProfilo() {
		const res = await this.apiRequest<APIResponse>("rimuoviprofilo", {
			body: {},
		});

		if (!res.success) throw new Error(res.msg!);
		await this.dataProvider?.reset();
	}

	private async what(
		lastUpdate: Date | number | string,
		old?: APIWhat["data"]["dati"][number],
	) {
		const authToken = JSON.stringify([this.loginData?.token]);
		const opzioni = (this.dashboard ?? this.loginData)?.opzioni;
		const what = await this.apiRequest<APIWhat>("dashboard/what", {
			body: {
				dataultimoaggiornamento: formatDate(lastUpdate),
				opzioni:
					opzioni &&
					JSON.stringify(
						Object.fromEntries(opzioni.map((a) => [a.chiave, a.valore])),
					),
				"lista-x-auth-token": authToken,
				"lista-x-auth-token-account": authToken,
			},
		});

		if (!what.success) throw new Error(what.msg!);
		return Object.assign(old ?? {}, what.data.dati[0]);
	}

	private async aggiornaData() {
		const res = await this.apiRequest<APIResponse>("dashboard/aggiornadata", {
			body: { dataultimoaggiornamento: formatDate(new Date()) },
		});

		if (!res.success) throw new Error(res.msg!);
	}

	private checkReady(): asserts this is ReadyClient {
		if (!this.isReady()) throw new Error("Client is not logged in!");
	}

	protected abstract getCode(): Promise<LoginLink & { code: string }>;
}
