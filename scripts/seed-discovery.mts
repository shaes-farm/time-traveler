import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as dotenvConfig } from "dotenv";
import { findAdminUser } from "./seed-admin.mts";

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
  /** Which timeline (by TIMELINES key) this event belongs to. */
  timelineKey: string;
};

type TimelineSeed = {
  key: string;
  slug: string;
  title: string;
  summary: string;
  detail: string;
  temporal_data: TemporalData;
  end_temporal_data: TemporalData;
};

type PeriodSeed = {
  slug: string;
  title: string;
  summary: string;
  detail: string;
  temporal_data: TemporalData;
  end_temporal_data: TemporalData;
};

type InsertedRow = { id: string; slug: string };

type RestRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: string;
  body?: unknown;
  returnRepresentation?: boolean;
};

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.resolve(SCRIPT_DIR, "../.env.local") });

// Seed prefix is preserved from v1 (`seed-electricity`) so the cleanup
// pass deletes any rows from the prior electricity-only dataset. The
// underlying dataset is now broader (electricity + physics + astronomy
// grouped under an "Age of Scientific Discovery" period).
const SEED_PREFIX = "seed-electricity";
const DATASET_NAME = "scientific_discoveries";
const DATASET_VERSION = "v2";
const DEFAULT_ADMIN_EMAIL = "admin@timetraveler.local";

// ─── Parent period ───────────────────────────────────────────────────────────

const PERIOD: PeriodSeed = {
  slug: `${SEED_PREFIX}-age-of-scientific-discovery`,
  title: "The Age of Scientific Discovery",
  summary:
    "The long arc from Renaissance natural philosophy through early-20th-century quantum and relativistic physics — a single period that frames the three timelines that follow.",
  detail:
    "Between Copernicus's De revolutionibus (1543) and the deaths of Einstein and Hubble (1955 / 1953), the practice of science transformed from speculative philosophy into a quantitative, experimental enterprise organized into specialized disciplines. The three timelines grouped under this period — electrical discovery, physics, and astronomy — overlap and feed each other: Newton's mechanics underwrites both Kepler's celestial laws and Faraday's later field thinking; Maxwell's electromagnetism reshapes both physics and observational astronomy; Einstein's relativity closes the era by unifying gravity, geometry, and the cosmos.",
  temporal_data: { year: 1500, era: "CE", precision: "approximate" },
  end_temporal_data: { year: 1955, era: "CE", precision: "approximate" },
};

// ─── Timelines (one per discipline) ──────────────────────────────────────────

const TIMELINES: TimelineSeed[] = [
  {
    key: "electricity",
    slug: `${SEED_PREFIX}-history-of-electrical-discoveries`,
    title: "History of Electrical Discoveries",
    summary:
      "A chronological overview of foundational electrical discoveries and electromagnetic theory from early modern science to industrial electrification.",
    detail:
      "This timeline tracks foundational experiments, laws, and technological breakthroughs that transformed electricity from natural curiosity into modern infrastructure.",
    temporal_data: { year: 1600, era: "CE", precision: "exact" },
    end_temporal_data: { year: 1900, era: "CE", precision: "approximate" },
  },
  {
    key: "physics",
    slug: `${SEED_PREFIX}-history-of-physics`,
    title: "History of Physics",
    summary:
      "From Renaissance alchemy through Newtonian mechanics, thermodynamics, and the quantum and relativistic revolutions of the early 20th century.",
    detail:
      "Physics emerged from the older traditions of alchemy and natural philosophy and steadily acquired the mathematical machinery — calculus, thermodynamic state functions, statistical mechanics, quantum theory — that would make it the dominant scientific discipline of the modern era.",
    temporal_data: { year: 1525, era: "CE", precision: "approximate" },
    end_temporal_data: { year: 1955, era: "CE", precision: "approximate" },
  },
  {
    key: "astronomy",
    slug: `${SEED_PREFIX}-history-of-astronomy`,
    title: "History of Astronomy",
    summary:
      "From Copernicus's heliocentric model through Kepler's planetary laws, Newtonian celestial mechanics, and Hubble's discovery of the expanding universe.",
    detail:
      "The astronomical revolution displaced Earth from the centre of the cosmos and culminated, four centuries later, in evidence that the universe itself is expanding. Along the way the practice of astronomy was reshaped by ever-better instruments, the mathematics of orbital mechanics, and an enlarging conception of cosmic scale.",
    temporal_data: { year: 1543, era: "CE", precision: "exact" },
    end_temporal_data: { year: 1953, era: "CE", precision: "exact" },
  },
];

// ─── Characters ──────────────────────────────────────────────────────────────

const CHARACTERS: CharacterSeed[] = [
  // ── Electricity track ────────────────────────────────────────────────────
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
  // ── Physics track ────────────────────────────────────────────────────────
  {
    key: "paracelsus",
    slug: `${SEED_PREFIX}-paracelsus`,
    name: "Paracelsus",
    character_type: "human",
    biography:
      "Swiss physician and alchemist who repudiated classical humoral medicine, championed observation, and laid the groundwork for iatrochemistry — the application of chemistry to medicine.",
    aliases: ["Theophrastus von Hohenheim"],
    cultural_context: ["Renaissance alchemy", "Iatrochemistry", "Swiss-German"],
    significance: "high",
    birth_temporal: { year: 1493, era: "CE", precision: "exact" },
    death_temporal: { year: 1541, era: "CE", precision: "exact" },
  },
  {
    key: "galileo",
    slug: `${SEED_PREFIX}-galileo-galilei`,
    name: "Galileo Galilei",
    character_type: "human",
    biography:
      "Italian astronomer and physicist whose telescopic observations and law of falling bodies inaugurated experimental physics and decisively supported heliocentrism.",
    aliases: ["Galileo"],
    cultural_context: [
      "Italian Renaissance",
      "Scientific revolution",
      "Astronomy",
      "Mechanics",
    ],
    significance: "critical",
    birth_temporal: { year: 1564, era: "CE", precision: "exact" },
    death_temporal: { year: 1642, era: "CE", precision: "exact" },
  },
  {
    key: "newton",
    slug: `${SEED_PREFIX}-isaac-newton`,
    name: "Isaac Newton",
    character_type: "human",
    biography:
      "English mathematician and natural philosopher whose Principia framed classical mechanics, optics, and universal gravitation and dominated physical science for two centuries.",
    aliases: ["Sir Isaac Newton"],
    cultural_context: [
      "English Enlightenment",
      "Classical mechanics",
      "Mathematical physics",
    ],
    significance: "critical",
    birth_temporal: { year: 1643, era: "CE", precision: "exact" },
    death_temporal: { year: 1727, era: "CE", precision: "exact" },
  },
  {
    key: "lavoisier",
    slug: `${SEED_PREFIX}-antoine-lavoisier`,
    name: "Antoine Lavoisier",
    character_type: "human",
    biography:
      "French chemist who established the conservation of mass, named oxygen and hydrogen, and is widely regarded as the founder of modern chemistry.",
    aliases: ["Antoine-Laurent de Lavoisier"],
    cultural_context: ["French Enlightenment", "Chemistry", "Quantitative method"],
    significance: "critical",
    birth_temporal: { year: 1743, era: "CE", precision: "exact" },
    death_temporal: { year: 1794, era: "CE", precision: "exact" },
  },
  {
    key: "goethe",
    slug: `${SEED_PREFIX}-johann-wolfgang-goethe`,
    name: "Johann Wolfgang von Goethe",
    character_type: "human",
    biography:
      "German writer and natural philosopher whose Theory of Colours articulated a phenomenological alternative to Newton's spectral optics and influenced later perceptual and morphological science.",
    aliases: ["Goethe"],
    cultural_context: [
      "German Romanticism",
      "Natural philosophy",
      "Phenomenology of perception",
    ],
    significance: "high",
    birth_temporal: { year: 1749, era: "CE", precision: "exact" },
    death_temporal: { year: 1832, era: "CE", precision: "exact" },
  },
  {
    key: "carnot",
    slug: `${SEED_PREFIX}-sadi-carnot`,
    name: "Sadi Carnot",
    character_type: "human",
    biography:
      "French military engineer whose Reflections on the Motive Power of Fire founded the science of thermodynamics by analyzing the efficiency of heat engines.",
    aliases: ["Nicolas Leonard Sadi Carnot"],
    cultural_context: ["French science", "Thermodynamics", "Industrial era"],
    significance: "high",
    birth_temporal: { year: 1796, era: "CE", precision: "exact" },
    death_temporal: { year: 1832, era: "CE", precision: "exact" },
  },
  {
    key: "joule",
    slug: `${SEED_PREFIX}-james-prescott-joule`,
    name: "James Prescott Joule",
    character_type: "human",
    biography:
      "English physicist whose paddle-wheel experiments quantified the mechanical equivalent of heat and helped establish energy conservation.",
    aliases: ["J. P. Joule"],
    cultural_context: ["British science", "Thermodynamics", "Energy conservation"],
    significance: "high",
    birth_temporal: { year: 1818, era: "CE", precision: "exact" },
    death_temporal: { year: 1889, era: "CE", precision: "exact" },
  },
  {
    key: "clausius",
    slug: `${SEED_PREFIX}-rudolf-clausius`,
    name: "Rudolf Clausius",
    character_type: "human",
    biography:
      "German physicist who introduced the concept of entropy and gave the second law of thermodynamics its modern formulation.",
    aliases: ["Rudolf Julius Emanuel Clausius"],
    cultural_context: ["German science", "Thermodynamics", "Statistical physics"],
    significance: "high",
    birth_temporal: { year: 1822, era: "CE", precision: "exact" },
    death_temporal: { year: 1888, era: "CE", precision: "exact" },
  },
  {
    key: "boltzmann",
    slug: `${SEED_PREFIX}-ludwig-boltzmann`,
    name: "Ludwig Boltzmann",
    character_type: "human",
    biography:
      "Austrian physicist who derived thermodynamic behaviour from the statistical mechanics of atoms and molecules, linking entropy to microscopic disorder.",
    aliases: [],
    cultural_context: ["Austrian science", "Statistical mechanics", "Atomism"],
    significance: "critical",
    birth_temporal: { year: 1844, era: "CE", precision: "exact" },
    death_temporal: { year: 1906, era: "CE", precision: "exact" },
  },
  {
    key: "planck",
    slug: `${SEED_PREFIX}-max-planck`,
    name: "Max Planck",
    character_type: "human",
    biography:
      "German physicist whose quantum hypothesis — that radiation is emitted in discrete energy packets — opened the quantum era.",
    aliases: ["Max Karl Ernst Ludwig Planck"],
    cultural_context: ["German science", "Quantum theory", "Mathematical physics"],
    significance: "critical",
    birth_temporal: { year: 1858, era: "CE", precision: "exact" },
    death_temporal: { year: 1947, era: "CE", precision: "exact" },
  },
  {
    key: "einstein",
    slug: `${SEED_PREFIX}-albert-einstein`,
    name: "Albert Einstein",
    character_type: "human",
    biography:
      "German-born theoretical physicist whose special and general theories of relativity reshaped physics by unifying space, time, gravitation, and the geometry of the cosmos.",
    aliases: [],
    cultural_context: [
      "German Jewish diaspora",
      "Relativity",
      "Quantum theory",
      "Mathematical physics",
    ],
    significance: "critical",
    birth_temporal: { year: 1879, era: "CE", precision: "exact" },
    death_temporal: { year: 1955, era: "CE", precision: "exact" },
  },
  {
    key: "bohr",
    slug: `${SEED_PREFIX}-niels-bohr`,
    name: "Niels Bohr",
    character_type: "human",
    biography:
      "Danish physicist whose model of the atom — electrons in quantized orbits around a nucleus — fused quantum theory with atomic structure and underpinned modern atomic physics.",
    aliases: [],
    cultural_context: ["Danish science", "Quantum mechanics", "Atomic physics"],
    significance: "critical",
    birth_temporal: { year: 1885, era: "CE", precision: "exact" },
    death_temporal: { year: 1962, era: "CE", precision: "exact" },
  },
  // ── Astronomy track ──────────────────────────────────────────────────────
  {
    key: "copernicus",
    slug: `${SEED_PREFIX}-nicolaus-copernicus`,
    name: "Nicolaus Copernicus",
    character_type: "human",
    biography:
      "Polish mathematician and astronomer whose De revolutionibus orbium coelestium displaced the geocentric cosmos with a heliocentric model and began the astronomical revolution.",
    aliases: ["Mikolaj Kopernik"],
    cultural_context: [
      "Polish Renaissance",
      "Heliocentrism",
      "Mathematical astronomy",
    ],
    significance: "critical",
    birth_temporal: { year: 1473, era: "CE", precision: "exact" },
    death_temporal: { year: 1543, era: "CE", precision: "exact" },
  },
  {
    key: "brahe",
    slug: `${SEED_PREFIX}-tycho-brahe`,
    name: "Tycho Brahe",
    character_type: "human",
    biography:
      "Danish nobleman whose unprecedentedly precise pre-telescopic observations of the heavens supplied the empirical bedrock for Kepler's planetary laws.",
    aliases: ["Tyge Ottesen Brahe"],
    cultural_context: ["Danish Renaissance", "Observational astronomy"],
    significance: "critical",
    birth_temporal: { year: 1546, era: "CE", precision: "exact" },
    death_temporal: { year: 1601, era: "CE", precision: "exact" },
  },
  {
    key: "kepler",
    slug: `${SEED_PREFIX}-johannes-kepler`,
    name: "Johannes Kepler",
    character_type: "human",
    biography:
      "German mathematician and astronomer whose three laws of planetary motion, derived from Brahe's data, replaced circular orbits with ellipses and prepared the ground for Newton.",
    aliases: [],
    cultural_context: ["German Renaissance", "Mathematical astronomy", "Optics"],
    significance: "critical",
    birth_temporal: { year: 1571, era: "CE", precision: "exact" },
    death_temporal: { year: 1630, era: "CE", precision: "exact" },
  },
  {
    key: "halley",
    slug: `${SEED_PREFIX}-edmond-halley`,
    name: "Edmond Halley",
    character_type: "human",
    biography:
      "English astronomer who, applying Newton's gravitational theory, predicted the return of the comet that now bears his name.",
    aliases: ["Edmund Halley"],
    cultural_context: [
      "English Enlightenment",
      "Celestial mechanics",
      "Cometary astronomy",
    ],
    significance: "high",
    birth_temporal: { year: 1656, era: "CE", precision: "exact" },
    death_temporal: { year: 1742, era: "CE", precision: "exact" },
  },
  {
    key: "herschel",
    slug: `${SEED_PREFIX}-william-herschel`,
    name: "William Herschel",
    character_type: "human",
    biography:
      "German-British astronomer who discovered Uranus, catalogued deep-sky objects, and pioneered systematic surveys of the structure of the Milky Way.",
    aliases: ["Friedrich Wilhelm Herschel"],
    cultural_context: [
      "British astronomy",
      "German diaspora",
      "Deep-sky surveys",
    ],
    significance: "high",
    birth_temporal: { year: 1738, era: "CE", precision: "exact" },
    death_temporal: { year: 1822, era: "CE", precision: "exact" },
  },
  {
    key: "leverrier",
    slug: `${SEED_PREFIX}-urbain-le-verrier`,
    name: "Urbain Le Verrier",
    character_type: "human",
    biography:
      "French mathematician whose perturbation analysis of Uranus's orbit predicted Neptune's existence and position before its 1846 telescopic discovery.",
    aliases: ["Urbain Jean Joseph Le Verrier"],
    cultural_context: [
      "French science",
      "Celestial mechanics",
      "Mathematical astronomy",
    ],
    significance: "high",
    birth_temporal: { year: 1811, era: "CE", precision: "exact" },
    death_temporal: { year: 1877, era: "CE", precision: "exact" },
  },
  {
    key: "cannon",
    slug: `${SEED_PREFIX}-annie-jump-cannon`,
    name: "Annie Jump Cannon",
    character_type: "human",
    biography:
      "American astronomer at Harvard College Observatory who developed the OBAFGKM stellar classification scheme and catalogued spectra for hundreds of thousands of stars.",
    aliases: [],
    cultural_context: [
      "American astronomy",
      "Stellar spectroscopy",
      "Harvard Computers",
    ],
    significance: "high",
    birth_temporal: { year: 1863, era: "CE", precision: "exact" },
    death_temporal: { year: 1941, era: "CE", precision: "exact" },
  },
  {
    key: "leavitt",
    slug: `${SEED_PREFIX}-henrietta-swan-leavitt`,
    name: "Henrietta Swan Leavitt",
    character_type: "human",
    biography:
      "American astronomer whose period-luminosity relation for Cepheid variables supplied the cosmic distance ladder later used to measure the size and expansion of the universe.",
    aliases: [],
    cultural_context: [
      "American astronomy",
      "Variable stars",
      "Harvard Computers",
    ],
    significance: "critical",
    birth_temporal: { year: 1868, era: "CE", precision: "exact" },
    death_temporal: { year: 1921, era: "CE", precision: "exact" },
  },
  {
    key: "schwarzschild",
    slug: `${SEED_PREFIX}-karl-schwarzschild`,
    name: "Karl Schwarzschild",
    character_type: "human",
    biography:
      "German physicist and astronomer who, while serving in WWI, derived the first exact solution of Einstein's field equations and the geometry now associated with black holes.",
    aliases: [],
    cultural_context: [
      "German science",
      "General relativity",
      "Theoretical astrophysics",
    ],
    significance: "high",
    birth_temporal: { year: 1873, era: "CE", precision: "exact" },
    death_temporal: { year: 1916, era: "CE", precision: "exact" },
  },
  {
    key: "hubble",
    slug: `${SEED_PREFIX}-edwin-hubble`,
    name: "Edwin Hubble",
    character_type: "human",
    biography:
      "American astronomer whose Cepheid observations of Andromeda showed it lay beyond the Milky Way and whose redshift–distance relation established the expansion of the universe.",
    aliases: [],
    cultural_context: [
      "American astronomy",
      "Extragalactic astronomy",
      "Cosmology",
    ],
    significance: "critical",
    birth_temporal: { year: 1889, era: "CE", precision: "exact" },
    death_temporal: { year: 1953, era: "CE", precision: "exact" },
  },
];

// ─── Events ──────────────────────────────────────────────────────────────────

const EVENTS: EventSeed[] = [
  // ── Electricity timeline ─────────────────────────────────────────────────
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
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
    timelineKey: "electricity",
  },
  // ── Physics timeline ─────────────────────────────────────────────────────
  {
    key: "paracelsus-iatrochemistry",
    slug: `${SEED_PREFIX}-paracelsus-iatrochemistry-1530`,
    title: "Paracelsus turns alchemy toward iatrochemistry",
    summary:
      "Paracelsus pivots alchemical method from gold-making to applying chemistry to medicine.",
    detail:
      "By insisting that the body could be understood as a chemical system, Paracelsus helped move natural philosophy away from purely classical authorities and toward empirical investigation of matter.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 1530, era: "CE", precision: "circa" },
    location: "Basel, Swiss Confederacy",
    characterKeys: ["paracelsus"],
    timelineKey: "physics",
  },
  {
    key: "galileo-falling-bodies",
    slug: `${SEED_PREFIX}-galileo-falling-bodies-1604`,
    title: "Galileo formulates the law of falling bodies",
    summary:
      "Inclined-plane experiments lead Galileo to the time-squared law of uniformly accelerated motion.",
    detail:
      "Galileo's quantitative analysis of falling bodies established acceleration as a measurable concept and is the foundational result of experimental mechanics.",
    event_type: "discovery",
    importance: 9,
    temporal_data: { year: 1604, era: "CE", precision: "circa" },
    location: "Padua, Republic of Venice",
    characterKeys: ["galileo"],
    timelineKey: "physics",
  },
  {
    key: "galileo-discorsi",
    slug: `${SEED_PREFIX}-galileo-discorsi-1638`,
    title: "Galileo publishes Discorsi",
    summary:
      "Discorsi e dimostrazioni matematiche systematizes Galileo's mechanics.",
    detail:
      "Smuggled out of house arrest and printed in Leiden, the Discorsi consolidated Galileo's results on motion, materials, and projectiles into the first work of modern theoretical mechanics.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 1638, era: "CE", precision: "exact" },
    location: "Leiden, Dutch Republic",
    characterKeys: ["galileo"],
    timelineKey: "physics",
  },
  {
    key: "newton-principia",
    slug: `${SEED_PREFIX}-newton-principia-1687`,
    title: "Newton publishes the Principia",
    summary:
      "Philosophiae Naturalis Principia Mathematica states the laws of motion and universal gravitation.",
    detail:
      "Newton's Principia unified terrestrial and celestial mechanics under three laws of motion and an inverse-square law of gravitation, framing classical physics for the next two centuries.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1687, era: "CE", precision: "exact" },
    location: "London, England",
    characterKeys: ["newton"],
    timelineKey: "physics",
  },
  {
    key: "lavoisier-conservation-of-mass",
    slug: `${SEED_PREFIX}-lavoisier-conservation-mass-1789`,
    title: "Lavoisier states conservation of mass",
    summary:
      "Traité élémentaire de chimie establishes the conservation of mass and reorganizes chemistry around the element concept.",
    detail:
      "Lavoisier's quantitative approach forced chemistry to take measurement seriously, gave physics a usable element catalog, and produced the conservation-of-mass principle that underpins later energy and mass-energy conservation laws.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 1789, era: "CE", precision: "exact" },
    location: "Paris, France",
    characterKeys: ["lavoisier"],
    timelineKey: "physics",
  },
  {
    key: "goethe-theory-of-colours",
    slug: `${SEED_PREFIX}-goethe-theory-of-colours-1810`,
    title: "Goethe publishes Theory of Colours",
    summary:
      "Zur Farbenlehre offers a phenomenological account of colour as a polar interplay of light and darkness.",
    detail:
      "Goethe's work was a deliberate critique of Newtonian optics on its own terms; even where later spectroscopy vindicated Newton, Goethe's careful observational method became a touchstone for the science of perception.",
    event_type: "milestone",
    importance: 6,
    temporal_data: { year: 1810, era: "CE", precision: "exact" },
    location: "Weimar, Saxe-Weimar",
    characterKeys: ["goethe"],
    timelineKey: "physics",
  },
  {
    key: "carnot-reflections",
    slug: `${SEED_PREFIX}-carnot-reflections-1824`,
    title: "Carnot founds thermodynamics",
    summary:
      "Reflections on the Motive Power of Fire analyzes idealized heat engines and the limits of conversion.",
    detail:
      "Carnot identified the temperature difference between hot and cold reservoirs as the fundamental driver of work extraction, prefiguring the first and second laws of thermodynamics.",
    event_type: "discovery",
    importance: 9,
    temporal_data: { year: 1824, era: "CE", precision: "exact" },
    location: "Paris, France",
    characterKeys: ["carnot"],
    timelineKey: "physics",
  },
  {
    key: "joule-equivalent-of-heat",
    slug: `${SEED_PREFIX}-joule-mechanical-equivalent-of-heat-1845`,
    title: "Joule measures the mechanical equivalent of heat",
    summary:
      "Paddle-wheel experiments fix a numerical relation between mechanical work and heat generated.",
    detail:
      "Joule's precise measurements helped collapse the distinction between mechanical and thermal phenomena, anchoring the first law of thermodynamics — the conservation of energy.",
    event_type: "discovery",
    importance: 9,
    temporal_data: { year: 1845, era: "CE", precision: "exact" },
    location: "Manchester, England",
    characterKeys: ["joule"],
    timelineKey: "physics",
  },
  {
    key: "clausius-entropy",
    slug: `${SEED_PREFIX}-clausius-entropy-1865`,
    title: "Clausius introduces entropy",
    summary:
      "Rudolf Clausius defines entropy and gives the second law of thermodynamics its modern form.",
    detail:
      "Naming the state function after a Greek word for transformation, Clausius gave the irreversible character of natural processes a precise mathematical handle and prepared the way for statistical thermodynamics.",
    event_type: "discovery",
    importance: 9,
    temporal_data: { year: 1865, era: "CE", precision: "exact" },
    location: "Zurich, Switzerland",
    characterKeys: ["clausius"],
    timelineKey: "physics",
  },
  {
    key: "boltzmann-statistical-mechanics",
    slug: `${SEED_PREFIX}-boltzmann-statistical-mechanics-1877`,
    title: "Boltzmann links entropy to microstates",
    summary:
      "Boltzmann's S = k log W identifies entropy with the logarithm of accessible microstates.",
    detail:
      "By grounding thermodynamics in the statistics of atomic motion, Boltzmann completed the unification of macroscopic and microscopic physics and supplied the conceptual scaffolding for later quantum statistics.",
    event_type: "discovery",
    importance: 9,
    temporal_data: { year: 1877, era: "CE", precision: "exact" },
    location: "Graz, Austria-Hungary",
    characterKeys: ["boltzmann", "clausius"],
    timelineKey: "physics",
  },
  {
    key: "planck-quantum-hypothesis",
    slug: `${SEED_PREFIX}-planck-quantum-hypothesis-1900`,
    title: "Planck proposes the quantum hypothesis",
    summary:
      "Max Planck derives the blackbody spectrum by assuming radiation is emitted in discrete energy packets.",
    detail:
      "Planck's quantization of energy, intended as a mathematical device, turned out to be physically real and opened the quantum era of physics.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1900, era: "CE", precision: "exact" },
    location: "Berlin, Germany",
    characterKeys: ["planck"],
    timelineKey: "physics",
  },
  {
    key: "einstein-annus-mirabilis",
    slug: `${SEED_PREFIX}-einstein-annus-mirabilis-1905`,
    title: "Einstein's annus mirabilis",
    summary:
      "Four 1905 papers introduce special relativity, mass-energy equivalence, the photoelectric effect, and Brownian motion.",
    detail:
      "In a single year Einstein established the existence of atoms, gave quantum theory empirical traction via the photoelectric effect, and refounded space and time with special relativity.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1905, era: "CE", precision: "exact" },
    location: "Bern, Switzerland",
    characterKeys: ["einstein", "planck", "boltzmann"],
    timelineKey: "physics",
  },
  {
    key: "bohr-atomic-model",
    slug: `${SEED_PREFIX}-bohr-atomic-model-1913`,
    title: "Bohr publishes the quantized atomic model",
    summary:
      "Bohr's three 1913 papers fuse quantum theory with Rutherford's nuclear atom.",
    detail:
      "By postulating quantized electron orbits with allowed transitions, Bohr's model accounted for the hydrogen spectrum and became the bridge between classical orbital pictures and full quantum mechanics.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1913, era: "CE", precision: "exact" },
    location: "Manchester, England",
    characterKeys: ["bohr", "planck"],
    timelineKey: "physics",
  },
  {
    key: "einstein-general-relativity",
    slug: `${SEED_PREFIX}-einstein-general-relativity-1915`,
    title: "Einstein completes general relativity",
    summary:
      "Einstein presents the field equations of general relativity, geometrizing gravity.",
    detail:
      "General relativity recast gravitation as the curvature of spacetime produced by mass-energy, predicting phenomena from light bending to the expanding universe and supplying the mathematical setting for modern cosmology.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1915, era: "CE", precision: "exact" },
    location: "Berlin, Germany",
    characterKeys: ["einstein"],
    timelineKey: "physics",
  },
  // ── Astronomy timeline ───────────────────────────────────────────────────
  {
    key: "copernicus-de-revolutionibus",
    slug: `${SEED_PREFIX}-copernicus-de-revolutionibus-1543`,
    title: "Copernicus publishes De revolutionibus",
    summary:
      "On the Revolutions of the Heavenly Spheres places the Sun, not the Earth, at the centre of the planetary system.",
    detail:
      "Released in the year of Copernicus's death, the book inaugurated the astronomical revolution. Its heliocentric model was at first treated as a calculational convenience and later as a physical truth.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1543, era: "CE", precision: "exact" },
    location: "Nuremberg, Holy Roman Empire",
    characterKeys: ["copernicus"],
    timelineKey: "astronomy",
  },
  {
    key: "brahe-supernova",
    slug: `${SEED_PREFIX}-brahe-supernova-1572`,
    title: "Brahe documents the 1572 supernova",
    summary:
      "Brahe's careful parallax measurements show the new star lies beyond the Moon, challenging the Aristotelian doctrine of an immutable heavens.",
    detail:
      "By demonstrating that a change had occurred in the supposedly perfect celestial sphere, Brahe's observations destabilized the classical cosmos and motivated his program of high-precision astronomy.",
    event_type: "discovery",
    importance: 8,
    temporal_data: { year: 1572, era: "CE", precision: "exact" },
    location: "Knutstorp, Scania (Denmark-Norway)",
    characterKeys: ["brahe"],
    timelineKey: "astronomy",
  },
  {
    key: "brahe-uraniborg",
    slug: `${SEED_PREFIX}-brahe-uraniborg-1576`,
    title: "Brahe founds Uraniborg observatory",
    summary:
      "On the island of Hven, Brahe builds the most sophisticated observatory of the pre-telescopic era.",
    detail:
      "Uraniborg's instruments produced positional data of unprecedented accuracy, which would later allow Kepler to derive his laws of planetary motion.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 1576, era: "CE", precision: "exact" },
    location: "Hven, Denmark-Norway",
    characterKeys: ["brahe"],
    timelineKey: "astronomy",
  },
  {
    key: "kepler-astronomia-nova",
    slug: `${SEED_PREFIX}-kepler-astronomia-nova-1609`,
    title: "Kepler publishes Astronomia nova",
    summary:
      "Astronomia nova introduces the elliptical orbit of Mars and the law of equal areas.",
    detail:
      "Working from Brahe's data after Brahe's death, Kepler abandoned millennia of circular orbits and derived the first two of his three laws of planetary motion.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1609, era: "CE", precision: "exact" },
    location: "Prague, Holy Roman Empire",
    characterKeys: ["kepler", "brahe"],
    timelineKey: "astronomy",
  },
  {
    key: "galileo-moons",
    slug: `${SEED_PREFIX}-galileo-jupiter-moons-1610`,
    title: "Galileo observes the moons of Jupiter",
    summary:
      "Galileo's improved telescope reveals four moons orbiting Jupiter, published in Sidereus Nuncius.",
    detail:
      "The Jovian satellites provided a visible counter-example to the Aristotelian claim that all celestial motion centres on the Earth and gave heliocentrism a striking observational anchor.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1610, era: "CE", precision: "exact" },
    location: "Padua, Republic of Venice",
    characterKeys: ["galileo", "copernicus"],
    timelineKey: "astronomy",
  },
  {
    key: "kepler-harmonices-mundi",
    slug: `${SEED_PREFIX}-kepler-harmonices-mundi-1619`,
    title: "Kepler publishes the third planetary law",
    summary:
      "Harmonices Mundi states the period-distance law relating orbital period to semi-major axis.",
    detail:
      "The third law completed Kepler's empirical description of planetary motion and supplied the empirical pattern that Newton would later derive from universal gravitation.",
    event_type: "discovery",
    importance: 9,
    temporal_data: { year: 1619, era: "CE", precision: "exact" },
    location: "Linz, Holy Roman Empire",
    characterKeys: ["kepler"],
    timelineKey: "astronomy",
  },
  {
    key: "halley-comet-prediction",
    slug: `${SEED_PREFIX}-halley-comet-prediction-1705`,
    title: "Halley predicts the return of his comet",
    summary:
      "Applying Newton's gravitation, Halley argues the comets of 1531, 1607, and 1682 are the same body and predicts a return around 1758.",
    detail:
      "The successful return of Halley's comet in 1758 — after his death — became a celebrated empirical vindication of Newtonian celestial mechanics.",
    event_type: "discovery",
    importance: 9,
    temporal_data: { year: 1705, era: "CE", precision: "exact" },
    location: "Oxford, England",
    characterKeys: ["halley", "newton"],
    timelineKey: "astronomy",
  },
  {
    key: "herschel-uranus",
    slug: `${SEED_PREFIX}-herschel-uranus-1781`,
    title: "Herschel discovers Uranus",
    summary:
      "William Herschel identifies a new planet beyond Saturn, the first such discovery in recorded history.",
    detail:
      "Uranus doubled the known size of the solar system and made the case that systematic telescopic surveys could turn up entirely new worlds, not just refinements of old ones.",
    event_type: "discovery",
    importance: 9,
    temporal_data: { year: 1781, era: "CE", precision: "exact" },
    location: "Bath, England",
    characterKeys: ["herschel"],
    timelineKey: "astronomy",
  },
  {
    key: "neptune-prediction-discovery",
    slug: `${SEED_PREFIX}-neptune-discovery-1846`,
    title: "Neptune discovered via Le Verrier's prediction",
    summary:
      "Le Verrier's calculations from Uranus's orbital irregularities lead Berlin Observatory to find Neptune within a degree of his predicted position.",
    detail:
      "The discovery became the canonical example of a planet identified by theory before observation and a landmark success for celestial mechanics in the Newtonian tradition.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1846, era: "CE", precision: "exact" },
    location: "Berlin Observatory, Prussia",
    characterKeys: ["leverrier"],
    timelineKey: "astronomy",
  },
  {
    key: "cannon-stellar-classification",
    slug: `${SEED_PREFIX}-cannon-stellar-classification-1901`,
    title: "Cannon develops the OBAFGKM stellar classification",
    summary:
      "Annie Jump Cannon's spectral classification system at the Harvard College Observatory becomes the foundation of modern stellar taxonomy.",
    detail:
      "Cannon's catalogues — eventually covering hundreds of thousands of stars — gave 20th-century astrophysics the empirical typology needed to develop theories of stellar structure and evolution.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 1901, era: "CE", precision: "exact" },
    location: "Cambridge, Massachusetts, United States",
    characterKeys: ["cannon"],
    timelineKey: "astronomy",
  },
  {
    key: "leavitt-period-luminosity",
    slug: `${SEED_PREFIX}-leavitt-period-luminosity-1912`,
    title: "Leavitt derives the Cepheid period-luminosity relation",
    summary:
      "Leavitt's study of Cepheid variables in the Magellanic Clouds yields a calibrated distance ladder for the cosmos.",
    detail:
      "By tying period to intrinsic luminosity, Leavitt gave astronomers a way to convert observed brightness into distance, an essential tool for everything from Galactic structure to extragalactic cosmology.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1912, era: "CE", precision: "exact" },
    location: "Cambridge, Massachusetts, United States",
    characterKeys: ["leavitt"],
    timelineKey: "astronomy",
  },
  {
    key: "schwarzschild-solution",
    slug: `${SEED_PREFIX}-schwarzschild-solution-1916`,
    title: "Schwarzschild solves Einstein's field equations",
    summary:
      "Karl Schwarzschild publishes the first exact solution of general relativity, describing the spacetime around a spherical mass.",
    detail:
      "The Schwarzschild solution exposed the event horizon and what would later be recognized as black hole geometry, opening relativistic astrophysics within months of general relativity itself.",
    event_type: "discovery",
    importance: 9,
    temporal_data: { year: 1916, era: "CE", precision: "exact" },
    location: "Eastern Front, German Empire",
    characterKeys: ["schwarzschild", "einstein"],
    timelineKey: "astronomy",
  },
  {
    key: "hubble-andromeda",
    slug: `${SEED_PREFIX}-hubble-andromeda-distance-1925`,
    title: "Hubble shows galaxies lie beyond the Milky Way",
    summary:
      "Cepheid observations of Andromeda place it well outside our galaxy, ending the Great Debate.",
    detail:
      "Using Leavitt's period-luminosity relation, Hubble fixed the distance to the Andromeda nebula and resolved the long-running argument over whether spiral nebulae were within or beyond the Milky Way.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1925, era: "CE", precision: "exact" },
    location: "Mount Wilson Observatory, California, United States",
    characterKeys: ["hubble", "leavitt"],
    timelineKey: "astronomy",
  },
  {
    key: "hubble-expansion-law",
    slug: `${SEED_PREFIX}-hubble-expansion-1929`,
    title: "Hubble announces the expansion of the universe",
    summary:
      "Hubble's redshift-distance relation establishes a roughly linear correlation between galactic recession velocity and distance.",
    detail:
      "Hubble's law transformed cosmology into an empirical science and produced the first direct evidence for the expanding universe predicted by general relativity's cosmological solutions.",
    event_type: "discovery",
    importance: 10,
    temporal_data: { year: 1929, era: "CE", precision: "exact" },
    location: "Mount Wilson Observatory, California, United States",
    characterKeys: ["hubble", "einstein"],
    timelineKey: "astronomy",
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

  // Validate temporal integers up front so we fail fast before any DB writes.
  assertTemporalData(PERIOD.temporal_data);
  assertTemporalData(PERIOD.end_temporal_data);
  for (const timeline of TIMELINES) {
    assertTemporalData(timeline.temporal_data);
    assertTemporalData(timeline.end_temporal_data);
  }
  for (const character of CHARACTERS) {
    assertTemporalData(character.birth_temporal);
    assertTemporalData(character.death_temporal);
  }
  for (const event of EVENTS) {
    assertTemporalData(event.temporal_data);
  }

  const adminUser = await findAdminUser(baseUrl, serviceRoleKey, adminEmail);
  if (!adminUser) {
    throw new Error(
      `Admin user "${adminEmail}" not found. Run 'pnpm db:seed:admin' first.`,
    );
  }
  const userId = adminUser.id;

  console.log("Seeding dataset:", `${DATASET_NAME}:${DATASET_VERSION}`);
  console.log("Target user:", userId);
  console.log("Target admin email:", adminEmail);
  console.log("Base URL:", baseUrl);

  // ── Discover existing rows by slug prefix ──────────────────────────────

  const existingPeriodRows = await restRequest<InsertedRow[]>(
    baseUrl,
    serviceRoleKey,
    "periods",
    {
      query: `select=id,slug&user_id=eq.${userId}&slug=like.${SEED_PREFIX}-%`,
    },
  );

  const existingTimelineRows = await restRequest<InsertedRow[]>(
    baseUrl,
    serviceRoleKey,
    "timelines",
    {
      query: `select=id,slug&user_id=eq.${userId}&slug=like.${SEED_PREFIX}-%`,
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

  // ── Delete in dependency-safe order ────────────────────────────────────

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
      query: `user_id=eq.${userId}&slug=in.${encodeIn(existingTimelineRows.map((row) => row.slug))}`,
    });
  }

  if (existingPeriodRows.length > 0) {
    await restRequest<unknown>(baseUrl, serviceRoleKey, "periods", {
      method: "DELETE",
      query: `user_id=eq.${userId}&slug=in.${encodeIn(existingPeriodRows.map((row) => row.slug))}`,
    });
  }

  // ── Insert period ──────────────────────────────────────────────────────

  // The periods table has no `metadata` column; dataset traceability lives
  // in the slug prefix and (optionally) the `characteristics` text array.
  const insertedPeriod = await restRequest<Array<{ id: string }>>(
    baseUrl,
    serviceRoleKey,
    "periods",
    {
      method: "POST",
      returnRepresentation: true,
      body: {
        user_id: userId,
        slug: PERIOD.slug,
        title: PERIOD.title,
        summary: PERIOD.summary,
        detail: PERIOD.detail,
        temporal_data: PERIOD.temporal_data,
        end_temporal_data: PERIOD.end_temporal_data,
        significance: "critical",
        characteristics: [
          `seed:${DATASET_NAME}:${DATASET_VERSION}`,
          "scientific-revolution",
          "modern-physics",
          "observational-astronomy",
        ],
      },
    },
  );

  const periodId = insertedPeriod[0]?.id;
  if (!periodId) {
    throw new Error("Period insert did not return an id.");
  }

  // ── Insert timelines ──────────────────────────────────────────────────

  const insertedTimelines = await restRequest<InsertedRow[]>(
    baseUrl,
    serviceRoleKey,
    "timelines",
    {
      method: "POST",
      returnRepresentation: true,
      body: TIMELINES.map((timeline) => ({
        user_id: userId,
        slug: timeline.slug,
        title: timeline.title,
        summary: timeline.summary,
        detail: timeline.detail,
        timeline_type: "general",
        visibility: "private",
        temporal_data: timeline.temporal_data,
        end_temporal_data: timeline.end_temporal_data,
        metadata: {
          seed_dataset: DATASET_NAME,
          seed_version: DATASET_VERSION,
          seed_prefix: SEED_PREFIX,
          seed_key: timeline.key,
        },
      })),
    },
  );

  const timelineIdByKey = new Map<string, string>();
  for (const timeline of TIMELINES) {
    const inserted = insertedTimelines.find(
      (row) => row.slug === timeline.slug,
    );
    if (!inserted?.id) {
      throw new Error(`Timeline insert missing id for ${timeline.title}`);
    }
    timelineIdByKey.set(timeline.key, inserted.id);
  }

  // ── Link timelines to the parent period ────────────────────────────────

  await restRequest<unknown>(baseUrl, serviceRoleKey, "period_timelines", {
    method: "POST",
    body: TIMELINES.map((timeline) => ({
      period_id: periodId,
      timeline_id: timelineIdByKey.get(timeline.key),
    })),
  });

  // ── Insert characters ────────────────────────────────────────────────

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

  // ── Insert events with per-event timeline_id ────────────────────────

  const insertedEvents = await restRequest<InsertedRow[]>(
    baseUrl,
    serviceRoleKey,
    "events",
    {
      method: "POST",
      returnRepresentation: true,
      body: EVENTS.map((event) => {
        const timelineId = timelineIdByKey.get(event.timelineKey);
        if (!timelineId) {
          throw new Error(
            `Event ${event.key} references unknown timelineKey: ${event.timelineKey}`,
          );
        }
        return {
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
        };
      }),
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

  // ── Junction: timeline_events ───────────────────────────────────────

  const timelineEventRows = EVENTS.map((event) => {
    const eventId = eventIdByKey.get(event.key);
    const timelineId = timelineIdByKey.get(event.timelineKey);
    return eventId && timelineId
      ? { timeline_id: timelineId, event_id: eventId }
      : null;
  }).filter(
    (row): row is { timeline_id: string; event_id: string } => row !== null,
  );

  await restRequest<unknown>(baseUrl, serviceRoleKey, "timeline_events", {
    method: "POST",
    body: timelineEventRows,
  });

  // ── Junction: event_characters ──────────────────────────────────────

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
  console.log(`Deleted periods: ${existingPeriodRows.length}`);
  console.log(`Deleted timelines: ${existingTimelineRows.length}`);
  console.log(`Deleted events: ${existingEventRows.length}`);
  console.log(`Deleted characters: ${existingCharacterRows.length}`);
  console.log(`Inserted periods: 1`);
  console.log(`Inserted timelines: ${insertedTimelines.length}`);
  console.log(`Inserted period_timelines: ${TIMELINES.length}`);
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
