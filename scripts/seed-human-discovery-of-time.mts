// ============================================================================
// scripts/seed-human-discovery-of-time.mts
//
// On-demand seed for the canonical "Human Discovery of Time" dataset — the
// project's first production-quality corpus and reference implementation
// ("Rosetta Stone"). See docs/the-human-discovery-of-time.md for the vision and
// docs/seeding-human-discovery-of-time.md for operator docs.
//
// The dataset is a FOUNDATION SLICE: the full 12-phase backbone plus three
// deeply-fleshed branches (Universe / Record / Measure) and stub sub-timelines
// for the rest, sized to exercise every subsystem while staying curatable.
//
// It intentionally demonstrates:
//   * Fractal nesting — a root timeline of 12 backbone events, each of which
//     "explodes" into a phase sub-timeline via events.detail_timeline_id, with
//     two branches drilling a further level (three levels total).
//   * The full temporal range — BYA/MYA cosmology → CE modernity → an estimated
//     speculative future, with geological/cosmological display formats.
//   * All seven character types — human, artifact (instruments), organization
//     (observatories / standards bodies), divine + mythological (time-deities),
//     animal (a biological clock), fictional (a time-obsessed character).
//   * The extended relationship vocabulary (ADR-0040) — a causal graph of
//     superseded / improved / derived_from / enabled / influenced / patented /
//     standardized / … among people and instruments.
//
// BLOCKED: 23 of the 31 relationship rows below use causal relationship_type
// verbs that do not exist in the schema yet — the vocabulary ships with #419.
// Until its first PR merges, seeding aborts with 23514 on those rows. The rest
// of the dataset (timelines, events, characters, junctions) is unaffected.
//   * Concurrency — parallel calendar systems on one timeline (Record branch).
//
// Run: pnpm run db:seed:human-time   (see docs for env vars / CLI args).
// Idempotent: delete-and-recreate scoped to the `seed-hdt-` slug prefix; the
// Age of Scientific Discovery dataset (seed-electricity-) is untouched.
// ============================================================================

import {
  assertTemporalData,
  ensureAdminUser,
  encodeIn,
  loadRootEnv,
  resolveSeedConfig,
  restRequest,
  type InsertedRow,
  type TemporalData,
} from "./lib/seed-common.mts";

loadRootEnv();

const SEED_PREFIX = "seed-hdt";
const DATASET_NAME = "human_discovery_of_time";
const DATASET_VERSION = "v1";

// ─── Seed data types ─────────────────────────────────────────────────────────

type PeriodSeed = {
  slug: string;
  title: string;
  summary: string;
  detail: string;
  temporal_data: TemporalData;
  end_temporal_data: TemporalData;
};

type TimelineSeed = {
  key: string;
  slug: string;
  title: string;
  summary: string;
  detail: string;
  scale?: string;
  temporal_data: TemporalData;
  end_temporal_data: TemporalData;
};

type CharacterType =
  | "human"
  | "animal"
  | "mythological"
  | "fictional"
  | "organization"
  | "divine"
  | "artifact";

type CharacterSeed = {
  key: string;
  slug: string;
  name: string;
  character_type: CharacterType;
  biography: string;
  aliases?: string[];
  cultural_context?: string[];
  significance: "low" | "medium" | "high" | "critical";
  species?: string;
  domain?: string;
  birth_temporal?: TemporalData;
  death_temporal?: TemporalData;
};

type ParticipantRole =
  | "protagonist"
  | "antagonist"
  | "witness"
  | "participant"
  | "victim"
  | "beneficiary"
  | "performer"
  | "competitor"
  | "owner"
  | "creator"
  | "observer";

type ParticipantSignificance = "primary" | "secondary" | "minor" | "mentioned";

type Participant = {
  characterKey: string;
  role: ParticipantRole;
  significance: ParticipantSignificance;
  description: string;
};

type EventSeed = {
  key: string;
  slug: string;
  title: string;
  summary: string;
  detail: string;
  event_type:
    | "milestone"
    | "discovery"
    | "creation"
    | "transformation"
    | "migration";
  importance: number;
  temporal_data: TemporalData;
  end_temporal_data?: TemporalData;
  location?: string;
  /** The event's home / containing timeline (events.timeline_id, RLS source). */
  timelineKey: string;
  /** Fractal drill-down: the sub-timeline this event explodes into. */
  detailTimelineKey?: string;
  /** Secondary "also appears in" memberships via the timeline_events junction. */
  alsoInTimelineKeys?: string[];
  /** Narrative order within the home timeline (timeline_events.sort_order). */
  narrativeOrder?: number;
  participants?: Participant[];
  /** Freeform metadata (e.g. calendar supersession recorded as event data). */
  extraMetadata?: Record<string, unknown>;
};

type RelationshipSeed = {
  characterKey: string;
  relatedCharacterKey: string;
  relationship_type: string;
  description: string;
  start_temporal?: TemporalData;
  end_temporal?: TemporalData;
};

// ─── Root period ─────────────────────────────────────────────────────────────

const PERIOD: PeriodSeed = {
  slug: `${SEED_PREFIX}-the-human-discovery-of-time`,
  title: "The Human Discovery of Time",
  summary:
    "The whole arc by which humans came to perceive, predict, and measure time — from the Big Bang's first tick to a speculative future of optical and nuclear clocks.",
  detail:
    "This period frames the dataset's central thesis: humans did not invent time, they discovered ways to describe recurring phenomena. It runs from the origin of spacetime itself, through the natural clocks of Earth and life, to the human progression Observe → Predict → Record → Measure → Standardize → Synchronize → Master Precision → Network — and on to the futures those systems imply.",
  temporal_data: {
    year: 14,
    era: "BYA",
    precision: "approximate",
    uncertainty: 100000000,
    cosmological_epoch: "Planck epoch",
    display_format: "cosmological",
    confidence_level: "high",
  },
  end_temporal_data: {
    year: 2200,
    era: "CE",
    precision: "estimated",
    display_format: "standard",
    confidence_level: "low",
  },
};

// ─── Timelines: root + 12 phase timelines + 3 deeper drill-downs ─────────────

const ROOT_KEY = "root";

const TIMELINES: TimelineSeed[] = [
  {
    key: ROOT_KEY,
    slug: `${SEED_PREFIX}-root`,
    title: "The Human Discovery of Time",
    summary:
      "The backbone timeline: twelve intellectual milestones, each of which explodes into its own sub-timeline.",
    detail:
      "Rather than organizing around technologies, the backbone is organized around milestones in understanding. Each of the twelve events below drills (via detail-timeline) into a dedicated sub-timeline. Their narrative order is the order of discovery, which deliberately differs from strict chronology — standardization and synchronization overlap, as concurrent history does.",
    scale: "cosmological",
    temporal_data: { year: 14, era: "BYA", precision: "approximate", display_format: "cosmological" },
    end_temporal_data: { year: 2200, era: "CE", precision: "estimated" },
  },
  {
    key: "p01",
    slug: `${SEED_PREFIX}-phase-01-universe`,
    title: "1 · The Universe Creates Time",
    summary:
      "Cosmology, not astronomy: the physical systems — expansion, stars, orbits — that later become clocks.",
    detail:
      "Time as a physical dimension emerges with spacetime at the Big Bang. This branch tracks the cosmological events that manufacture the reference cycles everything later depends on, ending with the formation of the Earth–Moon system.",
    scale: "cosmological",
    temporal_data: { year: 14, era: "BYA", precision: "approximate", display_format: "cosmological" },
    end_temporal_data: { year: 4500, era: "MYA", precision: "geological", display_format: "geological" },
  },
  {
    key: "p01-ftm",
    slug: `${SEED_PREFIX}-phase-01-first-three-minutes`,
    title: "1.1 · The First Three Minutes",
    summary:
      "A deeper drill: the earliest epochs, from the Planck time through primordial nucleosynthesis.",
    detail:
      "The Big Bang event explodes into this finer timeline, demonstrating multi-level fractal nesting. Timescales here are fractions of a second to minutes, yet they are dated to the same cosmological instant ~13.8 billion years ago.",
    scale: "cosmological",
    temporal_data: { year: 14, era: "BYA", precision: "approximate", display_format: "cosmological" },
    end_temporal_data: { year: 14, era: "BYA", precision: "approximate", display_format: "cosmological" },
  },
  {
    key: "p01-impact",
    slug: `${SEED_PREFIX}-phase-01-giant-impact`,
    title: "1.2 · The Giant Impact",
    summary:
      "A deeper drill: the collision that formed the Moon and set the tides and the month in motion.",
    detail:
      "The Moon-formation event explodes into this finer timeline of the giant-impact hypothesis — the Mars-sized body Theia striking the proto-Earth, the resulting debris disk, and the Moon's coalescence.",
    scale: "geological",
    temporal_data: { year: 4510, era: "MYA", precision: "geological", display_format: "geological" },
    end_temporal_data: { year: 4500, era: "MYA", precision: "geological", display_format: "geological" },
  },
  {
    key: "p02",
    slug: `${SEED_PREFIX}-phase-02-cycles`,
    title: "2 · Earth Creates Cycles",
    summary: "The natural clocks: rotation, orbit, lunar month, seasons, precession.",
    detail:
      "Recurring phenomena that existed long before any observer. These become the reference cycles — day, month, year — that every human calendar and clock ultimately tries to track.",
    scale: "geological",
    temporal_data: { year: 4500, era: "MYA", precision: "geological", display_format: "geological" },
    end_temporal_data: { year: 2000, era: "CE", precision: "approximate" },
  },
  {
    key: "p03",
    slug: `${SEED_PREFIX}-phase-03-life`,
    title: "3 · Life Adapts to Time",
    summary: "Biological clocks: circadian rhythms, seasonal migration, internal timekeeping.",
    detail:
      "Life evolved to anticipate the natural cycles. This rarely-included branch reminds us that timekeeping predates humanity — organisms were already 'telling time' billions of years before the first calendar.",
    scale: "geological",
    temporal_data: { year: 3500, era: "MYA", precision: "geological", display_format: "geological" },
    end_temporal_data: { year: 2000, era: "CE", precision: "approximate" },
  },
  {
    key: "p04",
    slug: `${SEED_PREFIX}-phase-04-observe`,
    title: "4 · Humans Observe Time",
    summary: "Observations, not inventions: shadows, moon phases, seasonal stars, the Nile flood.",
    detail:
      "The dataset begins the human story with observations rather than instruments. Each observation eventually generates new knowledge — every one is an event because every one is a seed of prediction.",
    temporal_data: { year: 40, era: "KYA", precision: "approximate", display_format: "scientific" },
    end_temporal_data: { year: 500, era: "BCE", precision: "approximate" },
  },
  {
    key: "p05",
    slug: `${SEED_PREFIX}-phase-05-predict`,
    title: "5 · Humans Predict Time",
    summary: "The first science: solstices, eclipses, and planetary motion predicted, not just seen.",
    detail:
      "Prediction marks the transition from observation to explanation — the first scientific revolution. The Saros, the Metonic cycle, precession, and Ptolemy's models turn the sky into something calculable.",
    temporal_data: { year: 2000, era: "BCE", precision: "approximate" },
    end_temporal_data: { year: 150, era: "CE", precision: "circa" },
  },
  {
    key: "p06",
    slug: `${SEED_PREFIX}-phase-06-record`,
    title: "6 · Humans Record Time",
    summary:
      "Calendars emerge — in parallel across civilizations, demonstrating concurrent development.",
    detail:
      "Only now do calendars appear, and they appear everywhere at once: Egyptian, Babylonian, Chinese, Maya, Roman, Indian, Islamic. This branch showcases Time Traveler's ability to represent concurrent historical development rather than forcing a single linear narrative — and the time-deities through which cultures interpreted the sky.",
    temporal_data: { year: 3000, era: "BCE", precision: "approximate" },
    end_temporal_data: { year: 1582, era: "CE", precision: "exact" },
  },
  {
    key: "p07",
    slug: `${SEED_PREFIX}-phase-07-measure`,
    title: "7 · Humans Measure Time",
    summary:
      "The instrument chain — from shadow stick to optical lattice clock — each a leap in precision.",
    detail:
      "The history most people picture. Each instrument is modeled as an artifact character connected to its inventor and to the device it superseded, so the branch is literally a queryable chain of increasing precision.",
    temporal_data: { year: 1500, era: "BCE", precision: "approximate" },
    end_temporal_data: { year: 2020, era: "CE", precision: "exact" },
  },
  {
    key: "p07-lon",
    slug: `${SEED_PREFIX}-phase-07-longitude`,
    title: "7.1 · The Longitude Problem",
    summary:
      "A deeper drill: the navigational crisis that drove the marine chronometer, and the prize that solved it.",
    detail:
      "Harrison's chronometer event explodes into this finer timeline: the Scilly naval disaster, the Longitude Act and its Board, Harrison's H1–H4, and Cook's voyages validating the method.",
    temporal_data: { year: 1707, era: "CE", precision: "exact" },
    end_temporal_data: { year: 1775, era: "CE", precision: "exact" },
  },
  {
    key: "p08",
    slug: `${SEED_PREFIX}-phase-08-standardize`,
    title: "8 · Humans Standardize Time",
    summary: "Institutions appear: railway time, GMT, the Prime Meridian, the SI second, UTC.",
    detail:
      "Standardization is where organizations, standards, and international cooperation become first-class. Local solar time gives way to zones, a prime meridian, and finally an atomic definition of the second.",
    temporal_data: { year: 1840, era: "CE", precision: "exact" },
    end_temporal_data: { year: 1972, era: "CE", precision: "exact" },
  },
  {
    key: "p09",
    slug: `${SEED_PREFIX}-phase-09-synchronize`,
    title: "9 · Humans Synchronize Time",
    summary: "A modern story: telegraph and radio signals, GPS, NTP, PTP — distributed time.",
    detail:
      "How distributed systems solved global synchronization. Time signals travel first by wire, then by radio, then from satellites, then across the internet, each shrinking the uncertainty between distant clocks.",
    temporal_data: { year: 1850, era: "CE", precision: "exact" },
    end_temporal_data: { year: 2010, era: "CE", precision: "exact" },
  },
  {
    key: "p10",
    slug: `${SEED_PREFIX}-phase-10-precision`,
    title: "10 · Humans Master Precision",
    summary:
      "The evolution of accuracy itself — from hours, to seconds, to one second over the age of the universe.",
    detail:
      "Rather than a chronology of devices, this branch tracks accuracy as a quantity: each milestone records the best achievable uncertainty of its era, a narrative of relentlessly improving precision.",
    temporal_data: { year: 1656, era: "CE", precision: "exact" },
    end_temporal_data: { year: 2020, era: "CE", precision: "exact" },
  },
  {
    key: "p11",
    slug: `${SEED_PREFIX}-phase-11-network`,
    title: "11 · Humans Network Time",
    summary: "Time as infrastructure: distributed clocks, the NTP pool, sub-nanosecond fabric.",
    detail:
      "Once time could be transferred, it became a shared utility. Networks of clocks now underpin finance, telecoms, and science, demanding — and achieving — synchronization far below the blink of an eye.",
    temporal_data: { year: 1969, era: "CE", precision: "exact" },
    end_temporal_data: { year: 2020, era: "CE", precision: "exact" },
  },
  {
    key: "p12",
    slug: `${SEED_PREFIX}-phase-12-future`,
    title: "12 · Future Time",
    summary: "Speculative and estimated: redefining the second, relativistic geodesy, interplanetary time.",
    detail:
      "The frontier. These events carry estimated precision and low confidence by design — they demonstrate how the model represents the speculative future as first-class, uncertain data.",
    temporal_data: { year: 2025, era: "CE", precision: "estimated" },
    end_temporal_data: { year: 2200, era: "CE", precision: "estimated", confidence_level: "low" },
  },
];

// ─── Characters (all seven types) ────────────────────────────────────────────

const CHARACTERS: CharacterSeed[] = [
  // Phase 3 — an animal (a biological clock).
  {
    key: "arctic-tern",
    slug: `${SEED_PREFIX}-char-arctic-tern`,
    name: "The Arctic Tern",
    character_type: "animal",
    species: "Sterna paradisaea",
    biography:
      "The archetypal biological navigator: a seabird whose seasonal migration between the Arctic and Antarctic — the longest on Earth — is timed by an internal circadian and circannual clock reading day length and the Sun's position.",
    significance: "medium",
    cultural_context: ["biology", "navigation"],
  },

  // Phase 5 — ancient astronomers (human).
  {
    key: "thales",
    slug: `${SEED_PREFIX}-char-thales`,
    name: "Thales of Miletus",
    character_type: "human",
    biography:
      "Greek natural philosopher, traditionally credited with predicting the solar eclipse of 585 BCE — an early assertion that celestial events follow natural, calculable law rather than divine whim.",
    significance: "high",
    cultural_context: ["Greek", "natural philosophy"],
    birth_temporal: { year: 624, era: "BCE", precision: "circa" },
    death_temporal: { year: 546, era: "BCE", precision: "circa" },
  },
  {
    key: "meton",
    slug: `${SEED_PREFIX}-char-meton`,
    name: "Meton of Athens",
    character_type: "human",
    biography:
      "Athenian astronomer after whom the 19-year Metonic cycle is named — the near-perfect commensuration of 235 lunar months with 19 solar years that underlies lunisolar calendars.",
    significance: "high",
    cultural_context: ["Greek", "astronomy"],
    birth_temporal: { year: 460, era: "BCE", precision: "circa" },
    death_temporal: { year: 400, era: "BCE", precision: "circa" },
  },
  {
    key: "hipparchus",
    slug: `${SEED_PREFIX}-char-hipparchus`,
    name: "Hipparchus of Nicaea",
    character_type: "human",
    biography:
      "Greek astronomer who discovered the precession of the equinoxes and measured the length of the year to within minutes, compiling the first comprehensive star catalogue.",
    significance: "critical",
    cultural_context: ["Greek", "astronomy"],
    birth_temporal: { year: 190, era: "BCE", precision: "circa" },
    death_temporal: { year: 120, era: "BCE", precision: "circa" },
  },
  {
    key: "ptolemy",
    slug: `${SEED_PREFIX}-char-ptolemy`,
    name: "Claudius Ptolemy",
    character_type: "human",
    biography:
      "Greco-Roman astronomer of Alexandria whose Almagest codified a geocentric model able to predict planetary motion, dominating astronomy for fourteen centuries.",
    significance: "critical",
    cultural_context: ["Greek", "Roman", "astronomy"],
    birth_temporal: { year: 100, era: "CE", precision: "circa" },
    death_temporal: { year: 170, era: "CE", precision: "circa" },
  },

  // Phase 6 — calendar reformers (human) + time-deities (divine / mythological).
  {
    key: "caesar",
    slug: `${SEED_PREFIX}-char-julius-caesar`,
    name: "Julius Caesar",
    character_type: "human",
    biography:
      "Roman dictator who, advised by the astronomer Sosigenes, adopted the solar Julian calendar in 46 BCE, replacing the drifting Roman lunar calendar.",
    significance: "high",
    cultural_context: ["Roman"],
    birth_temporal: { year: 100, era: "BCE", precision: "exact" },
    death_temporal: { year: 44, era: "BCE", precision: "exact" },
  },
  {
    key: "sosigenes",
    slug: `${SEED_PREFIX}-char-sosigenes`,
    name: "Sosigenes of Alexandria",
    character_type: "human",
    biography:
      "Greek astronomer who designed the Julian calendar for Caesar, calculating the solar year as 365¼ days and introducing the leap day.",
    significance: "high",
    cultural_context: ["Greek", "astronomy"],
    birth_temporal: { year: 90, era: "BCE", precision: "circa" },
    death_temporal: { year: 20, era: "BCE", precision: "circa" },
  },
  {
    key: "gregory13",
    slug: `${SEED_PREFIX}-char-gregory-xiii`,
    name: "Pope Gregory XIII",
    character_type: "human",
    biography:
      "Pope who promulgated the Gregorian calendar in 1582, correcting the Julian year's accumulated drift against the seasons.",
    significance: "high",
    cultural_context: ["Roman Catholic", "early modern Europe"],
    birth_temporal: { year: 1502, era: "CE", precision: "exact" },
    death_temporal: { year: 1585, era: "CE", precision: "exact" },
  },
  {
    key: "clavius",
    slug: `${SEED_PREFIX}-char-clavius`,
    name: "Christopher Clavius",
    character_type: "human",
    biography:
      "Jesuit mathematician and astronomer who led the technical commission for the Gregorian reform, refining Lilius's scheme into the calendar still in use worldwide.",
    significance: "high",
    cultural_context: ["Jesuit", "mathematics", "astronomy"],
    birth_temporal: { year: 1538, era: "CE", precision: "exact" },
    death_temporal: { year: 1612, era: "CE", precision: "exact" },
  },
  {
    key: "lilius",
    slug: `${SEED_PREFIX}-char-lilius`,
    name: "Aloysius Lilius",
    character_type: "human",
    biography:
      "Italian physician and astronomer who devised the core algorithm of the Gregorian reform — the revised leap-year rule and epact scheme adopted after his death.",
    significance: "medium",
    cultural_context: ["Italian", "astronomy"],
    birth_temporal: { year: 1510, era: "CE", precision: "circa" },
    death_temporal: { year: 1576, era: "CE", precision: "exact" },
  },
  {
    key: "ra",
    slug: `${SEED_PREFIX}-char-ra`,
    name: "Ra",
    character_type: "divine",
    domain: "the Sun, daytime, and the solar year",
    biography:
      "Egyptian sun god whose daily voyage across the sky and through the underworld personified the day, and whose cult was bound to the solar civil calendar of 365 days.",
    significance: "high",
    aliases: ["Re", "Amun-Ra"],
    cultural_context: ["Egyptian", "mythology"],
  },
  {
    key: "thoth",
    slug: `${SEED_PREFIX}-char-thoth`,
    name: "Thoth",
    character_type: "divine",
    domain: "measurement, writing, the Moon, and reckoning",
    biography:
      "Egyptian god of writing, measurement, and the Moon, credited in myth with dividing time into months and years and adding the five epagomenal days to the calendar.",
    significance: "high",
    cultural_context: ["Egyptian", "mythology"],
  },
  {
    key: "chronos",
    slug: `${SEED_PREFIX}-char-chronos`,
    name: "Chronos",
    character_type: "mythological",
    domain: "time itself",
    biography:
      "Greek personification of time — the abstract, devouring flow of duration, distinct from the sequential gods of day and season; the root of words from 'chronology' to 'chronometer'.",
    significance: "high",
    aliases: ["Khronos"],
    cultural_context: ["Greek", "mythology"],
  },
  {
    key: "janus",
    slug: `${SEED_PREFIX}-char-janus`,
    name: "Janus",
    character_type: "mythological",
    domain: "beginnings, transitions, doorways, and the turning of the year",
    biography:
      "Two-faced Roman god of beginnings and transitions, looking to past and future at once; the month of January and the new-year threshold bear his name.",
    significance: "medium",
    cultural_context: ["Roman", "mythology"],
  },

  // Phase 7 — instruments (artifact) and their makers (human) + organizations.
  {
    key: "art-shadow-clock",
    slug: `${SEED_PREFIX}-art-shadow-clock`,
    name: "The Shadow Clock (Gnomon)",
    character_type: "artifact",
    biography:
      "The earliest timekeeper: a vertical stick or obelisk whose shadow's length and direction mark the passage of the day. Accuracy: hours.",
    significance: "high",
    cultural_context: ["Egyptian", "Babylonian"],
    birth_temporal: { year: 1500, era: "BCE", precision: "approximate" },
  },
  {
    key: "art-sundial",
    slug: `${SEED_PREFIX}-art-sundial`,
    name: "The Sundial",
    character_type: "artifact",
    biography:
      "A calibrated shadow clock with hour lines, later corrected for latitude and season. Accuracy: tens of minutes.",
    significance: "high",
    cultural_context: ["Egyptian", "Greek", "Roman"],
    birth_temporal: { year: 800, era: "BCE", precision: "approximate" },
  },
  {
    key: "art-water-clock",
    slug: `${SEED_PREFIX}-art-water-clock`,
    name: "The Water Clock (Clepsydra)",
    character_type: "artifact",
    biography:
      "A vessel measuring time by regulated flow of water — the first clock independent of the Sun, working at night and indoors. Accuracy: minutes.",
    significance: "high",
    cultural_context: ["Egyptian", "Greek", "Chinese"],
    birth_temporal: { year: 1400, era: "BCE", precision: "approximate" },
  },
  {
    key: "art-incense-clock",
    slug: `${SEED_PREFIX}-art-incense-clock`,
    name: "The Incense Clock",
    character_type: "artifact",
    biography:
      "An East Asian timekeeper burning marked incense trails at a steady rate, also marking time by scent. Accuracy: tens of minutes.",
    significance: "medium",
    cultural_context: ["Chinese"],
    birth_temporal: { year: 600, era: "CE", precision: "approximate" },
  },
  {
    key: "art-candle-clock",
    slug: `${SEED_PREFIX}-art-candle-clock`,
    name: "The Candle Clock",
    character_type: "artifact",
    biography:
      "A candle marked in equal intervals that burns down at a roughly constant rate, giving a portable night-time clock. Accuracy: tens of minutes.",
    significance: "low",
    cultural_context: ["Chinese", "Anglo-Saxon"],
    birth_temporal: { year: 880, era: "CE", precision: "approximate" },
  },
  {
    key: "art-hourglass",
    slug: `${SEED_PREFIX}-art-hourglass`,
    name: "The Hourglass",
    character_type: "artifact",
    biography:
      "Sand flowing between two glass bulbs measures a fixed interval — robust at sea, where water clocks and pendulums failed. Accuracy: fixed interval.",
    significance: "medium",
    cultural_context: ["medieval Europe", "maritime"],
    birth_temporal: { year: 1338, era: "CE", precision: "approximate" },
  },
  {
    key: "art-mechanical-clock",
    slug: `${SEED_PREFIX}-art-mechanical-clock`,
    name: "The Mechanical Escapement Clock",
    character_type: "artifact",
    biography:
      "A weight-driven clock regulated by a verge-and-foliot escapement, first appearing in European monasteries and towers. Accuracy: ~15 minutes/day.",
    significance: "high",
    cultural_context: ["medieval Europe"],
    birth_temporal: { year: 1300, era: "CE", precision: "approximate" },
  },
  {
    key: "art-pendulum-clock",
    slug: `${SEED_PREFIX}-art-pendulum-clock`,
    name: "The Pendulum Clock",
    character_type: "artifact",
    biography:
      "Christiaan Huygens's 1656 clock, regulated by a pendulum's near-isochronous swing — the first leap from minutes to seconds. Accuracy: ~15 seconds/day, later <1.",
    significance: "critical",
    cultural_context: ["Dutch", "scientific revolution"],
    birth_temporal: { year: 1656, era: "CE", precision: "exact" },
  },
  {
    key: "art-marine-chronometer",
    slug: `${SEED_PREFIX}-art-marine-chronometer`,
    name: "The Marine Chronometer (H4)",
    character_type: "artifact",
    biography:
      "John Harrison's H4, a spring-driven clock keeping accurate time at sea despite motion and temperature — solving the longitude problem. Accuracy: a few seconds/day.",
    significance: "critical",
    cultural_context: ["British", "maritime"],
    birth_temporal: { year: 1761, era: "CE", precision: "exact" },
  },
  {
    key: "art-quartz-clock",
    slug: `${SEED_PREFIX}-art-quartz-clock`,
    name: "The Quartz Clock",
    character_type: "artifact",
    biography:
      "Marrison and Horton's 1927 clock, timed by the piezoelectric vibration of a quartz crystal — no moving pendulum. Accuracy: milliseconds/day.",
    significance: "critical",
    cultural_context: ["American", "Bell Labs"],
    birth_temporal: { year: 1927, era: "CE", precision: "exact" },
  },
  {
    key: "art-atomic-clock",
    slug: `${SEED_PREFIX}-art-atomic-clock`,
    name: "The Caesium Atomic Clock",
    character_type: "artifact",
    biography:
      "Essen and Parry's 1955 clock at the NPL, timed by the hyperfine transition of caesium-133 — the basis of the SI second since 1967. Accuracy: nanoseconds/day.",
    significance: "critical",
    cultural_context: ["British", "metrology"],
    birth_temporal: { year: 1955, era: "CE", precision: "exact" },
  },
  {
    key: "art-optical-clock",
    slug: `${SEED_PREFIX}-art-optical-clock`,
    name: "The Optical Lattice Clock",
    character_type: "artifact",
    biography:
      "A clock reading an optical-frequency atomic transition in atoms trapped in a laser lattice — so stable it would lose less than a second over the age of the universe.",
    significance: "critical",
    cultural_context: ["Japanese", "American", "metrology"],
    birth_temporal: { year: 2001, era: "CE", precision: "exact" },
  },
  {
    key: "ctesibius",
    slug: `${SEED_PREFIX}-char-ctesibius`,
    name: "Ctesibius of Alexandria",
    character_type: "human",
    biography:
      "Greek inventor who greatly improved the water clock with a float regulator and a constant-pressure reservoir, the most accurate timekeeper until the pendulum.",
    significance: "high",
    cultural_context: ["Greek", "Hellenistic engineering"],
    birth_temporal: { year: 285, era: "BCE", precision: "circa" },
    death_temporal: { year: 222, era: "BCE", precision: "circa" },
  },
  {
    key: "su-song",
    slug: `${SEED_PREFIX}-char-su-song`,
    name: "Su Song",
    character_type: "human",
    biography:
      "Chinese polymath who built a monumental water-driven astronomical clock tower in 1088, incorporating an escapement centuries ahead of Europe.",
    significance: "high",
    cultural_context: ["Chinese", "Song dynasty"],
    birth_temporal: { year: 1020, era: "CE", precision: "exact" },
    death_temporal: { year: 1101, era: "CE", precision: "exact" },
  },
  {
    key: "galileo",
    slug: `${SEED_PREFIX}-char-galileo`,
    name: "Galileo Galilei",
    character_type: "human",
    biography:
      "Italian physicist who discovered the near-isochronism of the pendulum, the principle Huygens later turned into the pendulum clock.",
    significance: "critical",
    cultural_context: ["Italian", "scientific revolution"],
    birth_temporal: { year: 1564, era: "CE", precision: "exact" },
    death_temporal: { year: 1642, era: "CE", precision: "exact" },
  },
  {
    key: "huygens",
    slug: `${SEED_PREFIX}-char-huygens`,
    name: "Christiaan Huygens",
    character_type: "human",
    biography:
      "Dutch physicist and horologist who built the first pendulum clock in 1656, improving timekeeping accuracy by two orders of magnitude.",
    significance: "critical",
    cultural_context: ["Dutch", "scientific revolution"],
    birth_temporal: { year: 1629, era: "CE", precision: "exact" },
    death_temporal: { year: 1695, era: "CE", precision: "exact" },
  },
  {
    key: "harrison",
    slug: `${SEED_PREFIX}-char-harrison`,
    name: "John Harrison",
    character_type: "human",
    biography:
      "English carpenter and clockmaker who built the marine chronometer, solving the longitude problem after decades of work and rivalry with the astronomical establishment.",
    significance: "critical",
    cultural_context: ["British", "horology"],
    birth_temporal: { year: 1693, era: "CE", precision: "exact" },
    death_temporal: { year: 1776, era: "CE", precision: "exact" },
  },
  {
    key: "maskelyne",
    slug: `${SEED_PREFIX}-char-maskelyne`,
    name: "Nevil Maskelyne",
    character_type: "human",
    biography:
      "Astronomer Royal and Board of Longitude commissioner who championed the rival lunar-distance method and became John Harrison's chief antagonist.",
    significance: "medium",
    cultural_context: ["British", "astronomy"],
    birth_temporal: { year: 1732, era: "CE", precision: "exact" },
    death_temporal: { year: 1811, era: "CE", precision: "exact" },
  },
  {
    key: "marrison",
    slug: `${SEED_PREFIX}-char-marrison`,
    name: "Warren Marrison",
    character_type: "human",
    biography:
      "Canadian-American telecommunications engineer at Bell Labs who, with Horton, built the first quartz clock in 1927.",
    significance: "high",
    cultural_context: ["American", "Bell Labs"],
    birth_temporal: { year: 1896, era: "CE", precision: "exact" },
    death_temporal: { year: 1980, era: "CE", precision: "exact" },
  },
  {
    key: "horton",
    slug: `${SEED_PREFIX}-char-horton`,
    name: "Joseph Warren Horton",
    character_type: "human",
    biography:
      "American engineer who co-developed the quartz clock with Marrison at Bell Labs.",
    significance: "medium",
    cultural_context: ["American", "Bell Labs"],
    birth_temporal: { year: 1889, era: "CE", precision: "exact" },
    death_temporal: { year: 1967, era: "CE", precision: "exact" },
  },
  {
    key: "essen",
    slug: `${SEED_PREFIX}-char-essen`,
    name: "Louis Essen",
    character_type: "human",
    biography:
      "English physicist who, with Jack Parry at the NPL, built the first accurate caesium atomic clock in 1955.",
    significance: "critical",
    cultural_context: ["British", "metrology"],
    birth_temporal: { year: 1908, era: "CE", precision: "exact" },
    death_temporal: { year: 1997, era: "CE", precision: "exact" },
  },
  {
    key: "parry",
    slug: `${SEED_PREFIX}-char-parry`,
    name: "Jack Parry",
    character_type: "human",
    biography:
      "English physicist who co-built the first caesium atomic clock with Louis Essen at the National Physical Laboratory.",
    significance: "medium",
    cultural_context: ["British", "metrology"],
    birth_temporal: { year: 1925, era: "CE", precision: "exact" },
    death_temporal: { year: 1992, era: "CE", precision: "circa" },
  },
  {
    key: "katori",
    slug: `${SEED_PREFIX}-char-katori`,
    name: "Hidetoshi Katori",
    character_type: "human",
    biography:
      "Japanese physicist who invented the optical lattice clock, using a 'magic wavelength' trap to reach unprecedented stability.",
    significance: "high",
    cultural_context: ["Japanese", "metrology"],
    birth_temporal: { year: 1964, era: "CE", precision: "exact" },
  },
  {
    key: "mills",
    slug: `${SEED_PREFIX}-char-david-mills`,
    name: "David L. Mills",
    character_type: "human",
    biography:
      "American computer engineer who designed the Network Time Protocol (NTP), keeping the internet's clocks synchronized since 1985.",
    significance: "high",
    cultural_context: ["American", "computer networking"],
    birth_temporal: { year: 1938, era: "CE", precision: "exact" },
    death_temporal: { year: 2024, era: "CE", precision: "exact" },
  },
  {
    key: "fleming",
    slug: `${SEED_PREFIX}-char-sandford-fleming`,
    name: "Sandford Fleming",
    character_type: "human",
    biography:
      "Scottish-Canadian engineer who proposed worldwide standard time zones, a driving force behind the 1884 Prime Meridian Conference.",
    significance: "high",
    cultural_context: ["Canadian", "railways"],
    birth_temporal: { year: 1827, era: "CE", precision: "exact" },
    death_temporal: { year: 1915, era: "CE", precision: "exact" },
  },

  // Organizations.
  {
    key: "org-board-longitude",
    slug: `${SEED_PREFIX}-org-board-of-longitude`,
    name: "The Board of Longitude",
    character_type: "organization",
    domain: "navigation and the longitude prize",
    biography:
      "British government body established by the Longitude Act of 1714 to administer prizes for a practical method of determining longitude at sea.",
    significance: "high",
    cultural_context: ["British"],
    birth_temporal: { year: 1714, era: "CE", precision: "exact" },
    death_temporal: { year: 1828, era: "CE", precision: "exact" },
  },
  {
    key: "org-greenwich",
    slug: `${SEED_PREFIX}-org-royal-observatory-greenwich`,
    name: "The Royal Observatory, Greenwich",
    character_type: "organization",
    domain: "astronomy, navigation, and the prime meridian",
    biography:
      "Observatory founded in 1675 whose meridian became the world's Prime Meridian and whose mean time (GMT) became the basis of civil timekeeping.",
    significance: "critical",
    cultural_context: ["British"],
    birth_temporal: { year: 1675, era: "CE", precision: "exact" },
  },
  {
    key: "org-npl",
    slug: `${SEED_PREFIX}-org-npl`,
    name: "The National Physical Laboratory (NPL)",
    character_type: "organization",
    domain: "metrology and measurement standards",
    biography:
      "The United Kingdom's national metrology institute, where the first caesium atomic clock was built in 1955.",
    significance: "high",
    cultural_context: ["British"],
    birth_temporal: { year: 1900, era: "CE", precision: "exact" },
  },
  {
    key: "org-bipm",
    slug: `${SEED_PREFIX}-org-bipm`,
    name: "The International Bureau of Weights and Measures (BIPM)",
    character_type: "organization",
    domain: "international metrology and the SI",
    biography:
      "Intergovernmental body established by the 1875 Metre Convention that maintains the International System of Units, including the definition of the second and UTC.",
    significance: "critical",
    cultural_context: ["international"],
    birth_temporal: { year: 1875, era: "CE", precision: "exact" },
  },
  {
    key: "org-iers",
    slug: `${SEED_PREFIX}-org-iers`,
    name: "The International Earth Rotation and Reference Systems Service (IERS)",
    character_type: "organization",
    domain: "Earth rotation and leap seconds",
    biography:
      "The body that monitors Earth's rotation and decides when a leap second is inserted to keep UTC aligned with the wandering solar day.",
    significance: "high",
    cultural_context: ["international"],
    birth_temporal: { year: 1987, era: "CE", precision: "exact" },
  },
  {
    key: "org-cern",
    slug: `${SEED_PREFIX}-org-cern`,
    name: "CERN",
    character_type: "organization",
    domain: "particle physics and precision timing",
    biography:
      "The European particle-physics laboratory whose need to synchronize vast detectors produced the sub-nanosecond White Rabbit timing protocol.",
    significance: "medium",
    cultural_context: ["international", "physics"],
    birth_temporal: { year: 1954, era: "CE", precision: "exact" },
  },

  // Phase 11 — a fictional character (thematic cross-domain link).
  {
    key: "white-rabbit",
    slug: `${SEED_PREFIX}-char-white-rabbit`,
    name: "The White Rabbit",
    character_type: "fictional",
    biography:
      "The perpetually-late, pocket-watch-checking character from Lewis Carroll's Alice's Adventures in Wonderland (1865). CERN's White Rabbit sub-nanosecond timing protocol is named after him — obsession with punctuality made literal in hardware.",
    significance: "low",
    aliases: ["The Rabbit with the pocket watch"],
    cultural_context: ["English literature", "Victorian"],
  },
];

// ─── Backbone events (home = root timeline; each drills into a phase) ─────────

const BACKBONE_EVENTS: EventSeed[] = [
  {
    key: "bb01",
    slug: `${SEED_PREFIX}-bb-01-universe-creates-time`,
    title: "The Universe Creates Time",
    summary: "Spacetime — and with it time itself — begins.",
    detail:
      "Before there were clocks, there were the physical systems that would become clocks. This phase covers cosmology, not astronomy: expansion, stars, and orbits as the origin of every reference cycle.",
    event_type: "milestone",
    importance: 10,
    temporal_data: { year: 14, era: "BYA", precision: "approximate", display_format: "cosmological", cosmological_epoch: "Planck epoch" },
    timelineKey: ROOT_KEY,
    detailTimelineKey: "p01",
    narrativeOrder: 1,
  },
  {
    key: "bb02",
    slug: `${SEED_PREFIX}-bb-02-earth-creates-cycles`,
    title: "Earth Creates Cycles",
    summary: "Rotation, orbit, and the Moon establish the day, the year, and the month.",
    detail:
      "The natural clocks appear: recurring phenomena that existed billions of years before any observer, and that every later calendar tries to track.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 4540, era: "MYA", precision: "geological", display_format: "geological" },
    timelineKey: ROOT_KEY,
    detailTimelineKey: "p02",
    narrativeOrder: 2,
  },
  {
    key: "bb03",
    slug: `${SEED_PREFIX}-bb-03-life-adapts-to-time`,
    title: "Life Adapts to Time",
    summary: "Organisms evolve internal clocks, anticipating day and season.",
    detail:
      "Life learned to keep time long before humans did — a reminder that humans invented not time, but ways to describe recurring phenomena.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 3500, era: "MYA", precision: "geological", display_format: "geological" },
    timelineKey: ROOT_KEY,
    detailTimelineKey: "p03",
    narrativeOrder: 3,
  },
  {
    key: "bb04",
    slug: `${SEED_PREFIX}-bb-04-humans-observe-time`,
    title: "Humans Observe Time",
    summary: "The first human timekeeping is observation: shadows, moons, and seasonal stars.",
    detail:
      "Humans begin by noticing patterns — not building instruments. Every observation is the seed of a future prediction.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 40, era: "KYA", precision: "approximate", display_format: "scientific" },
    timelineKey: ROOT_KEY,
    detailTimelineKey: "p04",
    narrativeOrder: 4,
  },
  {
    key: "bb05",
    slug: `${SEED_PREFIX}-bb-05-humans-predict-time`,
    title: "Humans Predict Time",
    summary: "Prediction turns observation into science: eclipses and cycles foretold.",
    detail:
      "The first scientific revolution. Once the sky could be predicted, it could be explained — and calculated in advance.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 700, era: "BCE", precision: "approximate" },
    timelineKey: ROOT_KEY,
    detailTimelineKey: "p05",
    narrativeOrder: 5,
  },
  {
    key: "bb06",
    slug: `${SEED_PREFIX}-bb-06-humans-record-time`,
    title: "Humans Record Time",
    summary: "Calendars emerge — in parallel, across civilizations.",
    detail:
      "Recording time in durable systems. This phase is a showcase of concurrent development: many calendars, invented independently, coexisting.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 3000, era: "BCE", precision: "approximate" },
    timelineKey: ROOT_KEY,
    detailTimelineKey: "p06",
    narrativeOrder: 6,
  },
  {
    key: "bb07",
    slug: `${SEED_PREFIX}-bb-07-humans-measure-time`,
    title: "Humans Measure Time",
    summary: "The instrument chain — every device a leap in achievable precision.",
    detail:
      "From shadow stick to atomic clock. Each instrument in this phase is an artifact character in a queryable chain of supersession and improvement.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 1500, era: "BCE", precision: "approximate" },
    timelineKey: ROOT_KEY,
    detailTimelineKey: "p07",
    narrativeOrder: 7,
  },
  {
    key: "bb08",
    slug: `${SEED_PREFIX}-bb-08-humans-standardize-time`,
    title: "Humans Standardize Time",
    summary: "Institutions define shared time: zones, a prime meridian, the SI second.",
    detail:
      "Standardization: organizations and international cooperation replace local solar time with a global framework. Note its narrative position (8) — it overlaps in date with synchronization (9).",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 1884, era: "CE", precision: "exact" },
    timelineKey: ROOT_KEY,
    detailTimelineKey: "p08",
    narrativeOrder: 8,
  },
  {
    key: "bb09",
    slug: `${SEED_PREFIX}-bb-09-humans-synchronize-time`,
    title: "Humans Synchronize Time",
    summary: "Distant clocks are brought into agreement — by wire, radio, satellite, and network.",
    detail:
      "Synchronization is a distinctly modern, engineering story. Its earliest date (telegraph time, ~1852) actually precedes standardization — the model represents this overlap faithfully via narrative order.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 1852, era: "CE", precision: "exact" },
    timelineKey: ROOT_KEY,
    detailTimelineKey: "p09",
    narrativeOrder: 9,
  },
  {
    key: "bb10",
    slug: `${SEED_PREFIX}-bb-10-humans-master-precision`,
    title: "Humans Master Precision",
    summary: "Accuracy itself becomes the story — from seconds to parts in ten quintillion.",
    detail:
      "A narrative of relentlessly improving precision, tracking the best achievable uncertainty of each era rather than the devices themselves.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 1955, era: "CE", precision: "exact" },
    timelineKey: ROOT_KEY,
    detailTimelineKey: "p10",
    narrativeOrder: 10,
  },
  {
    key: "bb11",
    slug: `${SEED_PREFIX}-bb-11-humans-network-time`,
    title: "Humans Network Time",
    summary: "Time becomes shared infrastructure — a global fabric of synchronized clocks.",
    detail:
      "Networked time underpins finance, telecoms, and science, demanding synchronization far below human perception.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 1985, era: "CE", precision: "exact" },
    timelineKey: ROOT_KEY,
    detailTimelineKey: "p11",
    narrativeOrder: 11,
  },
  {
    key: "bb12",
    slug: `${SEED_PREFIX}-bb-12-future-time`,
    title: "Future Time",
    summary: "The frontier: redefining the second, relativistic geodesy, interplanetary time.",
    detail:
      "Speculative, estimated, low-confidence by design — a demonstration of modeling the uncertain future as first-class data.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 2050, era: "CE", precision: "estimated", confidence_level: "low" },
    timelineKey: ROOT_KEY,
    detailTimelineKey: "p12",
    narrativeOrder: 12,
  },
];

// ─── Phase events (home = the relevant phase or drill-down timeline) ──────────

const PHASE_EVENTS: EventSeed[] = [
  // ---- Phase 1: The Universe Creates Time (DEEP) ----
  {
    key: "p1-big-bang",
    slug: `${SEED_PREFIX}-p1-big-bang`,
    title: "The Big Bang",
    summary: "Spacetime, energy, and time itself begin ~13.8 billion years ago.",
    detail:
      "The observable universe expands from an extremely hot, dense state. Time as a physical dimension has no meaningful 'before'. This event drills into 'The First Three Minutes'.",
    event_type: "milestone",
    importance: 10,
    temporal_data: { year: 14, era: "BYA", precision: "approximate", uncertainty: 100000000, display_format: "cosmological", cosmological_epoch: "Planck epoch", dating_method: "cosmic microwave background", confidence_level: "high" },
    timelineKey: "p01",
    detailTimelineKey: "p01-ftm",
  },
  {
    key: "p1-inflation",
    slug: `${SEED_PREFIX}-p1-inflation`,
    title: "Cosmic Inflation",
    summary: "A fraction of a second of exponential expansion smooths and flattens the cosmos.",
    detail:
      "In ~10⁻³² seconds the universe expands by a factor of ~10²⁶, seeding the density variations that later become galaxies.",
    event_type: "transformation",
    importance: 8,
    temporal_data: { year: 14, era: "BYA", precision: "approximate", display_format: "cosmological", cosmological_epoch: "Inflationary epoch" },
    timelineKey: "p01",
  },
  {
    key: "p1-cmb",
    slug: `${SEED_PREFIX}-p1-recombination`,
    title: "Recombination — the First Light",
    summary: "The universe cools enough for atoms to form and light to travel freely.",
    detail:
      "About 380,000 years after the Big Bang, electrons and nuclei combine; the universe becomes transparent, releasing the cosmic microwave background we still detect.",
    event_type: "transformation",
    importance: 8,
    temporal_data: { year: 14, era: "BYA", precision: "approximate", display_format: "cosmological", cosmological_epoch: "Recombination" },
    timelineKey: "p01",
  },
  {
    key: "p1-first-stars",
    slug: `${SEED_PREFIX}-p1-first-stars`,
    title: "The First Stars Ignite",
    summary: "Gravity gathers primordial gas into the first stars — the first steady cosmic clocks.",
    detail:
      "Roughly 200 million years after the Big Bang, the first stars begin fusing hydrogen, forging heavier elements and giving the cosmos its first periodic, long-lived light sources.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 13, era: "BYA", precision: "approximate", display_format: "cosmological", cosmological_epoch: "Cosmic Dawn" },
    timelineKey: "p01",
  },
  {
    key: "p1-milky-way",
    slug: `${SEED_PREFIX}-p1-milky-way`,
    title: "The Milky Way Forms",
    summary: "Our galaxy assembles from merging protogalactic fragments.",
    detail:
      "The disk of the Milky Way takes shape, the eventual home of the Sun and its clockwork of planets.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 13, era: "BYA", precision: "approximate", display_format: "cosmological" },
    timelineKey: "p01",
  },
  {
    key: "p1-solar-system",
    slug: `${SEED_PREFIX}-p1-solar-system`,
    title: "The Solar System Forms",
    summary: "The Sun and planets condense from a collapsing molecular cloud.",
    detail:
      "A rotating protoplanetary disk yields the Sun and planets ~4.6 billion years ago, setting the orbital periods that define our year and the planets' motions.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 4600, era: "MYA", precision: "geological", display_format: "geological", dating_method: "radiometric", geological_period: "pre-Hadean" },
    timelineKey: "p01",
  },
  {
    key: "p1-earth-forms",
    slug: `${SEED_PREFIX}-p1-earth-forms`,
    title: "The Earth Forms",
    summary: "Accretion builds the Earth, whose spin and orbit become the day and the year.",
    detail:
      "The proto-Earth accretes ~4.54 billion years ago; its rotation and its orbit around the Sun will become humanity's fundamental reference cycles.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 4540, era: "MYA", precision: "geological", display_format: "geological", dating_method: "radiometric", geological_period: "Hadean" },
    timelineKey: "p01",
  },
  {
    key: "p1-moon-forms",
    slug: `${SEED_PREFIX}-p1-moon-forms`,
    title: "The Moon Forms",
    summary: "A giant impact creates the Moon, source of the month and the tides.",
    detail:
      "A Mars-sized body strikes the young Earth; the debris coalesces into the Moon. This event drills into 'The Giant Impact'.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 4510, era: "MYA", precision: "geological", display_format: "geological", geological_period: "Hadean" },
    timelineKey: "p01",
    detailTimelineKey: "p01-impact",
  },
  // ---- Phase 1.1: The First Three Minutes (DEEPER) ----
  {
    key: "ftm-planck",
    slug: `${SEED_PREFIX}-ftm-planck-epoch`,
    title: "The Planck Epoch",
    summary: "The first 10⁻⁴³ seconds, where known physics breaks down.",
    detail:
      "Before ~10⁻⁴³ s, gravity and the quantum forces are unified and no current theory describes the state of the universe.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 14, era: "BYA", precision: "approximate", display_format: "cosmological", cosmological_epoch: "Planck epoch" },
    timelineKey: "p01-ftm",
  },
  {
    key: "ftm-quark",
    slug: `${SEED_PREFIX}-ftm-quark-epoch`,
    title: "The Quark Epoch",
    summary: "Fundamental forces separate; the universe is a quark–gluon plasma.",
    detail:
      "Between ~10⁻¹² and 10⁻⁶ s, the fundamental forces have split and quarks roam freely in a hot plasma.",
    event_type: "transformation",
    importance: 6,
    temporal_data: { year: 14, era: "BYA", precision: "approximate", display_format: "cosmological", cosmological_epoch: "Quark epoch" },
    timelineKey: "p01-ftm",
  },
  {
    key: "ftm-hadron",
    slug: `${SEED_PREFIX}-ftm-hadron-epoch`,
    title: "The Hadron Epoch",
    summary: "Quarks bind into protons and neutrons.",
    detail:
      "As the universe cools past ~10⁻⁶ s, quarks are confined into hadrons — the protons and neutrons of ordinary matter.",
    event_type: "transformation",
    importance: 6,
    temporal_data: { year: 14, era: "BYA", precision: "approximate", display_format: "cosmological", cosmological_epoch: "Hadron epoch" },
    timelineKey: "p01-ftm",
  },
  {
    key: "ftm-nucleosynthesis",
    slug: `${SEED_PREFIX}-ftm-nucleosynthesis`,
    title: "Primordial Nucleosynthesis",
    summary: "In the first ~3 minutes, the lightest nuclei form.",
    detail:
      "Between roughly 10 seconds and 20 minutes, protons and neutrons fuse into hydrogen, helium, and traces of lithium — fixing the universe's primordial chemistry.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 14, era: "BYA", precision: "approximate", display_format: "cosmological", cosmological_epoch: "Big Bang nucleosynthesis" },
    timelineKey: "p01-ftm",
  },
  // ---- Phase 1.2: The Giant Impact (DEEPER) ----
  {
    key: "gi-theia",
    slug: `${SEED_PREFIX}-gi-theia`,
    title: "Theia Forms",
    summary: "A Mars-sized protoplanet grows in the young Solar System.",
    detail:
      "Theia coalesces, possibly near a stable point of Earth's orbit, on a collision course with the proto-Earth.",
    event_type: "milestone",
    importance: 6,
    temporal_data: { year: 4520, era: "MYA", precision: "geological", display_format: "geological" },
    timelineKey: "p01-impact",
  },
  {
    key: "gi-collision",
    slug: `${SEED_PREFIX}-gi-collision`,
    title: "Theia Strikes the Proto-Earth",
    summary: "The giant impact melts the Earth and blasts debris into orbit.",
    detail:
      "The oblique collision ejects a disk of vaporized rock, sets the Earth's rapid early spin, and may account for its axial tilt — the origin of seasons.",
    event_type: "transformation",
    importance: 8,
    temporal_data: { year: 4510, era: "MYA", precision: "geological", display_format: "geological" },
    timelineKey: "p01-impact",
  },
  {
    key: "gi-disk",
    slug: `${SEED_PREFIX}-gi-debris-disk`,
    title: "The Debris Disk",
    summary: "A ring of molten debris encircles the Earth.",
    detail:
      "The ejected material settles into a hot circumterrestrial disk within hours of the impact.",
    event_type: "milestone",
    importance: 5,
    temporal_data: { year: 4510, era: "MYA", precision: "geological", display_format: "geological" },
    timelineKey: "p01-impact",
  },
  {
    key: "gi-moon",
    slug: `${SEED_PREFIX}-gi-moon-coalesces`,
    title: "The Moon Coalesces",
    summary: "The debris disk accretes into the Moon within decades.",
    detail:
      "The Moon forms close to the Earth and has been receding ever since — its orbit sets the month, and the tides it raises gradually lengthen the day.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 4500, era: "MYA", precision: "geological", display_format: "geological" },
    timelineKey: "p01-impact",
  },

  // ---- Phase 2: Earth Creates Cycles (stub) ----
  {
    key: "p2-rotation",
    slug: `${SEED_PREFIX}-p2-rotation`,
    title: "Earth's Rotation Sets the Day",
    summary: "The planet's spin defines the fundamental cycle of light and dark.",
    detail:
      "Earth's rotation — gradually slowing as the Moon recedes — is the reference cycle behind the day, the hour, and ultimately the second.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 4500, era: "MYA", precision: "geological", display_format: "geological" },
    timelineKey: "p02",
  },
  {
    key: "p2-lunar-month",
    slug: `${SEED_PREFIX}-p2-lunar-month`,
    title: "The Moon's Orbit Sets the Month",
    summary: "The lunar cycle of phases becomes the first long, visible calendar.",
    detail:
      "The ~29.5-day cycle of lunar phases is the most conspicuous natural cycle after the day — the basis of the earliest calendars.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 4500, era: "MYA", precision: "geological", display_format: "geological" },
    timelineKey: "p02",
  },
  {
    key: "p2-year-seasons",
    slug: `${SEED_PREFIX}-p2-year-seasons`,
    title: "Earth's Orbit and Tilt Set the Year and Seasons",
    summary: "The orbital period and axial tilt create the solar year and its seasons.",
    detail:
      "Earth's ~365.24-day orbit, combined with its ~23.4° axial tilt, produces the seasons — the cycle agriculture and religion would anchor to.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 4500, era: "MYA", precision: "geological", display_format: "geological" },
    timelineKey: "p02",
  },
  {
    key: "p2-precession",
    slug: `${SEED_PREFIX}-p2-precession`,
    title: "Axial Precession — the Great Year",
    summary: "Earth's axis wobbles over ~26,000 years, slowly shifting the pole stars.",
    detail:
      "Precession slowly rotates the direction of Earth's axis, moving the celestial pole and the equinoxes — a subtle cycle Hipparchus would later detect.",
    event_type: "milestone",
    importance: 6,
    temporal_data: { year: 26, era: "KYA", precision: "approximate", display_format: "scientific" },
    timelineKey: "p02",
  },

  // ---- Phase 3: Life Adapts to Time (stub; carries the animal character) ----
  {
    key: "p3-circadian",
    slug: `${SEED_PREFIX}-p3-circadian`,
    title: "Circadian Rhythms Evolve",
    summary: "Early life evolves internal ~24-hour clocks.",
    detail:
      "Molecular clocks arise so organisms can anticipate the daily cycle of light and dark — timekeeping billions of years before any human calendar.",
    event_type: "transformation",
    importance: 7,
    temporal_data: { year: 3500, era: "MYA", precision: "geological", display_format: "geological" },
    timelineKey: "p03",
  },
  {
    key: "p3-cyanobacteria",
    slug: `${SEED_PREFIX}-p3-cyanobacterial-clock`,
    title: "The Cyanobacterial Clock",
    summary: "Photosynthetic microbes gate their chemistry to the day.",
    detail:
      "Cyanobacteria evolve a robust circadian oscillator (the KaiABC system) to schedule photosynthesis and nitrogen fixation to opposite phases of the day.",
    event_type: "transformation",
    importance: 6,
    temporal_data: { year: 2500, era: "MYA", precision: "geological", display_format: "geological" },
    timelineKey: "p03",
  },
  {
    key: "p3-migration",
    slug: `${SEED_PREFIX}-p3-seasonal-migration`,
    title: "Seasonal Migration",
    summary: "Animals evolve circannual clocks to migrate with the seasons.",
    detail:
      "Long-distance migrants read day length and celestial cues to time journeys spanning hemispheres — the Arctic Tern being the archetype.",
    event_type: "transformation",
    importance: 6,
    temporal_data: { year: 100, era: "MYA", precision: "geological", display_format: "geological" },
    timelineKey: "p03",
    participants: [
      {
        characterKey: "arctic-tern",
        role: "protagonist",
        significance: "primary",
        description:
          "Archetypal circannual navigator, timing the longest migration on Earth by day length and the Sun.",
      },
    ],
  },
  {
    key: "p3-human-clock",
    slug: `${SEED_PREFIX}-p3-human-circadian-clock`,
    title: "The Human Circadian Clock",
    summary: "Homo sapiens inherits an internal clock set by light.",
    detail:
      "The suprachiasmatic clock keeps humans on a ~24-hour rhythm entrained by daylight — the biological substrate on which cultural timekeeping is built.",
    event_type: "milestone",
    importance: 6,
    temporal_data: { year: 300, era: "KYA", precision: "approximate", display_format: "scientific" },
    timelineKey: "p03",
  },

  // ---- Phase 4: Humans Observe Time (stub) ----
  {
    key: "p4-lunar-tally",
    slug: `${SEED_PREFIX}-p4-lunar-tally`,
    title: "The Moon's Phases Are Tallied",
    summary: "Paleolithic peoples record lunar cycles on bone and stone.",
    detail:
      "Tally marks such as those on the Ishango bone suggest deliberate counting of lunar phases — humanity's earliest surviving timekeeping records.",
    event_type: "discovery",
    importance: 7,
    temporal_data: { year: 20, era: "KYA", precision: "approximate", display_format: "scientific" },
    timelineKey: "p04",
  },
  {
    key: "p4-nile-flood",
    slug: `${SEED_PREFIX}-p4-nile-flood`,
    title: "The Nile Flood Repeats",
    summary: "Egyptians notice the annual inundation returns with the seasons.",
    detail:
      "The yearly flooding of the Nile, tied to the seasons, gives Egypt a natural year and a powerful motive to predict it.",
    event_type: "discovery",
    importance: 7,
    temporal_data: { year: 4000, era: "BCE", precision: "approximate" },
    location: "Nile Valley, Egypt",
    timelineKey: "p04",
    participants: [
      {
        characterKey: "ra",
        role: "witness",
        significance: "mentioned",
        description:
          "Interpreted within the solar theology of Ra, whose calendar the flood helped anchor.",
      },
    ],
  },
  {
    key: "p4-sirius",
    slug: `${SEED_PREFIX}-p4-heliacal-sirius`,
    title: "The Heliacal Rising of Sirius",
    summary: "Egyptians observe that Sirius reappears at dawn just before the flood.",
    detail:
      "The heliacal rising of Sirius (Sothis) reliably preceded the inundation, giving Egyptian astronomers a stellar predictor of the year — and a reason to refine the calendar.",
    event_type: "discovery",
    importance: 7,
    temporal_data: { year: 3000, era: "BCE", precision: "approximate" },
    location: "Egypt",
    timelineKey: "p04",
  },
  {
    key: "p4-shadow",
    slug: `${SEED_PREFIX}-p4-shadow-changes`,
    title: "Shadow Length Changes with the Sun",
    summary: "Observers note that a shadow's length tracks the hour and the season.",
    detail:
      "The systematic variation of shadow length and direction with time of day and year is the observation from which the gnomon and sundial follow.",
    event_type: "discovery",
    importance: 6,
    temporal_data: { year: 3000, era: "BCE", precision: "approximate" },
    timelineKey: "p04",
  },

  // ---- Phase 5: Humans Predict Time (stub) ----
  {
    key: "p5-saros",
    slug: `${SEED_PREFIX}-p5-saros-cycle`,
    title: "The Saros Eclipse Cycle",
    summary: "Babylonian astronomers find eclipses recur every ~18 years.",
    detail:
      "By recording eclipses over generations, Babylonian (Chaldean) astronomers recognized the ~18-year 11-day Saros period, enabling eclipse prediction.",
    event_type: "discovery",
    importance: 8,
    temporal_data: { year: 700, era: "BCE", precision: "approximate" },
    location: "Babylon",
    timelineKey: "p05",
  },
  {
    key: "p5-thales-eclipse",
    slug: `${SEED_PREFIX}-p5-thales-eclipse`,
    title: "Thales Predicts a Solar Eclipse",
    summary: "The eclipse of 585 BCE, said to be foretold by Thales, halts a battle.",
    detail:
      "Herodotus reports that Thales predicted the year of a solar eclipse that interrupted a battle between the Medes and Lydians — an emblem of natural law over omen.",
    event_type: "discovery",
    importance: 8,
    temporal_data: { year: 585, era: "BCE", precision: "exact" },
    location: "Asia Minor",
    timelineKey: "p05",
    participants: [
      {
        characterKey: "thales",
        role: "protagonist",
        significance: "primary",
        description: "Predicted the eclipse, asserting it followed calculable natural law.",
      },
    ],
  },
  {
    key: "p5-metonic",
    slug: `${SEED_PREFIX}-p5-metonic-cycle`,
    title: "The Metonic Cycle",
    summary: "Meton finds 19 years almost exactly equal 235 lunar months.",
    detail:
      "The Metonic cycle, named after Meton of Athens, reconciles the lunar month with the solar year and underlies lunisolar calendars to this day.",
    event_type: "discovery",
    importance: 7,
    temporal_data: { year: 432, era: "BCE", precision: "exact" },
    location: "Athens",
    timelineKey: "p05",
    participants: [
      {
        characterKey: "meton",
        role: "protagonist",
        significance: "primary",
        description: "Calculated the 19-year cycle that bears his name.",
      },
    ],
  },
  {
    key: "p5-precession",
    slug: `${SEED_PREFIX}-p5-hipparchus-precession`,
    title: "Hipparchus Discovers Precession",
    summary: "Comparing star positions across centuries reveals the slow shift of the equinoxes.",
    detail:
      "Hipparchus compared his star catalogue with older Babylonian records and measured the precession of the equinoxes, also refining the length of the year.",
    event_type: "discovery",
    importance: 8,
    temporal_data: { year: 130, era: "BCE", precision: "circa" },
    location: "Rhodes",
    timelineKey: "p05",
    participants: [
      {
        characterKey: "hipparchus",
        role: "protagonist",
        significance: "primary",
        description: "Measured precession and the year length by comparing observations across time.",
      },
    ],
  },
  {
    key: "p5-almagest",
    slug: `${SEED_PREFIX}-p5-ptolemy-almagest`,
    title: "Ptolemy's Almagest",
    summary: "A geocentric model predicts planetary motion for fourteen centuries.",
    detail:
      "Ptolemy's Almagest synthesized Greek astronomy into a predictive geocentric system, building directly on Hipparchus's catalogue and methods.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 150, era: "CE", precision: "circa" },
    location: "Alexandria",
    timelineKey: "p05",
    participants: [
      {
        characterKey: "ptolemy",
        role: "protagonist",
        significance: "primary",
        description: "Compiled the Almagest, the authoritative predictive astronomy of antiquity.",
      },
    ],
  },

  // ---- Phase 6: Humans Record Time (DEEP; concurrent calendars + deities) ----
  {
    key: "p6-egyptian",
    slug: `${SEED_PREFIX}-p6-egyptian-calendar`,
    title: "The Egyptian Civil Calendar",
    summary: "A 365-day solar calendar of 12 months plus 5 epagomenal days.",
    detail:
      "Egypt's civil calendar of 365 days — twelve 30-day months and five added days — was among the first solar calendars, tied to Sirius and to the theology of Ra and Thoth.",
    event_type: "creation",
    importance: 8,
    temporal_data: { year: 2800, era: "BCE", precision: "approximate" },
    location: "Egypt",
    timelineKey: "p06",
    participants: [
      { characterKey: "ra", role: "witness", significance: "mentioned", description: "Solar deity whose year the calendar tracked." },
      { characterKey: "thoth", role: "witness", significance: "mentioned", description: "Credited in myth with dividing the year and adding the epagomenal days." },
    ],
  },
  {
    key: "p6-babylonian",
    slug: `${SEED_PREFIX}-p6-babylonian-calendar`,
    title: "The Babylonian Lunisolar Calendar",
    summary: "A lunar calendar kept in step with the seasons by intercalary months.",
    detail:
      "Babylon's lunisolar calendar added leap months (later on the Metonic pattern) to reconcile lunar months with the solar year — a sophisticated concurrent tradition.",
    event_type: "creation",
    importance: 7,
    temporal_data: { year: 2000, era: "BCE", precision: "approximate" },
    location: "Babylon",
    timelineKey: "p06",
  },
  {
    key: "p6-chinese",
    slug: `${SEED_PREFIX}-p6-chinese-calendar`,
    title: "The Chinese Sexagenary Calendar",
    summary: "A 60-year cycle of stems and branches with lunisolar months.",
    detail:
      "China's calendar combined a 60-term sexagenary cycle with lunisolar months and solar terms, refined continuously by imperial astronomers.",
    event_type: "creation",
    importance: 7,
    temporal_data: { year: 1600, era: "BCE", precision: "approximate" },
    location: "China",
    timelineKey: "p06",
  },
  {
    key: "p6-maya",
    slug: `${SEED_PREFIX}-p6-maya-long-count`,
    title: "The Maya Long Count",
    summary: "A vigesimal count of days spanning thousands of years, plus interlocking cycles.",
    detail:
      "The Maya tracked time with the 260-day Tzolk'in, the 365-day Haab', and the Long Count — an absolute day count of remarkable range, developed entirely independently.",
    event_type: "creation",
    importance: 8,
    temporal_data: { year: 700, era: "BCE", precision: "approximate" },
    location: "Mesoamerica",
    timelineKey: "p06",
  },
  {
    key: "p6-week",
    slug: `${SEED_PREFIX}-p6-seven-day-week`,
    title: "The Seven-Day Week",
    summary: "A seven-day cycle, tied to the classical planets, spreads across cultures.",
    detail:
      "The seven-day week — associated with the seven classical 'wandering stars' — emerged in the ancient Near East and became a near-universal social cycle independent of the Moon.",
    event_type: "creation",
    importance: 7,
    temporal_data: { year: 600, era: "BCE", precision: "approximate" },
    location: "Near East",
    timelineKey: "p06",
  },
  {
    key: "p6-roman",
    slug: `${SEED_PREFIX}-p6-roman-calendar`,
    title: "The Roman Calendar",
    summary: "A drifting lunar calendar requiring constant, political intercalation.",
    detail:
      "The early Roman calendar, with its month named for Janus, drifted badly against the seasons because intercalation was managed — and abused — by priests.",
    event_type: "creation",
    importance: 6,
    temporal_data: { year: 700, era: "BCE", precision: "approximate" },
    location: "Rome",
    timelineKey: "p06",
    participants: [
      { characterKey: "janus", role: "witness", significance: "mentioned", description: "God of beginnings, after whom January and the year's threshold are named." },
    ],
  },
  {
    key: "p6-julian",
    slug: `${SEED_PREFIX}-p6-julian-calendar`,
    title: "The Julian Calendar Reform",
    summary: "Caesar adopts Sosigenes's 365¼-day solar calendar with a leap day.",
    detail:
      "In 46 BCE the Julian reform replaced the chaotic Roman calendar with a solar one of 365¼ days, introducing the quadrennial leap day.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 46, era: "BCE", precision: "exact" },
    location: "Rome",
    timelineKey: "p06",
    extraMetadata: { supersedes_slug: `${SEED_PREFIX}-p6-roman-calendar` },
    participants: [
      { characterKey: "caesar", role: "protagonist", significance: "primary", description: "Adopted the reform as dictator." },
      { characterKey: "sosigenes", role: "creator", significance: "primary", description: "Designed the calendar and calculated the 365¼-day year." },
    ],
  },
  {
    key: "p6-indian",
    slug: `${SEED_PREFIX}-p6-surya-siddhanta`,
    title: "The Sūrya Siddhānta Calendar",
    summary: "Indian astronomy codifies a precise lunisolar calendar.",
    detail:
      "The Sūrya Siddhānta tradition gave India a mathematically sophisticated lunisolar calendar with accurate solar and lunar parameters.",
    event_type: "creation",
    importance: 6,
    temporal_data: { year: 400, era: "CE", precision: "approximate" },
    location: "India",
    timelineKey: "p06",
  },
  {
    key: "p6-islamic",
    slug: `${SEED_PREFIX}-p6-islamic-calendar`,
    title: "The Islamic Hijri Calendar",
    summary: "A purely lunar calendar of 12 months, dated from the Hijra of 622 CE.",
    detail:
      "The Hijri calendar is strictly lunar — its year is ~11 days shorter than the solar year, so its months migrate through the seasons, a deliberate contrast to solar calendars.",
    event_type: "creation",
    importance: 7,
    temporal_data: { year: 622, era: "CE", precision: "exact" },
    location: "Arabia",
    timelineKey: "p06",
  },
  {
    key: "p6-gregorian",
    slug: `${SEED_PREFIX}-p6-gregorian-calendar`,
    title: "The Gregorian Calendar Reform",
    summary: "Gregory XIII corrects the Julian drift with a refined leap-year rule.",
    detail:
      "The 1582 reform, devised by Lilius and Clavius, dropped ten days and adjusted the leap-year rule (skipping most century years), producing the calendar now used worldwide.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 1582, era: "CE", precision: "exact" },
    location: "Rome",
    timelineKey: "p06",
    extraMetadata: { supersedes_slug: `${SEED_PREFIX}-p6-julian-calendar` },
    participants: [
      { characterKey: "gregory13", role: "protagonist", significance: "primary", description: "Promulgated the reform by papal bull." },
      { characterKey: "clavius", role: "creator", significance: "primary", description: "Led the technical commission and defended the reform." },
      { characterKey: "lilius", role: "creator", significance: "secondary", description: "Devised the core leap-year and epact algorithm." },
    ],
  },

  // ---- Phase 7: Humans Measure Time (DEEP; the instrument chain) ----
  {
    key: "p7-gnomon",
    slug: `${SEED_PREFIX}-p7-shadow-clock`,
    title: "Invention of the Shadow Clock",
    summary: "A gnomon's shadow becomes the first deliberate clock. Accuracy: hours.",
    detail: "The shadow clock turns the daily march of a shadow into a readable measure of time.",
    event_type: "creation",
    importance: 6,
    temporal_data: { year: 1500, era: "BCE", precision: "approximate" },
    timelineKey: "p07",
  },
  {
    key: "p7-sundial",
    slug: `${SEED_PREFIX}-p7-sundial`,
    title: "The Sundial Refines the Hour",
    summary: "Calibrated hour lines make the shadow clock quantitative. Accuracy: tens of minutes.",
    detail: "Hour lines, and later latitude correction, turn the shadow clock into a true dial.",
    event_type: "creation",
    importance: 6,
    temporal_data: { year: 800, era: "BCE", precision: "approximate" },
    timelineKey: "p07",
  },
  {
    key: "p7-water-clock",
    slug: `${SEED_PREFIX}-p7-water-clock`,
    title: "The Water Clock Frees Time from the Sun",
    summary: "Regulated water flow measures time at night and indoors. Accuracy: minutes.",
    detail:
      "The clepsydra is the first clock independent of the Sun; Ctesibius's float-regulated version was the most accurate clock for nearly two millennia.",
    event_type: "creation",
    importance: 7,
    temporal_data: { year: 1400, era: "BCE", precision: "approximate" },
    timelineKey: "p07",
    participants: [
      { characterKey: "ctesibius", role: "creator", significance: "secondary", description: "Later greatly improved the water clock with a float regulator." },
    ],
  },
  {
    key: "p7-incense",
    slug: `${SEED_PREFIX}-p7-incense-clock`,
    title: "The Incense Clock",
    summary: "Burning marked incense measures intervals — and scents them. Accuracy: tens of minutes.",
    detail: "An East Asian timekeeper that measures time by the steady burn of marked incense trails.",
    event_type: "creation",
    importance: 5,
    temporal_data: { year: 600, era: "CE", precision: "approximate" },
    timelineKey: "p07",
  },
  {
    key: "p7-su-song",
    slug: `${SEED_PREFIX}-p7-su-song-clock-tower`,
    title: "Su Song's Astronomical Clock Tower",
    summary: "A water-driven tower with an escapement, centuries ahead of Europe.",
    detail:
      "Su Song's 1088 clock tower used a water-powered escapement to drive an armillary sphere and time-announcing figures — a high point of pre-modern horology.",
    event_type: "creation",
    importance: 7,
    temporal_data: { year: 1088, era: "CE", precision: "exact" },
    location: "Kaifeng, China",
    timelineKey: "p07",
    participants: [
      { characterKey: "su-song", role: "creator", significance: "primary", description: "Designed and built the water-driven astronomical clock tower." },
    ],
  },
  {
    key: "p7-hourglass",
    slug: `${SEED_PREFIX}-p7-hourglass`,
    title: "The Hourglass",
    summary: "Sand measures a fixed interval, reliably even at sea.",
    detail: "The hourglass gave sailors a rugged interval timer immune to a ship's motion.",
    event_type: "creation",
    importance: 5,
    temporal_data: { year: 1338, era: "CE", precision: "approximate" },
    timelineKey: "p07",
  },
  {
    key: "p7-mechanical",
    slug: `${SEED_PREFIX}-p7-mechanical-clock`,
    title: "The Mechanical Escapement Clock",
    summary: "A verge-and-foliot escapement drives Europe's tower clocks. Accuracy: ~15 min/day.",
    detail:
      "The weight-driven mechanical clock, regulated by an escapement, spread through medieval European monasteries and towns, standardizing the hour.",
    event_type: "creation",
    importance: 8,
    temporal_data: { year: 1300, era: "CE", precision: "approximate" },
    timelineKey: "p07",
  },
  {
    key: "p7-pendulum",
    slug: `${SEED_PREFIX}-p7-pendulum-clock`,
    title: "Huygens Builds the Pendulum Clock",
    summary: "The pendulum's swing takes clocks from minutes to seconds. Accuracy: ~15 s/day.",
    detail:
      "Applying Galileo's discovery of pendulum isochronism, Huygens built the first pendulum clock in 1656 — a hundredfold jump in accuracy.",
    event_type: "creation",
    importance: 9,
    temporal_data: { year: 1656, era: "CE", precision: "exact" },
    location: "The Hague",
    timelineKey: "p07",
    participants: [
      { characterKey: "huygens", role: "creator", significance: "primary", description: "Built the first pendulum clock." },
      { characterKey: "galileo", role: "participant", significance: "secondary", description: "Discovered pendulum isochronism, the principle Huygens applied." },
    ],
  },
  {
    key: "p7-chronometer",
    slug: `${SEED_PREFIX}-p7-marine-chronometer`,
    title: "Harrison's Marine Chronometer Solves Longitude",
    summary: "A sea-worthy clock keeps reference time, fixing longitude. Accuracy: seconds/day.",
    detail:
      "Harrison's H4 kept accurate time despite a ship's motion and temperature swings, letting navigators compute longitude. This event drills into 'The Longitude Problem'.",
    event_type: "creation",
    importance: 9,
    temporal_data: { year: 1761, era: "CE", precision: "exact" },
    location: "England",
    timelineKey: "p07",
    detailTimelineKey: "p07-lon",
    participants: [
      { characterKey: "harrison", role: "creator", significance: "primary", description: "Designed and built the marine chronometer over decades." },
    ],
  },
  {
    key: "p7-quartz",
    slug: `${SEED_PREFIX}-p7-quartz-clock`,
    title: "The Quartz Oscillator",
    summary: "A vibrating crystal replaces the pendulum. Accuracy: milliseconds/day.",
    detail:
      "Marrison and Horton's 1927 quartz clock used the piezoelectric resonance of quartz — no pendulum, no escapement — for a thousandfold gain over the best mechanical clocks.",
    event_type: "creation",
    importance: 9,
    temporal_data: { year: 1927, era: "CE", precision: "exact" },
    location: "Bell Labs, USA",
    timelineKey: "p07",
    alsoInTimelineKeys: ["p10"],
    participants: [
      { characterKey: "marrison", role: "creator", significance: "primary", description: "Co-invented the quartz clock." },
      { characterKey: "horton", role: "creator", significance: "secondary", description: "Co-invented the quartz clock." },
    ],
  },
  {
    key: "p7-atomic",
    slug: `${SEED_PREFIX}-p7-atomic-clock`,
    title: "The Caesium Atomic Clock",
    summary: "An atomic transition becomes the metronome. Accuracy: nanoseconds/day.",
    detail:
      "Essen and Parry's 1955 caesium clock at the NPL tied the second to an unchanging atomic property, becoming the basis of the SI second in 1967.",
    event_type: "creation",
    importance: 10,
    temporal_data: { year: 1955, era: "CE", precision: "exact" },
    location: "NPL, Teddington, UK",
    timelineKey: "p07",
    alsoInTimelineKeys: ["p08", "p10"],
    participants: [
      { characterKey: "essen", role: "creator", significance: "primary", description: "Led construction of the first accurate caesium clock." },
      { characterKey: "parry", role: "creator", significance: "secondary", description: "Co-built the caesium clock." },
      { characterKey: "org-npl", role: "participant", significance: "secondary", description: "Host laboratory for the first caesium standard." },
    ],
  },
  {
    key: "p7-optical",
    slug: `${SEED_PREFIX}-p7-optical-clock`,
    title: "The Optical Lattice Clock",
    summary: "Optical-frequency clocks reach parts in ten quintillion. Accuracy: ~1 s in the age of the universe.",
    detail:
      "Katori's optical lattice clock reads an optical atomic transition in atoms held at a 'magic wavelength', pushing stability far beyond caesium and pointing to a future redefinition of the second.",
    event_type: "creation",
    importance: 10,
    temporal_data: { year: 2001, era: "CE", precision: "exact" },
    location: "Tokyo, Japan",
    timelineKey: "p07",
    alsoInTimelineKeys: ["p10"],
    participants: [
      { characterKey: "katori", role: "creator", significance: "primary", description: "Invented the optical lattice clock." },
    ],
  },
  // ---- Phase 7.1: The Longitude Problem (DEEPER) ----
  {
    key: "lon-scilly",
    slug: `${SEED_PREFIX}-lon-scilly-disaster`,
    title: "The Scilly Naval Disaster",
    summary: "A navigational error wrecks a British fleet, killing ~2,000 sailors.",
    detail:
      "The 1707 loss of four ships off the Scilly Isles, blamed on the inability to determine longitude, galvanized official efforts to solve the problem.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 1707, era: "CE", precision: "exact" },
    location: "Isles of Scilly",
    timelineKey: "p07-lon",
  },
  {
    key: "lon-act",
    slug: `${SEED_PREFIX}-lon-longitude-act`,
    title: "The Longitude Act and Its Board",
    summary: "Parliament offers a prize and creates the Board of Longitude.",
    detail:
      "The 1714 Longitude Act promised up to £20,000 for a practical method and established the Board of Longitude to judge claims.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 1714, era: "CE", precision: "exact" },
    location: "London",
    timelineKey: "p07-lon",
    participants: [
      { characterKey: "org-board-longitude", role: "participant", significance: "primary", description: "Established to administer the longitude prize." },
    ],
  },
  {
    key: "lon-h4",
    slug: `${SEED_PREFIX}-lon-h4-sea-trial`,
    title: "H4's Sea Trial to Jamaica",
    summary: "Harrison's H4 keeps time across the Atlantic to within seconds.",
    detail:
      "On its 1761–62 trial to Jamaica, H4 lost only a few seconds, proving the chronometer method — though the Board, influenced by Maskelyne, withheld full payment for years.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 1762, era: "CE", precision: "exact" },
    location: "Atlantic / Jamaica",
    timelineKey: "p07-lon",
    participants: [
      { characterKey: "harrison", role: "protagonist", significance: "primary", description: "His chronometer passed the transatlantic trial." },
      { characterKey: "maskelyne", role: "antagonist", significance: "secondary", description: "Championed the rival lunar-distance method and disputed Harrison's award." },
    ],
  },
  {
    key: "lon-cook",
    slug: `${SEED_PREFIX}-lon-cook-voyage`,
    title: "Cook's Voyage Validates the Chronometer",
    summary: "A copy of H4 charts the Pacific with unprecedented accuracy.",
    detail:
      "James Cook carried a chronometer (Larcum Kendall's K1 copy of H4) on his second voyage, praising it as his reliable guide and settling the method's superiority.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 1772, era: "CE", precision: "exact" },
    location: "Pacific Ocean",
    timelineKey: "p07-lon",
  },

  // ---- Phase 8: Humans Standardize Time (stub) ----
  {
    key: "p8-railway",
    slug: `${SEED_PREFIX}-p8-railway-time`,
    title: "Railway Time",
    summary: "Railways impose a single standard time over patchworks of local solar time.",
    detail:
      "From 1840 British railways adopted GMT across their networks, the first practical break from town-by-town local time.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 1840, era: "CE", precision: "exact" },
    location: "Great Britain",
    timelineKey: "p08",
  },
  {
    key: "p8-gmt",
    slug: `${SEED_PREFIX}-p8-greenwich-mean-time`,
    title: "Greenwich Mean Time Adopted",
    summary: "GMT, kept by the Royal Observatory, becomes Britain's civil time.",
    detail:
      "Mean solar time at the Greenwich meridian was distributed by time signals and became the national standard, later the reference for the world.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 1847, era: "CE", precision: "exact" },
    location: "Greenwich, London",
    timelineKey: "p08",
    participants: [
      { characterKey: "org-greenwich", role: "participant", significance: "primary", description: "Kept and distributed Greenwich Mean Time." },
    ],
  },
  {
    key: "p8-prime-meridian",
    slug: `${SEED_PREFIX}-p8-prime-meridian`,
    title: "The Prime Meridian Conference",
    summary: "1884 Washington conference fixes Greenwich as the world's prime meridian.",
    detail:
      "Delegates chose the Greenwich meridian as longitude zero and endorsed a universal day, the framework for global time zones — with Sandford Fleming a leading advocate.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 1884, era: "CE", precision: "exact" },
    location: "Washington, D.C.",
    timelineKey: "p08",
    participants: [
      { characterKey: "fleming", role: "protagonist", significance: "primary", description: "Championed worldwide standard time zones and a prime meridian." },
      { characterKey: "org-greenwich", role: "participant", significance: "secondary", description: "Its meridian was adopted as longitude zero." },
    ],
  },
  {
    key: "p8-si-second",
    slug: `${SEED_PREFIX}-p8-si-second`,
    title: "The SI Second Redefined on Caesium",
    summary: "1967: the second is defined by 9,192,631,770 caesium oscillations.",
    detail:
      "The BIPM redefined the SI second in terms of the caesium-133 hyperfine transition, untethering the fundamental unit of time from Earth's variable rotation.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 1967, era: "CE", precision: "exact" },
    timelineKey: "p08",
    participants: [
      { characterKey: "org-bipm", role: "participant", significance: "primary", description: "Adopted the atomic definition of the second." },
    ],
  },
  {
    key: "p8-utc",
    slug: `${SEED_PREFIX}-p8-utc`,
    title: "Coordinated Universal Time (UTC)",
    summary: "1972: atomic time plus leap seconds becomes the world's civil time.",
    detail:
      "UTC combines the stability of atomic clocks with occasional leap seconds — inserted on the IERS's decision — to stay within a second of Earth-rotation time.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 1972, era: "CE", precision: "exact" },
    timelineKey: "p08",
    participants: [
      { characterKey: "org-bipm", role: "participant", significance: "primary", description: "Coordinates the international atomic timescale behind UTC." },
      { characterKey: "org-iers", role: "participant", significance: "secondary", description: "Decides when leap seconds are inserted." },
    ],
  },

  // ---- Phase 9: Humans Synchronize Time (stub) ----
  {
    key: "p9-telegraph",
    slug: `${SEED_PREFIX}-p9-telegraph-time`,
    title: "Telegraph Time Signals",
    summary: "Observatories send time down the wire, synchronizing distant clocks.",
    detail:
      "From the 1850s, observatories transmitted time signals by telegraph, letting distant cities set their clocks to a common reference for the first time.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 1852, era: "CE", precision: "exact" },
    timelineKey: "p09",
  },
  {
    key: "p9-radio",
    slug: `${SEED_PREFIX}-p9-radio-time`,
    title: "Radio Time Signals",
    summary: "Broadcast time signals reach ships and stations everywhere.",
    detail:
      "Radio time services (such as those from the Eiffel Tower and, from 1923, WWV) broadcast standard time widely, essential for navigation and science.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 1920, era: "CE", precision: "exact" },
    timelineKey: "p09",
  },
  {
    key: "p9-gps",
    slug: `${SEED_PREFIX}-p9-gps`,
    title: "GPS Achieves Global Time Transfer",
    summary: "Atomic clocks in orbit broadcast time worldwide to nanoseconds.",
    detail:
      "The Global Positioning System's satellite atomic clocks, corrected for relativity, deliver position and precise time anywhere on Earth — the backbone of modern synchronization.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 1978, era: "CE", precision: "exact" },
    timelineKey: "p09",
  },
  {
    key: "p9-ntp",
    slug: `${SEED_PREFIX}-p9-ntp`,
    title: "The Network Time Protocol",
    summary: "Mills's NTP keeps the internet's clocks in agreement to milliseconds.",
    detail:
      "David Mills's NTP (1985) disciplines computer clocks across the internet using a hierarchy of time servers, tolerating variable network delay.",
    event_type: "creation",
    importance: 8,
    temporal_data: { year: 1985, era: "CE", precision: "exact" },
    timelineKey: "p09",
    alsoInTimelineKeys: ["p11"],
    participants: [
      { characterKey: "mills", role: "creator", significance: "primary", description: "Designed and long maintained NTP." },
    ],
  },
  {
    key: "p9-ptp",
    slug: `${SEED_PREFIX}-p9-ptp`,
    title: "The Precision Time Protocol",
    summary: "IEEE 1588 brings sub-microsecond sync to local networks.",
    detail:
      "PTP (IEEE 1588, 2002) uses hardware timestamping to synchronize devices on a LAN to sub-microsecond precision, serving industry, telecoms, and power grids.",
    event_type: "creation",
    importance: 7,
    temporal_data: { year: 2002, era: "CE", precision: "exact" },
    timelineKey: "p09",
  },

  // ---- Phase 10: Humans Master Precision (stub; reuses instrument characters) ----
  {
    key: "p10-pendulum",
    slug: `${SEED_PREFIX}-p10-pendulum-precision`,
    title: "Pendulum Clocks Reach Seconds a Day",
    summary: "Best achievable uncertainty falls to a few seconds per day.",
    detail:
      "Refined pendulum clocks in temperature-controlled cases pushed accuracy to seconds and then fractions of a second per day.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 1670, era: "CE", precision: "approximate" },
    timelineKey: "p10",
  },
  {
    key: "p10-quartz",
    slug: `${SEED_PREFIX}-p10-quartz-precision`,
    title: "Quartz Reaches Milliseconds a Day",
    summary: "Crystal oscillators cut daily error by a further thousandfold.",
    detail: "Quartz clocks brought timekeeping uncertainty down to the millisecond scale per day.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 1930, era: "CE", precision: "approximate" },
    timelineKey: "p10",
  },
  {
    key: "p10-atomic",
    slug: `${SEED_PREFIX}-p10-atomic-precision`,
    title: "Atomic Clocks Reach Nanoseconds",
    summary: "Caesium standards achieve nanosecond-scale daily uncertainty.",
    detail: "Atomic clocks brought the achievable uncertainty to nanoseconds — parts in 10¹³ and beyond.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 1955, era: "CE", precision: "exact" },
    timelineKey: "p10",
  },
  {
    key: "p10-optical",
    slug: `${SEED_PREFIX}-p10-optical-precision`,
    title: "Optical Clocks Reach the Age of the Universe",
    summary: "Optical clocks would lose under a second over ~14 billion years.",
    detail:
      "Optical-frequency standards reach fractional uncertainties near parts in 10¹⁸ — closing the precision narrative that began with the shadow clock's hours.",
    event_type: "milestone",
    importance: 9,
    temporal_data: { year: 2015, era: "CE", precision: "exact" },
    timelineKey: "p10",
  },

  // ---- Phase 11: Humans Network Time (stub; carries fictional character) ----
  {
    key: "p11-arpanet",
    slug: `${SEED_PREFIX}-p11-arpanet`,
    title: "ARPANET and Distributed Time",
    summary: "Early networks expose the need to agree on time across machines.",
    detail:
      "As computers networked from 1969, the problem of a shared, distributed clock became pressing — the seed of internet time synchronization.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 1969, era: "CE", precision: "exact" },
    timelineKey: "p11",
  },
  {
    key: "p11-ntp-pool",
    slug: `${SEED_PREFIX}-p11-ntp-pool`,
    title: "The NTP Pool",
    summary: "A volunteer cluster of servers makes accurate time a public utility.",
    detail:
      "The NTP Pool project (2003) organized thousands of volunteer time servers into a resilient global service that most devices quietly rely on.",
    event_type: "milestone",
    importance: 6,
    temporal_data: { year: 2003, era: "CE", precision: "exact" },
    timelineKey: "p11",
  },
  {
    key: "p11-white-rabbit",
    slug: `${SEED_PREFIX}-p11-white-rabbit`,
    title: "White Rabbit Sub-Nanosecond Synchronization",
    summary: "CERN's White Rabbit fabric synchronizes thousands of nodes to picoseconds.",
    detail:
      "Developed at CERN to synchronize accelerator electronics, the White Rabbit protocol — named for Lewis Carroll's perpetually-late character — achieves sub-nanosecond, even picosecond, agreement over long fibre links.",
    event_type: "creation",
    importance: 7,
    temporal_data: { year: 2012, era: "CE", precision: "exact" },
    location: "CERN, Geneva",
    timelineKey: "p11",
    participants: [
      { characterKey: "org-cern", role: "creator", significance: "primary", description: "Developed the White Rabbit timing protocol." },
      { characterKey: "white-rabbit", role: "witness", significance: "mentioned", description: "The protocol is named after this time-obsessed literary character." },
    ],
  },
  {
    key: "p11-mifid",
    slug: `${SEED_PREFIX}-p11-mifid-timestamps`,
    title: "Regulated Financial Time-Stamping",
    summary: "Markets are mandated to timestamp trades to within microseconds of UTC.",
    detail:
      "Rules such as MiFID II (2018) required trading systems to record events to microsecond accuracy traceable to UTC — time as legal infrastructure.",
    event_type: "milestone",
    importance: 6,
    temporal_data: { year: 2018, era: "CE", precision: "exact" },
    timelineKey: "p11",
  },

  // ---- Phase 12: Future Time (speculative stub) ----
  {
    key: "p12-redefine-second",
    slug: `${SEED_PREFIX}-p12-redefine-second`,
    title: "The Second Redefined on an Optical Transition",
    summary: "The SI second is expected to be redefined using optical clocks.",
    detail:
      "Metrology bodies anticipate redefining the second on an optical atomic transition around 2030, a hundredfold gain in the definition's precision.",
    event_type: "milestone",
    importance: 8,
    temporal_data: { year: 2030, era: "CE", precision: "estimated", confidence_level: "medium" },
    timelineKey: "p12",
  },
  {
    key: "p12-nuclear-clock",
    slug: `${SEED_PREFIX}-p12-nuclear-clock`,
    title: "The Nuclear (Thorium) Clock",
    summary: "A clock ticking on a nuclear transition promises new stability and physics tests.",
    detail:
      "A thorium-229 nuclear clock, referencing a transition in the atomic nucleus rather than its electrons, could be extraordinarily stable and probe whether physical constants drift.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 2035, era: "CE", precision: "estimated", confidence_level: "low" },
    timelineKey: "p12",
  },
  {
    key: "p12-geodesy",
    slug: `${SEED_PREFIX}-p12-relativistic-geodesy`,
    title: "Clock-Based Relativistic Geodesy",
    summary: "Comparing clocks measures gravitational potential — mapping elevation by time.",
    detail:
      "Because clocks tick slower deeper in a gravity well, networks of optical clocks could measure height differences of a centimetre by comparing their rates.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 2040, era: "CE", precision: "estimated", confidence_level: "low" },
    timelineKey: "p12",
  },
  {
    key: "p12-interplanetary",
    slug: `${SEED_PREFIX}-p12-interplanetary-time`,
    title: "An Interplanetary Time Standard",
    summary: "Humanity defines a coordinate time spanning multiple worlds.",
    detail:
      "Sustained presence on the Moon and Mars will demand a relativistically consistent interplanetary timescale — extending standardization beyond Earth.",
    event_type: "milestone",
    importance: 7,
    temporal_data: { year: 2100, era: "CE", precision: "estimated", confidence_level: "low" },
    timelineKey: "p12",
  },
];

const EVENTS: EventSeed[] = [...BACKBONE_EVENTS, ...PHASE_EVENTS];

// ─── Character relationships (the causal graph; char↔char only) ──────────────

const RELATIONSHIPS: RelationshipSeed[] = [
  // Instrument supersession / derivation chain (artifact↔artifact).
  { characterKey: "art-sundial", relatedCharacterKey: "art-shadow-clock", relationship_type: "superseded", description: "The calibrated sundial superseded the bare gnomon." },
  { characterKey: "art-water-clock", relatedCharacterKey: "art-sundial", relationship_type: "superseded", description: "The water clock superseded the sundial by working at night and indoors." },
  { characterKey: "art-hourglass", relatedCharacterKey: "art-water-clock", relationship_type: "derived_from", description: "The hourglass adapted the flow principle of the water clock to a sealed, sea-worthy form." },
  { characterKey: "art-candle-clock", relatedCharacterKey: "art-incense-clock", relationship_type: "copied", description: "The candle clock applied the same burn-rate principle as the incense clock." },
  { characterKey: "art-mechanical-clock", relatedCharacterKey: "art-water-clock", relationship_type: "superseded", description: "The mechanical escapement clock superseded the water clock in Europe." },
  { characterKey: "art-pendulum-clock", relatedCharacterKey: "art-mechanical-clock", relationship_type: "superseded", description: "The pendulum clock superseded the escapement clock." },
  { characterKey: "art-pendulum-clock", relatedCharacterKey: "art-mechanical-clock", relationship_type: "improved", description: "Huygens's pendulum improved daily accuracy a hundredfold." },
  { characterKey: "art-marine-chronometer", relatedCharacterKey: "art-pendulum-clock", relationship_type: "derived_from", description: "The marine chronometer descended from the pendulum clock, replacing the pendulum with a balance spring for use at sea." },
  { characterKey: "art-quartz-clock", relatedCharacterKey: "art-pendulum-clock", relationship_type: "superseded", description: "The quartz oscillator superseded the pendulum." },
  { characterKey: "art-quartz-clock", relatedCharacterKey: "art-atomic-clock", relationship_type: "enabled", description: "Quartz electronics enabled the caesium atomic clock's servo loop." },
  { characterKey: "art-atomic-clock", relatedCharacterKey: "art-quartz-clock", relationship_type: "superseded", description: "The atomic clock superseded quartz as the primary standard." },
  { characterKey: "art-optical-clock", relatedCharacterKey: "art-atomic-clock", relationship_type: "superseded", description: "The optical lattice clock surpasses the caesium clock in stability." },
  { characterKey: "art-optical-clock", relatedCharacterKey: "art-atomic-clock", relationship_type: "improved", description: "Optical clocks improved fractional uncertainty by orders of magnitude." },

  // Makers and their instruments (human↔artifact).
  { characterKey: "ctesibius", relatedCharacterKey: "art-water-clock", relationship_type: "improved", description: "Ctesibius improved the water clock with a float regulator." },
  { characterKey: "su-song", relatedCharacterKey: "art-mechanical-clock", relationship_type: "influenced", description: "Su Song's escapement tower prefigured the mechanical clock." },
  { characterKey: "huygens", relatedCharacterKey: "art-pendulum-clock", relationship_type: "creator_creation", description: "Huygens created the pendulum clock." },
  { characterKey: "harrison", relatedCharacterKey: "art-marine-chronometer", relationship_type: "creator_creation", description: "Harrison created the marine chronometer." },
  { characterKey: "harrison", relatedCharacterKey: "art-marine-chronometer", relationship_type: "patented", description: "Harrison's designs were protected and rewarded as the solution to the longitude prize." },
  { characterKey: "marrison", relatedCharacterKey: "art-quartz-clock", relationship_type: "creator_creation", description: "Marrison co-created the quartz clock." },
  { characterKey: "marrison", relatedCharacterKey: "art-quartz-clock", relationship_type: "patented", description: "The quartz oscillator was patented at Bell Labs." },
  { characterKey: "essen", relatedCharacterKey: "art-atomic-clock", relationship_type: "creator_creation", description: "Essen created the first accurate caesium atomic clock." },
  { characterKey: "katori", relatedCharacterKey: "art-optical-clock", relationship_type: "creator_creation", description: "Katori invented the optical lattice clock." },

  // Intellectual influence and collaboration (human↔human).
  { characterKey: "galileo", relatedCharacterKey: "huygens", relationship_type: "inspired", description: "Galileo's discovery of pendulum isochronism inspired Huygens's clock." },
  { characterKey: "hipparchus", relatedCharacterKey: "ptolemy", relationship_type: "influenced", description: "Hipparchus's catalogue and methods shaped Ptolemy's astronomy." },
  { characterKey: "ptolemy", relatedCharacterKey: "hipparchus", relationship_type: "derived_from", description: "Ptolemy's models derived from Hipparchus's observations and star catalogue." },
  { characterKey: "marrison", relatedCharacterKey: "horton", relationship_type: "collaboration", description: "Marrison and Horton collaborated on the quartz clock at Bell Labs." },
  { characterKey: "essen", relatedCharacterKey: "parry", relationship_type: "collaboration", description: "Essen and Parry collaborated on the caesium clock at the NPL." },
  { characterKey: "harrison", relatedCharacterKey: "maskelyne", relationship_type: "rivalry", description: "Harrison and Maskelyne were rivals over the chronometer versus lunar-distance methods." },

  // Naturalism challenges myth (human↔mythological).
  { characterKey: "thales", relatedCharacterKey: "chronos", relationship_type: "challenged", description: "Thales's naturalistic astronomy challenged the mythological personification of time." },

  // Organizations standardize / adopt instruments (organization↔artifact).
  { characterKey: "org-bipm", relatedCharacterKey: "art-atomic-clock", relationship_type: "standardized", description: "The BIPM standardized the second on the caesium atomic clock." },
  { characterKey: "org-greenwich", relatedCharacterKey: "art-pendulum-clock", relationship_type: "adopted", description: "The Royal Observatory adopted precision pendulum regulators to keep Greenwich time." },
];

// ─── Orchestration ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const config = resolveSeedConfig();

  // Fail fast: validate all temporal integers before any DB writes.
  assertTemporalData(PERIOD.temporal_data);
  assertTemporalData(PERIOD.end_temporal_data);
  for (const timeline of TIMELINES) {
    assertTemporalData(timeline.temporal_data);
    assertTemporalData(timeline.end_temporal_data);
  }
  for (const character of CHARACTERS) {
    if (character.birth_temporal) assertTemporalData(character.birth_temporal);
    if (character.death_temporal) assertTemporalData(character.death_temporal);
  }
  for (const event of EVENTS) {
    assertTemporalData(event.temporal_data);
    if (event.end_temporal_data) assertTemporalData(event.end_temporal_data);
  }

  const adminUser = await ensureAdminUser(config);
  const userId = adminUser.id;

  console.log("Seeding dataset:", `${DATASET_NAME}:${DATASET_VERSION}`);
  console.log("Target user:", userId, `(${config.adminEmail})`);
  console.log("Base URL:", config.baseUrl);

  // ── Discover + delete existing seed rows by prefix (junctions cascade) ────
  const tablesToClear = ["events", "characters", "timelines", "periods"] as const;
  const deletedCounts: Record<string, number> = {};
  for (const table of tablesToClear) {
    const existing = await restRequest<InsertedRow[]>(config, table, {
      query: `select=id,slug&user_id=eq.${userId}&slug=like.${SEED_PREFIX}-%`,
    });
    deletedCounts[table] = existing.length;
    if (existing.length > 0) {
      await restRequest<unknown>(config, table, {
        method: "DELETE",
        query: `user_id=eq.${userId}&slug=in.${encodeIn(existing.map((r) => r.slug))}`,
      });
    }
  }

  // ── Period ────────────────────────────────────────────────────────────────
  const insertedPeriod = await restRequest<Array<{ id: string }>>(config, "periods", {
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
      characteristics: [`seed:${DATASET_NAME}:${DATASET_VERSION}`, "cosmology", "timekeeping", "metrology"],
    },
  });
  const periodId = insertedPeriod[0]?.id;
  if (!periodId) throw new Error("Period insert did not return an id.");

  // ── Timelines ───────────────────────────────────────────────────────────
  const insertedTimelines = await restRequest<InsertedRow[]>(config, "timelines", {
    method: "POST",
    returnRepresentation: true,
    body: TIMELINES.map((t) => ({
      user_id: userId,
      slug: t.slug,
      title: t.title,
      summary: t.summary,
      detail: t.detail,
      scale: t.scale ?? null,
      timeline_type: "general",
      visibility: "public",
      temporal_data: t.temporal_data,
      end_temporal_data: t.end_temporal_data,
      metadata: { seed_dataset: DATASET_NAME, seed_version: DATASET_VERSION, seed_prefix: SEED_PREFIX, seed_key: t.key },
    })),
  });
  const timelineIdByKey = new Map<string, string>();
  for (const t of TIMELINES) {
    const row = insertedTimelines.find((r) => r.slug === t.slug);
    if (!row?.id) throw new Error(`Timeline insert missing id for ${t.title}`);
    timelineIdByKey.set(t.key, row.id);
  }
  const timelineId = (key: string): string => {
    const id = timelineIdByKey.get(key);
    if (!id) throw new Error(`Unknown timeline key: ${key}`);
    return id;
  };

  // ── period_timelines: link every timeline to the root period ──────────────
  await restRequest<unknown>(config, "period_timelines", {
    method: "POST",
    body: TIMELINES.map((t) => ({ period_id: periodId, timeline_id: timelineId(t.key) })),
  });

  // ── Characters ────────────────────────────────────────────────────────────
  const insertedCharacters = await restRequest<InsertedRow[]>(config, "characters", {
    method: "POST",
    returnRepresentation: true,
    body: CHARACTERS.map((c) => ({
      user_id: userId,
      slug: c.slug,
      name: c.name,
      character_type: c.character_type,
      biography: c.biography,
      aliases: c.aliases ?? null,
      cultural_context: c.cultural_context ?? null,
      species: c.species ?? null,
      domain: c.domain ?? null,
      significance: c.significance,
      birth_temporal: c.birth_temporal ?? null,
      death_temporal: c.death_temporal ?? null,
      metadata: { seed_dataset: DATASET_NAME, seed_version: DATASET_VERSION, seed_prefix: SEED_PREFIX, seed_key: c.key },
    })),
  });
  const characterIdByKey = new Map<string, string>();
  for (const c of CHARACTERS) {
    const row = insertedCharacters.find((r) => r.slug === c.slug);
    if (!row?.id) throw new Error(`Character insert missing id for ${c.name}`);
    characterIdByKey.set(c.key, row.id);
  }
  const characterId = (key: string): string => {
    const id = characterIdByKey.get(key);
    if (!id) throw new Error(`Unknown character key: ${key}`);
    return id;
  };

  // ── Events ────────────────────────────────────────────────────────────────
  const insertedEvents = await restRequest<InsertedRow[]>(config, "events", {
    method: "POST",
    returnRepresentation: true,
    body: EVENTS.map((e) => {
      const homeId = timelineId(e.timelineKey);
      const detailId = e.detailTimelineKey ? timelineId(e.detailTimelineKey) : null;
      if (detailId && detailId === homeId) {
        throw new Error(`Event ${e.key}: detail timeline must differ from home timeline.`);
      }
      return {
        user_id: userId,
        slug: e.slug,
        title: e.title,
        summary: e.summary,
        detail: e.detail,
        event_type: e.event_type,
        importance: e.importance,
        temporal_data: e.temporal_data,
        end_temporal_data: e.end_temporal_data ?? null,
        location: e.location ?? null,
        timeline_id: homeId,
        detail_timeline_id: detailId,
        metadata: {
          seed_dataset: DATASET_NAME,
          seed_version: DATASET_VERSION,
          seed_prefix: SEED_PREFIX,
          seed_key: e.key,
          ...(e.extraMetadata ?? {}),
        },
      };
    }),
  });
  const eventIdByKey = new Map<string, string>();
  for (const e of EVENTS) {
    const row = insertedEvents.find((r) => r.slug === e.slug);
    if (!row?.id) throw new Error(`Event insert missing id for ${e.title}`);
    eventIdByKey.set(e.key, row.id);
  }

  // ── timeline_events: backbone narrative order + secondary memberships ─────
  type TimelineEventRow = { timeline_id: string; event_id: string; sort_order: number };
  const timelineEventRows: TimelineEventRow[] = [];
  for (const e of EVENTS) {
    const eventId = eventIdByKey.get(e.key);
    if (!eventId) continue;
    if (e.narrativeOrder !== undefined) {
      timelineEventRows.push({ timeline_id: timelineId(e.timelineKey), event_id: eventId, sort_order: e.narrativeOrder });
    }
    for (const alsoKey of e.alsoInTimelineKeys ?? []) {
      timelineEventRows.push({ timeline_id: timelineId(alsoKey), event_id: eventId, sort_order: 0 });
    }
  }
  if (timelineEventRows.length > 0) {
    await restRequest<unknown>(config, "timeline_events", { method: "POST", body: timelineEventRows });
  }

  // ── event_characters: participation ───────────────────────────────────────
  const eventCharacterRows = EVENTS.flatMap((e) => {
    const eventId = eventIdByKey.get(e.key);
    if (!eventId) return [];
    return (e.participants ?? []).map((p) => ({
      event_id: eventId,
      character_id: characterId(p.characterKey),
      role: p.role,
      significance: p.significance,
      description: p.description,
    }));
  });
  if (eventCharacterRows.length > 0) {
    await restRequest<unknown>(config, "event_characters", { method: "POST", body: eventCharacterRows });
  }

  // ── character_relationships: the causal graph ─────────────────────────────
  const relationshipRows = RELATIONSHIPS.map((r) => ({
    user_id: userId,
    character_id: characterId(r.characterKey),
    related_character_id: characterId(r.relatedCharacterKey),
    relationship_type: r.relationship_type,
    description: r.description,
    start_temporal: r.start_temporal ?? null,
    end_temporal: r.end_temporal ?? null,
    metadata: { seed_dataset: DATASET_NAME, seed_version: DATASET_VERSION, seed_prefix: SEED_PREFIX },
  }));
  if (relationshipRows.length > 0) {
    await restRequest<unknown>(config, "character_relationships", { method: "POST", body: relationshipRows });
  }

  console.log("Seed complete.");
  console.log(
    `Deleted → periods:${deletedCounts.periods} timelines:${deletedCounts.timelines} characters:${deletedCounts.characters} events:${deletedCounts.events}`,
  );
  console.log(`Inserted periods: 1`);
  console.log(`Inserted timelines: ${insertedTimelines.length}`);
  console.log(`Inserted period_timelines: ${TIMELINES.length}`);
  console.log(`Inserted characters: ${insertedCharacters.length}`);
  console.log(`Inserted events: ${insertedEvents.length}`);
  console.log(`Inserted timeline_events: ${timelineEventRows.length}`);
  console.log(`Inserted event_characters: ${eventCharacterRows.length}`);
  console.log(`Inserted character_relationships: ${relationshipRows.length}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Seed failed:", message);
  process.exitCode = 1;
});
