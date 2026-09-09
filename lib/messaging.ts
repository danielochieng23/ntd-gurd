/**
 * Early-warning message composition and dispatch.
 *
 * Composition, audience targeting, GSM segment costing and the outbox are all
 * real. Delivery is simulated unless an SMS provider is configured on the
 * server (see app/api/dispatch/route.ts) — sending live SMS needs a paid
 * gateway account, so the prototype ships with the adapter stubbed.
 */

import { Alert, CommunityState } from './data';

export type ChannelId = 'sms' | 'whatsapp' | 'ivr' | 'radio' | 'email';
export type AudienceId = 'community' | 'chw' | 'district' | 'facilities' | 'wash' | 'leaders';
export type LanguageId = 'en' | 'sw' | 'lsm';

export interface Channel {
  id: ChannelId;
  label: string;
  note: string;
  /** Hard character ceiling, where the channel imposes one. */
  limit?: number;
}

export interface Audience {
  id: AudienceId;
  label: string;
  note: string;
  /** Contacts per 1,000 population, used to size a community broadcast. */
  perThousand?: number;
  /** Fixed roster size for institutional audiences. */
  fixed?: number;
}

export interface Language {
  id: LanguageId;
  label: string;
  /** True when the wording has not been checked by a native speaker. */
  draft?: boolean;
}

export const CHANNELS: Channel[] = [
  { id: 'sms', label: 'SMS', note: 'Bulk SMS to registered numbers. Works on any handset.', limit: 480 },
  { id: 'whatsapp', label: 'WhatsApp', note: 'Cheaper per message but needs a smartphone and data.', limit: 1024 },
  { id: 'ivr', label: 'Voice / IVR', note: 'Recorded call-out. Reaches low-literacy households.', limit: 600 },
  { id: 'radio', label: 'Community radio', note: 'Script handed to the station for scheduled read-out.', limit: 900 },
  { id: 'email', label: 'Email', note: 'District health office and partner organisations.' },
];

export const AUDIENCES: Audience[] = [
  { id: 'community', label: 'Community members', note: 'Registered household contacts in the affected area.', perThousand: 285 },
  { id: 'chw', label: 'Village health teams', note: 'VHT members covering the affected parishes.', perThousand: 4 },
  { id: 'leaders', label: 'Local council leaders', note: 'LC1 chairpersons and parish chiefs.', perThousand: 2 },
  { id: 'facilities', label: 'Health facilities', note: 'Health centre II/III staff in the catchment.', fixed: 6 },
  { id: 'wash', label: 'WASH / water utility', note: 'Water officers and WASH engineering team.', fixed: 9 },
  { id: 'district', label: 'District health team', note: 'DHO, surveillance focal person, district task force.', fixed: 11 },
];

export const LANGUAGES: Language[] = [
  { id: 'en', label: 'English' },
  { id: 'sw', label: 'Kiswahili' },
  { id: 'lsm', label: 'Lusamia', draft: true },
];

export interface Template {
  id: string;
  label: string;
  purpose: string;
  /** Audiences this wording is written for. */
  suggestedAudiences: AudienceId[];
  body: Record<LanguageId, string>;
}

/**
 * Placeholders resolved at send time:
 *   {community} {district} {risk} {level} {driver} {date} {waterpoints}
 */
export const TEMPLATES: Template[] = [
  {
    id: 'boil-water',
    label: 'Boil water advisory',
    purpose: 'Water source contamination confirmed or strongly suspected.',
    suggestedAudiences: ['community', 'chw', 'leaders'],
    body: {
      en:
        'NTD GURD health alert for {community}, {district}. Water at nearby sources may be unsafe. ' +
        'Boil all drinking water for 1 minute or add treatment before use. Wash hands with soap. ' +
        'If you have watery diarrhoea, go to the nearest health centre immediately. Do not wait.',
      sw:
        'Tahadhari ya afya ya NTD GURD kwa {community}, {district}. Maji ya vyanzo vya karibu yanaweza ' +
        'kuwa si salama. Chemsha maji yote ya kunywa kwa dakika 1 au tumia dawa ya kutibu maji kabla ya ' +
        'kunywa. Nawa mikono kwa sabuni. Ukiwa na kuhara kwa maji, nenda kituo cha afya mara moja.',
      lsm:
        'Obwenge bwa NTD GURD mu {community}, {district}. Amaaji ag\'ebifo ebiri hafi gasobola obutaba ' +
        'malayi. Fumba amaaji gonna ag\'okunywa edakika 1 nohomba otekemo eddagala. Naaba engalo n\'esabbuni. ' +
        'Nooba n\'okuduka kw\'amaaji, genda ku ddwaliro mangu.',
    },
  },
  {
    id: 'cholera-prevention',
    label: 'Cholera prevention advisory',
    purpose: 'Suspected cholera cases reported by community health workers.',
    suggestedAudiences: ['community', 'chw', 'leaders', 'facilities'],
    body: {
      en:
        'NTD GURD alert: suspected cholera cases reported in {community}, {district}. Drink only boiled or ' +
        'treated water. Wash hands with soap before eating and after the toilet. Eat hot, freshly cooked food. ' +
        'Watery diarrhoea and vomiting need care the same day — go to the health centre and take ORS on the way.',
      sw:
        'Tahadhari ya NTD GURD: visa vinavyodhaniwa vya kipindupindu vimeripotiwa {community}, {district}. ' +
        'Kunywa maji yaliyochemshwa au kutibiwa tu. Nawa mikono kwa sabuni kabla ya kula na baada ya choo. ' +
        'Kula chakula cha moto kilichopikwa upya. Kuhara kwa maji na kutapika kunahitaji matibabu siku hiyo hiyo — ' +
        'nenda kituo cha afya na unywe ORS njiani.',
      lsm:
        'Obwenge bwa NTD GURD: ebirwadde ebirowoozebwa okuba kolera bibonese mu {community}, {district}. ' +
        'Nywa amaaji agafumbe nohomba agateekemo eddagala gokka. Naaba engalo n\'esabbuni nga tonalya era ' +
        'bwomala okugenda mu kabuyonjo. Lya emmere embuguma. Okuduka kw\'amaaji n\'okusesema byetaaga ' +
        'obujjanjabi ku lunaku olwo — genda ku ddwaliro era onywe ORS.',
    },
  },
  {
    id: 'flood-warning',
    label: 'Flood and heavy rain warning',
    purpose: 'Rainfall anomaly or river discharge indicates flood exposure.',
    suggestedAudiences: ['community', 'leaders', 'chw'],
    body: {
      en:
        'NTD GURD flood warning for {community}, {district}. Heavy rain is raising flood risk near low-lying ' +
        'water points. Move drinking water containers to high ground, avoid crossing flooded streams, and keep ' +
        'children away from flood water. Flooded wells and springs must be treated as contaminated.',
      sw:
        'Onyo la mafuriko la NTD GURD kwa {community}, {district}. Mvua kubwa inaongeza hatari ya mafuriko ' +
        'karibu na vyanzo vya maji vya mabondeni. Hamisha vyombo vya maji ya kunywa mahali pa juu, epuka ' +
        'kuvuka vijito vilivyofurika, na waweke watoto mbali na maji ya mafuriko. Visima vilivyofurika ' +
        'vichukuliwe kuwa vimechafuliwa.',
      lsm:
        'Okulabula kwa NTD GURD ku mataba mu {community}, {district}. Enkuba ennyingi eyongera akabi ' +
        'k\'amataba okumpi n\'ebifo by\'amaaji ebya wansi. Twala ebintu by\'amaaji ag\'okunywa waggulu, ' +
        'toyita mu migga egijjudde, era abaana bave ku maaji g\'amataba. Enzizi ezijjudde amaaji ' +
        'zitwalibwe nga nsobi.',
    },
  },
  {
    id: 'waterpoint-closure',
    label: 'Water point closure notice',
    purpose: 'Specific sources withdrawn from use pending laboratory results.',
    suggestedAudiences: ['community', 'leaders', 'wash'],
    body: {
      en:
        'NTD GURD notice for {community}, {district}. Water points {waterpoints} are closed for testing and ' +
        'must not be used for drinking or cooking. Use the alternative source indicated by your village health ' +
        'team. A further message will be sent when the points are cleared.',
      sw:
        'Taarifa ya NTD GURD kwa {community}, {district}. Vyanzo vya maji {waterpoints} vimefungwa kwa ' +
        'upimaji na havipaswi kutumika kwa kunywa au kupika. Tumia chanzo mbadala kilichoonyeshwa na timu ya ' +
        'afya ya kijiji chako. Ujumbe mwingine utatumwa vyanzo vitakapothibitishwa kuwa salama.',
      lsm:
        'Obubaka bwa NTD GURD mu {community}, {district}. Ebifo by\'amaaji {waterpoints} biggaddwawo ' +
        'okukebera era tebikozesebwa kunywa oba kufumba. Kozesa ekifo ekirala ekyalagiddwa VHT wo. ' +
        'Tujja kubaweereza obubaka obulala nga bimaze okukakasibwa.',
    },
  },
  {
    id: 'chw-mobilisation',
    label: 'VHT mobilisation order',
    purpose: 'Task village health teams with active case search and reporting.',
    suggestedAudiences: ['chw', 'facilities'],
    body: {
      en:
        'NTD GURD task for VHT members covering {community}, {district}. Risk score has moved to {risk}/100 ' +
        '({level}). Lead driver: {driver}. Begin active case search for watery diarrhoea today, distribute ORS ' +
        'to affected households, and submit household counts through the NTD GURD form by end of day {date}. ' +
        'Refer any suspected cholera case to the health centre immediately.',
      sw:
        'Kazi ya NTD GURD kwa wanachama wa VHT wanaohudumia {community}, {district}. Alama ya hatari ' +
        'imefikia {risk}/100 ({level}). Kichocheo kikuu: {driver}. Anza utafutaji wa visa vya kuhara kwa maji ' +
        'leo, sambaza ORS kwa kaya zilizoathirika, na wasilisha hesabu za kaya kupitia fomu ya NTD GURD ' +
        'kabla ya mwisho wa siku {date}. Peleka kisa chochote kinachodhaniwa cha kipindupindu kituo cha afya mara moja.',
      lsm:
        'Omulimu gwa NTD GURD eri VHT aba {community}, {district}. Omuwendo gw\'akabi gutuuse ku {risk}/100 ' +
        '({level}). Ensonga enkulu: {driver}. Tandika okunoonya abalwadde ab\'okuduka kw\'amaaji leero, gaba ORS ' +
        'mu maka agakoseddwa, era oweereze omuwendo gw\'amaka nga okozesa fomu ya NTD GURD nga {date} tennaggwa. ' +
        'Omulwadde yenna alowoozebwa okuba ne kolera mutwale ku ddwaliro mangu.',
    },
  },
  {
    id: 'district-escalation',
    label: 'District escalation brief',
    purpose: 'Formal notification to the district health team and partners.',
    suggestedAudiences: ['district', 'wash', 'facilities'],
    body: {
      en:
        'NTD GURD escalation — {community}, {district}. Composite risk {risk}/100 ({level}) as at {date}. ' +
        'Lead driver: {driver}. Affected water points: {waterpoints}. Requesting confirmatory water sampling, ' +
        'ORS and RDT stock verification at the catchment health centre, and activation of the district ' +
        'rapid response team. Full evidence package attached. Model output is advisory and requires field verification.',
      sw:
        'Kupandishwa kwa NTD GURD — {community}, {district}. Alama ya hatari {risk}/100 ({level}) hadi {date}. ' +
        'Kichocheo kikuu: {driver}. Vyanzo vya maji vilivyoathirika: {waterpoints}. Tunaomba upimaji wa ' +
        'uthibitisho wa maji, uhakiki wa akiba ya ORS na RDT katika kituo cha afya, na kuanzishwa kwa timu ya ' +
        'majibu ya haraka ya wilaya. Kifurushi kamili cha ushahidi kimeambatishwa. Matokeo ya modeli ni ' +
        'ushauri na yanahitaji uthibitisho wa uwandani.',
      lsm:
        'NTD GURD okulaga akabi — {community}, {district}. Omuwendo gw\'akabi {risk}/100 ({level}) nga {date}. ' +
        'Ensonga enkulu: {driver}. Ebifo by\'amaaji ebikoseddwa: {waterpoints}. Tusaba okukebera amaaji, ' +
        'okukakasa ORS ne RDT ku ddwaliro, n\'okutandikawo ittiimu y\'okwanukula amangu mu disitulikiti. ' +
        'Ebiwandiiko byonna biriwo. Ebivudde mu modeli bya kuwabula era byetaaga okukakasibwa.',
    },
  },
];

// ── Composition ────────────────────────────────────────────────────────────

export interface MessageContext {
  community: string;
  district: string;
  risk: number | string;
  level: string;
  driver: string;
  date: string;
  waterpoints: string;
}

export function buildContext(alert: Alert | null, community?: CommunityState | null): MessageContext {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return {
    community: alert?.communityName ?? community?.name ?? 'the affected area',
    district: 'Busia District',
    risk: alert?.riskCurrent ?? community?.riskScore ?? '—',
    level: alert?.riskLevel ?? community?.riskLevel ?? 'ELEVATED',
    driver: alert?.primaryDrivers[0] ?? 'water quality deterioration',
    date: today,
    waterpoints: 'WP-B4-01, WP-B4-03',
  };
}

export function renderTemplate(body: string, ctx: MessageContext): string {
  return body.replace(/\{(\w+)\}/g, (m, key: string) =>
    key in ctx ? String(ctx[key as keyof MessageContext]) : m);
}

/**
 * GSM-7 messages fit 160 characters, or 153 per part once concatenated.
 * Any character outside the GSM alphabet forces UCS-2: 70, or 67 per part.
 */
const GSM7 = /^[A-Za-z0-9@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€\n\r]*$/;

export function segmentCount(text: string): { segments: number; encoding: 'GSM-7' | 'UCS-2'; perSegment: number } {
  const isGsm = GSM7.test(text);
  const single = isGsm ? 160 : 70;
  const multi = isGsm ? 153 : 67;
  const segments = text.length === 0 ? 0 : text.length <= single ? 1 : Math.ceil(text.length / multi);
  return { segments, encoding: isGsm ? 'GSM-7' : 'UCS-2', perSegment: text.length <= single ? single : multi };
}

/** Rough recipient count for an audience given the population actually covered. */
export function audienceSize(audience: Audience, populationCovered: number): number {
  if (audience.fixed !== undefined) return audience.fixed;
  return Math.max(1, Math.round((populationCovered / 1000) * (audience.perThousand ?? 0)));
}

// ── Dispatch ───────────────────────────────────────────────────────────────

export interface DispatchRequest {
  templateId: string;
  templateLabel: string;
  language: LanguageId;
  channels: ChannelId[];
  audiences: { id: AudienceId; label: string; recipients: number }[];
  body: string;
  community: string;
  alertId?: string;
}

export interface DispatchLeg {
  channel: ChannelId;
  audience: AudienceId;
  audienceLabel: string;
  requested: number;
  delivered: number;
  failed: number;
  segments: number;
}

export interface DispatchResult {
  id: string;
  at: string;
  simulated: boolean;
  provider: string;
  legs: DispatchLeg[];
  totalRequested: number;
  totalDelivered: number;
  totalSegments: number;
  request: DispatchRequest;
  note?: string;
}

const DELIVERY_RATE: Record<ChannelId, number> = {
  sms: 0.94,
  whatsapp: 0.71,
  ivr: 0.83,
  radio: 1,
  email: 0.98,
};

function simulateDispatch(req: DispatchRequest): DispatchResult {
  const segs = segmentCount(req.body).segments;
  const legs: DispatchLeg[] = [];
  for (const channel of req.channels) {
    for (const audience of req.audiences) {
      const requested = Math.max(0, Math.round(audience.recipients));
      const rate = DELIVERY_RATE[channel] ?? 0.9;
      const jitter = (Math.random() - 0.5) * 0.06;
      const delivered = Math.min(requested, Math.round(requested * Math.max(0, Math.min(1, rate + jitter))));
      legs.push({
        channel,
        audience: audience.id,
        audienceLabel: audience.label,
        requested,
        delivered,
        failed: requested - delivered,
        segments: channel === 'sms' ? segs : 1,
      });
    }
  }
  return {
    id: `DSP-${Date.now().toString(36).toUpperCase()}`,
    at: new Date().toISOString(),
    simulated: true,
    provider: 'Simulated gateway',
    legs,
    totalRequested: legs.reduce((s, l) => s + l.requested, 0),
    totalDelivered: legs.reduce((s, l) => s + l.delivered, 0),
    totalSegments: legs.reduce((s, l) => s + l.requested * l.segments, 0),
    request: req,
    note: 'Simulated locally — GitHub Pages has no server, so live SMS is not available in this host.',
  };
}

export async function dispatch(req: DispatchRequest): Promise<DispatchResult> {
  try {
    const res = await fetch('/api/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (res.ok) return res.json();
  } catch {
    // Static hosts (GitHub Pages) have no API route.
  }
  await new Promise(r => setTimeout(r, 700));
  return simulateDispatch(req);
}
