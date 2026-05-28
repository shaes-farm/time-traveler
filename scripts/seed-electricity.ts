import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as dotenvConfig } from "dotenv";

type TemporalData = {
  year: number;
  era: "CE" | "BCE" | "KYA" | "MYA" | "BYA";
  precision: "exact" | "circa" | "approximate" | "estimated" | "geological";
  month?: number;
  day?: number;
};

type CharacterSeed = {
  key: string;
  slug: string;
  name: string;
  character_type: "human";
  biography: string;
  aliases: string[];
  cultural_context: string[];
  significance: "high" | "critical";
  birth_temporal: TemporalData;
  death_temporal: TemporalData;
};

type EventSeed = {
  key: string;
  slug: string;
  title: string;
  summary: string;
  detail: string;
  event_type: "discovery" | "milestone";
  importance: number;
  temporal_data: TemporalData;
  location: string;
  characterKeys: string[];
};

type InsertedRow = { id: string; slug: string };

type RestRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: string;
  body?: unknown;
  returnRepresentation?: boolean;
};

type AuthAdminUser = {
  id: string;
  email?: string;
};

type AuthAdminUsersResponse = {
  users: AuthAdminUser[];
};

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.resolve(SCRIPT_DIR, "../.env.local") });

const SEED_PREFIX = "seed-electricity";
const DATASET_NAME = "electricity_discoveries";
const DATASET_VERSION = "v1";
const DEFAULT_ADMIN_EMAIL = "admin@timetraveler.local";
const DEFAULT_ADMIN_PASSWORD = "Admin123!";

const TIMELINE = {
  slug: `${SEED_PREFIX}-history-of-electrical-discoveries`,
  title: "History of Electrical Discoveries",
  summary:
    "A chronological overview of foundational electrical discoveries and electromagnetic theory from early modern science to industrial electrification.",
  detail:
    "This timeline tracks foundational experiments, laws, and technological breakthroughs that transformed electricity from natural curiosity into modern infrastructure.",
  temporal_data: {
    year: 1600,
    era: "CE",
    precision: "exact",
  } as TemporalData,
  end_temporal_data: {
    year: 1900,
    era: "CE",
    precision: "approximate",
  } as TemporalData,
};

const CHARACTERS: CharacterSeed[] = [
  {
    key: "gilbert",
    slug: `${SEED_PREFIX}-william-gilbert`,
    name: "William Gilbert",
    character_type: "human",
    biography:
      "English physician and natural philosopher whose 1600 work De Magnete helped establish electricity and magnetism as subjects of systematic experiment.",
    aliases: ["Dr. William Gilbert"],
    cultural_context: ["Early modern science", "Natural philosophy", "England"],
    significance: "high",
    birth_temporal: { year: 1544, era: "CE", precision: "circa" },
    death_temporal: { year: 1603, era: "CE", precision: "exact" },
  },
  {
    key: "franklin",
    slug: `${SEED_PREFIX}-benjamin-franklin`,
    name: "Benjamin Franklin",
    character_type: "human",
    biography:
      "American polymath whose experiments linked lightning to electricity and popularized key concepts such as positive and negative charge.",
    aliases: ["Ben Franklin"],
    cultural_context: [
      "Enlightenment",
      "Colonial America",
      "Natural philosophy",
    ],
    significance: "critical",
    birth_temporal: { year: 1706, era: "CE", precision: "exact" },
    death_temporal: { year: 1790, era: "CE", precision: "exact" },
  },
  {
    key: "galvani",
    slug: `${SEED_PREFIX}-luigi-galvani`,
    name: "Luigi Galvani",
    character_type: "human",
    biography:
      "Italian physician whose frog-leg experiments drove debate over bioelectricity and inspired Volta's battery research.",
    aliases: [],
    cultural_context: ["Italian science", "Bioelectricity", "Enlightenment"],
    significance: "high",
    birth_temporal: { year: 1737, era: "CE", precision: "exact" },
    death_temporal: { year: 1798, era: "CE", precision: "exact" },
  },
  {
    key: "volta",
    slug: `${SEED_PREFIX}-alessandro-volta`,
    name: "Alessandro Volta",
    character_type: "human",
    biography:
      "Italian physicist who invented the voltaic pile, the first continuous electric battery.",
    aliases: ["Count Volta"],
    cultural_context: ["Italian science", "Electrochemistry", "Enlightenment"],
    significance: "critical",
    birth_temporal: { year: 1745, era: "CE", precision: "exact" },
    death_temporal: { year: 1827, era: "CE", precision: "exact" },
  },
  {
    key: "oersted",
    slug: `${SEED_PREFIX}-hans-christian-oersted`,
    name: "Hans Christian Oersted",
    character_type: "human",
    biography:
      "Danish physicist who demonstrated that electric currents affect magnetic needles, revealing the link between electricity and magnetism.",
    aliases: ["H. C. Oersted"],
    cultural_context: ["Danish science", "Electromagnetism"],
    significance: "high",
    birth_temporal: { year: 1777, era: "CE", precision: "exact" },
    death_temporal: { year: 1851, era: "CE", precision: "exact" },
  },
  {
    key: "ampere",
    slug: `${SEED_PREFIX}-andre-marie-ampere`,
    name: "Andre-Marie Ampere",
    character_type: "human",
    biography:
      "French physicist and mathematician who established the foundations of electrodynamics and gave his name to electric current units.",
    aliases: ["A. M. Ampere"],
    cultural_context: ["French science", "Electrodynamics"],
    significance: "high",
    birth_temporal: { year: 1775, era: "CE", precision: "exact" },
    death_temporal: { year: 1836, era: "CE", precision: "exact" },
  },
  {
    key: "ohm",
    slug: `${SEED_PREFIX}-georg-ohm`,
    name: "Georg Ohm",
    character_type: "human",
    biography:
      "German physicist who formulated the quantitative relationship between voltage, current, and resistance now known as Ohm's law.",
    aliases: ["Georg Simon Ohm"],
    cultural_context: ["German science", "Circuit theory"],
    significance: "critical",
    birth_temporal: { year: 1789, era: "CE", precision: "exact" },
    death_temporal: { year: 1854, era: "CE", precision: "exact" },
  },
  {
    key: "faraday",
    slug: `${SEED_PREFIX}-michael-faraday`,
    name: "Michael Faraday",
    character_type: "human",
    biography:
      "English experimental scientist who discovered electromagnetic induction and developed the conceptual field view of electromagnetism.",
    aliases: [],
    cultural_context: ["British science", "Electromagnetism", "Industrial era"],
    significance: "critical",
    birth_temporal: { year: 1791, era: "CE", precision: "exact" },
    death_temporal: { year: 1867, era: "CE", precision: "exact" },
  },
  {
    key: "morse",
    slug: `${SEED_PREFIX}-samuel-morse`,
    name: "Samuel Morse",
    character_type: "human",
    biography:
      "American inventor who helped commercialize practical electric telegraphy and standardized long-distance signaling.",
    aliases: ["Samuel F. B. Morse"],
    cultural_context: ["American innovation", "Telegraphy"],
    significance: "high",
    birth_temporal: { year: 1791, era: "CE", precision: "exact" },
    death_temporal: { year: 1872, era: "CE", precision: "exact" },
  },
  {
    key: "maxwell",
    slug: `${SEED_PREFIX}-james-clerk-maxwell`,
    name: "James Clerk Maxwell",
    character_type: "human",
    biography:
      "Scottish physicist whose equations unified electricity, magnetism, and light into a single electromagnetic framework.",
    aliases: ["J. C. Maxwell"],
    cultural_context: [
      "Scottish science",
      "Field theory",
      "Mathematical physics",
    ],
    significance: "critical",
    birth_temporal: { year: 1831, era: "CE", precision: "exact" },
    death_temporal: { year: 1879, era: "CE", precision: "exact" },
  },
  {
    key: "heaviside",
    slug: `${SEED_PREFIX}-oliver-heaviside`,
    name: "Oliver Heaviside",
    character_type: "human",
    biography:
      "English self-taught physicist who reformulated Maxwell's theory using vector calculus, enabling practical electrical engineering analysis.",
    aliases: [],
    cultural_context: [
      "British science",
      "Electrical engineering",
      "Vector analysis",
    ],
    significance: "high",
    birth_temporal: { year: 1850, era: "CE", precision: "exact" },
    death_temporal: { year: 1925, era: "CE", precision: "exact" },
  },
  {
    key: "hertz",
    slug: `${SEED_PREFIX}-heinrich-hertz`,
    name: "Heinrich Hertz",
    character_type: "human",
    biography:
      "German physicist who experimentally demonstrated electromagnetic waves, validating Maxwell's predictions.",
    aliases: ["Heinrich Rudolf Hertz"],
    cultural_context: ["German science", "Electromagnetic waves"],
    significance: "critical",
    birth_temporal: { year: 1857, era: "CE", precision: "exact" },
    death_temporal: { year: 1894, era: "CE", precision: "exact" },
  },
  {
    key: "tesla",
    slug: `${SEED_PREFIX}-nikola-tesla`,
    name: "Nikola Tesla",
    character_type: "human",
    biography:
      "Serbian-American inventor whose AC motor and polyphase system were central to long-distance electric power distribution.",
    aliases: [],
    cultural_context: ["Serbian diaspora", "American innovation", "AC systems"],
    significance: "critical",
    birth_temporal: { year: 1856, era: "CE", precision: "exact" },
    death_temporal: { year: 1943, era: "CE", precision: "exact" },
  },
  {
    key: "thomson",
    slug: `${SEED_PREFIX}-jj-thomson`,
    name: "J. J. Thomson",
    character_type: "human",
    biography:
      "English physicist who identified the electron and transformed electrical theory at the subatomic scale.",
    aliases: ["Joseph John Thomson"],
    cultural_context: ["British science", "Atomic physics"],
    significance: "critical",
    birth_temporal: { year: 1856, era: "CE", precision: "exact" },
    death_temporal: { year: 1940, era: "CE", precision: "exact" },
  },
  {
    key: "steinmetz",
    slug: `${SEED_PREFIX}-charles-proteus-steinmetz`,
    name: "Charles Proteus Steinmetz",
    character_type: "human",
    biography:
      "German-American electrical engineer who formalized AC circuit analysis and hysteresis models for power systems.",
    aliases: ["C. P. Steinmetz"],
    cultural_context: [
      "American industrial electrification",
      "Power engineering",
    ],
    significance: "high",
    birth_temporal: { year: 1865, era: "CE", precision: "exact" },
    death_temporal: { year: 1923, era: "CE", precision: "exact" },
  },
];

const EVENTS: EventSeed[] = [
  {
    key: "de-magnete",
    slug: `${SEED_PREFIX}-de-magnete-1600`,
    title: "De Magnete published",
    summary:
      "William Gilbert publishes De Magnete, a cornerstone in the study of electricity and magnetism.",
    detail:
      "Gilbert distinguished magnetic and electrical attraction through repeatable experiments and introduced durable terminology for later scientists.",
    event_type: "discovery",
    importance: 8,
    temporal_data: { year: 1600, era: "CE", precision: "exact" },
    location: "London, England",
    characterKeys: ["gilbert"],
  },
  {
    key: "franklin-kite",
    slug: `${SEED_PREFIX}-franklin-kite-experiment-1752`,
    title: "Franklin demonstrates lightning is electrical",
    summary:
      "Benjamin Franklin's kite experiment supports the electrical nature of lightning.",
    detail:
      "The experiment and related writings helped establish a unified understanding of atmospheric and laboratory electricity.",
    event_type: "discovery",
    importance: 9,
    temporal_data: { year: 1752, era: "CE", precision: "exact" },
    location: "Philadelphia, Pennsylvania",
    characterKeys: ["franklin"],
  },
  {
    key: "galvani-frog",
    slug: `${SEED_PREFIX}-galvani-frog-bioelectricity-1780`,
    title: "Galvani reports bioelectric effects",
    summary:
      "Luigi Galvani's frog-leg experiments spark the study of bioelectricity.",
    detail:
      "Observed muscle contractions under electrical stimulation became a major catalyst for electrochemical debate and battery development.",
    event_type: "discovery",
    importance: 8,
    temporal_data: { year: 1780, era: "CE", precision: "circa" },
    location: "Bologna, Italy",
    characterKeys: ["galvani"],
  },
  {
    key: "voltaic-pile",
    slug: `${SEED_PREFIX}-voltaic-pile-1800`,
    title: "Volta invents the voltaic pile",
    summary:
      "Alessandro Volta introduces the first continuous electric battery.",
    detail:
      "The voltaic pile provided sustained current and enabled controlled electrical experimentation and early electrical devices.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1800, era: "CE", precision: "exact" },
    location: "Pavia, Italy",
    characterKeys: ["volta", "galvani"],
  },
  {
    key: "oersted-electromagnetism",
    slug: `${SEED_PREFIX}-oersted-electromagnetism-1820`,
    title: "Oersted links electricity and magnetism",
    summary:
      "Hans Christian Oersted observes compass deflection by electric current.",
    detail:
      "The observation demonstrated that electric currents generate magnetic effects, initiating classical electromagnetism.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1820, era: "CE", precision: "exact" },
    location: "Copenhagen, Denmark",
    characterKeys: ["oersted"],
  },
  {
    key: "ampere-electrodynamics",
    slug: `${SEED_PREFIX}-ampere-electrodynamics-1820`,
    title: "Ampere formulates electrodynamic laws",
    summary:
      "Andre-Marie Ampere develops mathematical laws for current-carrying conductors.",
    detail:
      "Ampere translated experimental findings into theory, helping define quantitative electrodynamics.",
    event_type: "discovery",
    importance: 8,
    temporal_data: { year: 1820, era: "CE", precision: "exact" },
    location: "Paris, France",
    characterKeys: ["ampere", "oersted"],
  },
  {
    key: "ohms-law",
    slug: `${SEED_PREFIX}-ohms-law-1827`,
    title: "Ohm publishes Ohm's law",
    summary: "Georg Ohm quantifies resistance-current-voltage relationships.",
    detail:
      "Ohm's 1827 publication established a foundational law for circuit analysis and electrical engineering design.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1827, era: "CE", precision: "exact" },
    location: "Berlin, Germany",
    characterKeys: ["ohm"],
  },
  {
    key: "faraday-induction",
    slug: `${SEED_PREFIX}-faraday-induction-1831`,
    title: "Faraday discovers electromagnetic induction",
    summary:
      "Michael Faraday shows that changing magnetic fields induce current.",
    detail:
      "This principle underpins electric generators, transformers, and modern power systems.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1831, era: "CE", precision: "exact" },
    location: "London, England",
    characterKeys: ["faraday"],
  },
  {
    key: "morse-telegraph",
    slug: `${SEED_PREFIX}-morse-telegraph-1837`,
    title: "Morse develops practical electric telegraph",
    summary:
      "Samuel Morse demonstrates and advances practical long-distance telegraphy.",
    detail:
      "Telegraph systems converted electrical signaling into scalable communication infrastructure.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 1837, era: "CE", precision: "exact" },
    location: "United States",
    characterKeys: ["morse"],
  },
  {
    key: "first-telegraph-message",
    slug: `${SEED_PREFIX}-first-public-telegraph-message-1844`,
    title: "First public long-distance telegraph message",
    summary:
      "A demonstration line transmits What hath God wrought, proving electric telegraph viability.",
    detail:
      "The Washington-Baltimore line showed electricity could carry information at unprecedented speed.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 1844, era: "CE", precision: "exact" },
    location: "Washington to Baltimore, United States",
    characterKeys: ["morse"],
  },
  {
    key: "maxwell-equations",
    slug: `${SEED_PREFIX}-maxwell-electromagnetic-theory-1864`,
    title: "Maxwell unifies electromagnetic theory",
    summary:
      "James Clerk Maxwell publishes the dynamical theory of the electromagnetic field.",
    detail:
      "The equations unified electricity, magnetism, and light, predicting electromagnetic waves.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1864, era: "CE", precision: "exact" },
    location: "London, England",
    characterKeys: ["maxwell", "faraday"],
  },
  {
    key: "heaviside-vector-form",
    slug: `${SEED_PREFIX}-heaviside-vector-reformulation-1884`,
    title: "Heaviside reformulates Maxwell equations",
    summary:
      "Oliver Heaviside reshapes Maxwell's framework into the modern vector form.",
    detail:
      "The reformulation made electromagnetic analysis more compact and practical for engineering use.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 1884, era: "CE", precision: "exact" },
    location: "England",
    characterKeys: ["heaviside", "maxwell"],
  },
  {
    key: "hertz-waves",
    slug: `${SEED_PREFIX}-hertz-electromagnetic-waves-1887`,
    title: "Hertz confirms electromagnetic waves experimentally",
    summary:
      "Heinrich Hertz detects and characterizes radio-frequency electromagnetic waves.",
    detail:
      "Hertz's experiments validated Maxwell's wave predictions and paved the way for radio technology.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1887, era: "CE", precision: "exact" },
    location: "Karlsruhe, Germany",
    characterKeys: ["hertz", "maxwell"],
  },
  {
    key: "tesla-ac-system",
    slug: `${SEED_PREFIX}-tesla-polyphase-ac-system-1888`,
    title: "Tesla introduces practical polyphase AC system",
    summary:
      "Nikola Tesla's AC motor and polyphase patents accelerate modern electric power delivery.",
    detail:
      "Polyphase AC systems enabled efficient long-distance transmission and industrial electrification.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 1888, era: "CE", precision: "exact" },
    location: "United States",
    characterKeys: ["tesla"],
  },
  {
    key: "thomson-electron",
    slug: `${SEED_PREFIX}-thomson-electron-discovery-1897`,
    title: "J. J. Thomson identifies the electron",
    summary:
      "Cathode ray experiments establish the electron as a fundamental charged particle.",
    detail:
      "The discovery transformed the theoretical basis of electricity and atomic structure.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1897, era: "CE", precision: "exact" },
    location: "Cambridge, England",
    characterKeys: ["thomson"],
  },
  {
    key: "steinmetz-hysteresis",
    slug: `${SEED_PREFIX}-steinmetz-hysteresis-1892`,
    title: "Steinmetz advances AC hysteresis modeling",
    summary:
      "Charles Proteus Steinmetz formalizes hysteresis laws central to AC machine design.",
    detail:
      "His models made alternating-current system design and industrial deployment more reliable.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 1892, era: "CE", precision: "exact" },
    location: "United States",
    characterKeys: ["steinmetz", "tesla"],
  },
];

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function asJson<T>(value: unknown): T {
  return value as T;
}

function assertTemporalData(value: TemporalData): void {
  if (!Number.isInteger(value.year)) {
    throw new Error(
      `Temporal year must be an integer. Received: ${value.year}`,
    );
  }
}

async function restRequest<T>(
  baseUrl: string,
  serviceRoleKey: string,
  table: string,
  options: RestRequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/rest/v1/${table}`);

  if (options.query) {
    for (const piece of options.query.split("&")) {
      const [key, ...rest] = piece.split("=");
      url.searchParams.set(key, rest.join("="));
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: options.returnRepresentation
        ? "return=representation"
        : "return=minimal",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `PostgREST ${method} ${table} failed (${response.status} ${response.statusText}): ${text}`,
    );
  }

  if (response.status === 204) {
    return asJson<T>([]);
  }

  const text = await response.text();
  if (!text) {
    return asJson<T>([]);
  }

  return JSON.parse(text) as T;
}

async function authAdminRequest<T>(
  baseUrl: string,
  serviceRoleKey: string,
  path: string,
  method: "GET" | "POST" | "PUT",
  body?: unknown,
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, "")}/auth/v1/admin/${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Auth admin ${method} ${path} failed (${response.status} ${response.statusText}): ${text}`,
    );
  }

  return (await response.json()) as T;
}

async function ensureAdminUser(
  baseUrl: string,
  serviceRoleKey: string,
  email: string,
  password: string,
): Promise<AuthAdminUser> {
  const usersResponse = await authAdminRequest<AuthAdminUsersResponse>(
    baseUrl,
    serviceRoleKey,
    "users?page=1&per_page=1000",
    "GET",
  );

  const existingUser = usersResponse.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );

  const ensuredUser = existingUser
    ? await authAdminRequest<AuthAdminUser>(
        baseUrl,
        serviceRoleKey,
        `users/${existingUser.id}`,
        "PUT",
        {
          password,
          email_confirm: true,
          user_metadata: {
            first_name: "Admin",
            last_name: "User",
          },
        },
      )
    : await authAdminRequest<AuthAdminUser>(
        baseUrl,
        serviceRoleKey,
        "users",
        "POST",
        {
          email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: "Admin",
            last_name: "User",
          },
        },
      );

  if (!ensuredUser.id) {
    throw new Error("Could not resolve admin user id from Auth Admin API.");
  }

  return ensuredUser;
}

function encodeIn(values: string[]): string {
  return `(${values.map((value) => `"${value}"`).join(",")})`;
}

async function main(): Promise<void> {
  const baseUrl =
    parseArg("url") ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "http://127.0.0.1:54321";
  const serviceRoleKey =
    parseArg("service-role-key") || requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const adminEmail =
    parseArg("admin-email") ||
    process.env.SEED_ADMIN_EMAIL ||
    DEFAULT_ADMIN_EMAIL;
  const adminPassword =
    parseArg("admin-password") ||
    process.env.SEED_ADMIN_PASSWORD ||
    DEFAULT_ADMIN_PASSWORD;

  for (const character of CHARACTERS) {
    assertTemporalData(character.birth_temporal);
    assertTemporalData(character.death_temporal);
  }

  for (const event of EVENTS) {
    assertTemporalData(event.temporal_data);
  }

  const adminUser = await ensureAdminUser(
    baseUrl,
    serviceRoleKey,
    adminEmail,
    adminPassword,
  );
  const userId = adminUser.id;

  await restRequest<unknown>(baseUrl, serviceRoleKey, "profiles", {
    method: "PATCH",
    query: `id=eq.${userId}`,
    body: {
      first_name: "Admin",
      last_name: "User",
      role: "admin",
    },
  });

  console.log("Seeding dataset:", `${DATASET_NAME}:${DATASET_VERSION}`);
  console.log("Target user:", userId);
  console.log("Target admin email:", adminEmail);
  console.log("Base URL:", baseUrl);

  const existingTimelineRows = await restRequest<InsertedRow[]>(
    baseUrl,
    serviceRoleKey,
    "timelines",
    {
      query: `select=id,slug&user_id=eq.${userId}&slug=eq.${TIMELINE.slug}`,
    },
  );

  const existingEventRows = await restRequest<InsertedRow[]>(
    baseUrl,
    serviceRoleKey,
    "events",
    {
      query: `select=id,slug&user_id=eq.${userId}&slug=like.${SEED_PREFIX}-%`,
    },
  );

  const existingCharacterRows = await restRequest<InsertedRow[]>(
    baseUrl,
    serviceRoleKey,
    "characters",
    {
      query: `select=id,slug&user_id=eq.${userId}&slug=like.${SEED_PREFIX}-%`,
    },
  );

  if (existingEventRows.length > 0) {
    await restRequest<unknown>(baseUrl, serviceRoleKey, "events", {
      method: "DELETE",
      query: `user_id=eq.${userId}&slug=in.${encodeIn(existingEventRows.map((row) => row.slug))}`,
    });
  }

  if (existingCharacterRows.length > 0) {
    await restRequest<unknown>(baseUrl, serviceRoleKey, "characters", {
      method: "DELETE",
      query: `user_id=eq.${userId}&slug=in.${encodeIn(existingCharacterRows.map((row) => row.slug))}`,
    });
  }

  if (existingTimelineRows.length > 0) {
    await restRequest<unknown>(baseUrl, serviceRoleKey, "timelines", {
      method: "DELETE",
      query: `user_id=eq.${userId}&slug=eq.${TIMELINE.slug}`,
    });
  }

  const insertedTimeline = await restRequest<Array<{ id: string }>>(
    baseUrl,
    serviceRoleKey,
    "timelines",
    {
      method: "POST",
      returnRepresentation: true,
      body: {
        user_id: userId,
        slug: TIMELINE.slug,
        title: TIMELINE.title,
        summary: TIMELINE.summary,
        detail: TIMELINE.detail,
        timeline_type: "general",
        visibility: "private",
        temporal_data: TIMELINE.temporal_data,
        end_temporal_data: TIMELINE.end_temporal_data,
        metadata: {
          seed_dataset: DATASET_NAME,
          seed_version: DATASET_VERSION,
          seed_prefix: SEED_PREFIX,
        },
      },
    },
  );

  const timelineId = insertedTimeline[0]?.id;
  if (!timelineId) {
    throw new Error("Timeline insert did not return an id.");
  }

  const insertedCharacters = await restRequest<InsertedRow[]>(
    baseUrl,
    serviceRoleKey,
    "characters",
    {
      method: "POST",
      returnRepresentation: true,
      body: CHARACTERS.map((character) => ({
        user_id: userId,
        slug: character.slug,
        name: character.name,
        character_type: character.character_type,
        biography: character.biography,
        aliases: character.aliases,
        cultural_context: character.cultural_context,
        significance: character.significance,
        birth_temporal: character.birth_temporal,
        death_temporal: character.death_temporal,
        metadata: {
          seed_dataset: DATASET_NAME,
          seed_version: DATASET_VERSION,
          seed_prefix: SEED_PREFIX,
          seed_key: character.key,
        },
      })),
    },
  );

  const characterIdByKey = new Map<string, string>();
  for (const character of CHARACTERS) {
    const inserted = insertedCharacters.find(
      (row) => row.slug === character.slug,
    );
    if (!inserted?.id) {
      throw new Error(`Character insert missing id for ${character.name}`);
    }
    characterIdByKey.set(character.key, inserted.id);
  }

  const insertedEvents = await restRequest<InsertedRow[]>(
    baseUrl,
    serviceRoleKey,
    "events",
    {
      method: "POST",
      returnRepresentation: true,
      body: EVENTS.map((event) => ({
        user_id: userId,
        slug: event.slug,
        title: event.title,
        summary: event.summary,
        detail: event.detail,
        event_type: event.event_type,
        importance: event.importance,
        temporal_data: event.temporal_data,
        location: event.location,
        timeline_id: timelineId,
        metadata: {
          seed_dataset: DATASET_NAME,
          seed_version: DATASET_VERSION,
          seed_prefix: SEED_PREFIX,
          seed_key: event.key,
        },
      })),
    },
  );

  const eventIdByKey = new Map<string, string>();
  for (const event of EVENTS) {
    const inserted = insertedEvents.find((row) => row.slug === event.slug);
    if (!inserted?.id) {
      throw new Error(`Event insert missing id for ${event.title}`);
    }
    eventIdByKey.set(event.key, inserted.id);
  }

  const timelineEventRows = EVENTS.map((event) => ({
    timeline_id: timelineId,
    event_id: eventIdByKey.get(event.key),
  })).filter((row): row is { timeline_id: string; event_id: string } =>
    Boolean(row.event_id),
  );

  await restRequest<unknown>(baseUrl, serviceRoleKey, "timeline_events", {
    method: "POST",
    body: timelineEventRows,
  });

  const eventCharacterRows = EVENTS.flatMap((event) => {
    const eventId = eventIdByKey.get(event.key);
    if (!eventId) {
      return [];
    }

    return event.characterKeys.map((characterKey, index) => {
      const characterId = characterIdByKey.get(characterKey);
      if (!characterId) {
        throw new Error(
          `Event ${event.key} references unknown character key: ${characterKey}`,
        );
      }

      return {
        event_id: eventId,
        character_id: characterId,
        role: "protagonist",
        significance: index === 0 ? "primary" : "secondary",
        description:
          index === 0
            ? "Primary historical contributor for this discovery milestone."
            : "Related contributor or conceptual predecessor/successor.",
      };
    });
  });

  await restRequest<unknown>(baseUrl, serviceRoleKey, "event_characters", {
    method: "POST",
    body: eventCharacterRows,
  });

  console.log("Seed complete.");
  console.log(`Deleted timelines: ${existingTimelineRows.length}`);
  console.log(`Deleted events: ${existingEventRows.length}`);
  console.log(`Deleted characters: ${existingCharacterRows.length}`);
  console.log(`Inserted timelines: 1`);
  console.log(`Inserted characters: ${insertedCharacters.length}`);
  console.log(`Inserted events: ${insertedEvents.length}`);
  console.log(`Inserted event_characters: ${eventCharacterRows.length}`);
  console.log(`Inserted timeline_events: ${timelineEventRows.length}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Seed failed:", message);
  process.exitCode = 1;
});
