import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BookOpen,
  Calendar,
  Clock,
  FolderTree,
  GitBranch,
  Image as ImageIcon,
  LayoutDashboard,
  Minus,
  Plus,
  Users,
  X,
} from "lucide-react";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { useUiStore } from "@repo/ui/stores";
import { AutosaveIndicator } from "./autosave-indicator";
import { Avatar, AvatarFallback } from "./avatar";
import { Button } from "./button";
import { ChipInput } from "./chip-input";
import { Label } from "./label";
import { SaveDropdown } from "./save-dropdown";
import { Separator } from "./separator";
import { Shell, type ShellNavItem, type ShellQuickCreateItem } from "./shell";
import { SlugField } from "./slug-field";
import { Slider } from "./slider";
import { TemporalInput } from "./temporal-input";
import { Textarea } from "./textarea";

// ─── Shell fixture data ───────────────────────────────────────────────────────

const NAV: ShellNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Timelines", href: "/timelines", icon: GitBranch },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Characters", href: "/characters", icon: Users },
  { label: "Periods", href: "/periods", icon: Clock },
  { label: "Stories", href: "/stories", icon: BookOpen },
  { label: "Categories", href: "/categories", icon: FolderTree },
  { label: "Media", href: "/media", icon: ImageIcon },
];

const QUICK_CREATE: ShellQuickCreateItem[] = [
  { label: "Character", href: "/characters/new" },
  { label: "Event", href: "/events/new" },
  { label: "Period", href: "/periods/new" },
  { label: "Story", href: "/stories/new" },
  { label: "Timeline", href: "/timelines/new" },
  { label: "Category", href: "/categories/new" },
  { label: "Media", href: "/media/new" },
  { label: "Relationship", href: "/relationships/new" },
];

const SHELL_USER = { name: "Admin User", email: "admin@example.com" };

// ─── Form types ───────────────────────────────────────────────────────────────

type EventType =
  | "milestone"
  | "period"
  | "incident"
  | "discovery"
  | "creation"
  | "destruction"
  | "transformation"
  | "migration"
  | "conflict"
  | "ceremony";

type ParticipantRole =
  | "protagonist"
  | "antagonist"
  | "witness"
  | "victim"
  | "beneficiary"
  | "organizer"
  | "participant"
  | "bystander";

type ParticipantSignificance = "primary" | "secondary" | "minor" | "background";

interface Participant {
  id: string;
  name: string;
  initials: string;
  role: ParticipantRole;
  significance: ParticipantSignificance;
  note: string;
}

interface EventFormState {
  title: string;
  slug: string;
  summary: string;
  detail: string;
  eventType: EventType;
  startDate: TemporalData | null;
  endDate: TemporalData | null;
  location: string;
  latDeg: string;
  lngDeg: string;
  parentEvent: string;
  timeline: string;
  participants: Participant[];
  categories: string[];
  importance: number;
  published: boolean;
}

const BLANK_FORM: EventFormState = {
  title: "",
  slug: "",
  summary: "",
  detail: "",
  eventType: "milestone",
  startDate: null,
  endDate: null,
  location: "",
  latDeg: "",
  lngDeg: "",
  parentEvent: "",
  timeline: "",
  participants: [],
  categories: [],
  importance: 5,
  published: false,
};

const POLONIUM_FORM: EventFormState = {
  title: "Discovery of polonium",
  slug: "discovery-of-polonium",
  summary:
    "Marie and Pierre Curie isolate polonium, the first new element identified through radioactivity research.",
  detail:
    "In 1898, Marie and Pierre Curie announced the discovery of a new radioactive element, " +
    "which they named polonium after Marie's homeland. This marked the first element discovered " +
    "through the novel technique of tracking radioactivity.",
  eventType: "discovery",
  startDate: { year: 1898, era: "CE", precision: "exact" },
  endDate: null,
  location: "Paris, France",
  latDeg: "48.8566",
  lngDeg: "2.3522",
  parentEvent: "Curies' radium research",
  timeline: "Curie biography",
  participants: [
    {
      id: "1",
      name: "Marie Curie",
      initials: "MC",
      role: "protagonist",
      significance: "primary",
      note: "Led the isolation of polonium",
    },
    {
      id: "2",
      name: "Pierre Curie",
      initials: "PC",
      role: "protagonist",
      significance: "primary",
      note: "",
    },
  ],
  categories: ["Physics", "Discovery"],
  importance: 8,
  published: true,
};

// ─── Layout primitives ────────────────────────────────────────────────────────

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-foreground";
const INPUT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="mb-1.5 font-display text-sm font-normal text-foreground">
        {children}
      </h2>
      <Separator />
    </div>
  );
}

// ─── Event type options ───────────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "milestone", label: "Milestone" },
  { value: "period", label: "Period" },
  { value: "incident", label: "Incident" },
  { value: "discovery", label: "Discovery" },
  { value: "creation", label: "Creation" },
  { value: "destruction", label: "Destruction" },
  { value: "transformation", label: "Transformation" },
  { value: "migration", label: "Migration" },
  { value: "conflict", label: "Conflict" },
  { value: "ceremony", label: "Ceremony" },
];

const ROLE_OPTIONS: { value: ParticipantRole; label: string }[] = [
  { value: "protagonist", label: "Protagonist" },
  { value: "antagonist", label: "Antagonist" },
  { value: "witness", label: "Witness" },
  { value: "victim", label: "Victim" },
  { value: "beneficiary", label: "Beneficiary" },
  { value: "organizer", label: "Organizer" },
  { value: "participant", label: "Participant" },
  { value: "bystander", label: "Bystander" },
];

const SIGNIFICANCE_OPTIONS: {
  value: ParticipantSignificance;
  label: string;
}[] = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "minor", label: "Minor" },
  { value: "background", label: "Background" },
];

// ─── Published toggle ─────────────────────────────────────────────────────────

function PublishedToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => {
          onChange(e.target.checked);
        }}
        className="accent-primary h-4 w-4 rounded"
      />
      <span>{value ? "Published" : "Draft — publish on save"}</span>
    </label>
  );
}

// ─── Participant card ─────────────────────────────────────────────────────────

function ParticipantCard({
  participant,
  onChange,
  onRemove,
}: {
  participant: Participant;
  onChange: (updated: Participant) => void;
  onRemove: () => void;
}) {
  const set = <K extends keyof Participant>(key: K, val: Participant[K]) => {
    onChange({ ...participant, [key]: val });
  };

  return (
    <div className="relative rounded-md border border-border bg-surface/40 px-4 py-3">
      <button
        type="button"
        aria-label={`Remove ${participant.name}`}
        onClick={onRemove}
        className="absolute right-3 top-3 rounded text-foreground-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>

      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs">
            {participant.initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2 pr-6">
          <p className="text-sm font-medium text-foreground">
            {participant.name}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-foreground-muted">
                Role
              </label>
              <select
                className={`${SELECT_CLASS} h-8 py-1 text-xs`}
                value={participant.role}
                onChange={(e) => {
                  set("role", e.target.value as ParticipantRole);
                }}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground-muted">
                Significance
              </label>
              <select
                className={`${SELECT_CLASS} h-8 py-1 text-xs`}
                value={participant.significance}
                onChange={(e) => {
                  set(
                    "significance",
                    e.target.value as ParticipantSignificance,
                  );
                }}
              >
                {SIGNIFICANCE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input
            className={`${INPUT_CLASS} h-8 py-1 text-xs`}
            value={participant.note}
            onChange={(e) => {
              set("note", e.target.value);
            }}
            placeholder="Optional note for this participant's role…"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

interface EventEditorPageProps {
  mode: "create" | "edit";
  initialForm: EventFormState;
  isSaving?: boolean;
  savedAt?: Date | null;
}

function EventEditorPage({
  mode,
  initialForm,
  isSaving = false,
  savedAt = null,
}: EventEditorPageProps) {
  const [form, setForm] = React.useState<EventFormState>(initialForm);
  const [autosaveAt, setAutosaveAt] = React.useState<Date | null>(savedAt);
  const [autosaving, setAutosaving] = React.useState(isSaving);

  const set = <K extends keyof EventFormState>(
    key: K,
    value: EventFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setAutosaving(true);
    window.setTimeout(() => {
      setAutosaving(false);
      setAutosaveAt(new Date());
    }, 800);
  };

  const updateParticipant = (id: string, updated: Participant) => {
    setForm((prev) => ({
      ...prev,
      participants: prev.participants.map((p) => (p.id === id ? updated : p)),
    }));
  };

  const removeParticipant = (id: string) => {
    setForm((prev) => ({
      ...prev,
      participants: prev.participants.filter((p) => p.id !== id),
    }));
  };

  const breadcrumbs =
    mode === "create"
      ? [{ label: "Events", href: "/events" }, { label: "New event" }]
      : [
          { label: "Events", href: "/events" },
          { label: form.title || "Edit event" },
        ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-3">
        <nav className="flex items-center gap-1 text-sm text-foreground-muted">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.label}>
              {i > 0 && (
                <span aria-hidden className="mx-1">
                  ▸
                </span>
              )}
              {crumb.href ? (
                <button type="button" className="hover:text-foreground">
                  {crumb.label}
                </button>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <AutosaveIndicator isSaving={autosaving} savedAt={autosaveAt} />
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <SaveDropdown
            onSave={handleSave}
            onSaveAndAddAnother={mode === "create" ? handleSave : undefined}
            onSaveAsDraft={form.published ? handleSave : undefined}
            onSaveAndPublish={!form.published ? handleSave : undefined}
          />
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-auto">
        {/* Left column ── main form */}
        <div className="flex-1 space-y-8 overflow-auto px-6 py-6">
          {/* Identity section */}
          <section>
            <SectionHeading>Identity</SectionHeading>
            <div className="space-y-5">
              {/* Title */}
              <div>
                <Label htmlFor="event-title" className={LABEL_CLASS}>
                  Title{" "}
                  <span aria-label="required" className="text-destructive">
                    *
                  </span>
                </Label>
                <input
                  id="event-title"
                  className={INPUT_CLASS}
                  value={form.title}
                  onChange={(e) => {
                    set("title", e.target.value);
                  }}
                  placeholder="Event title"
                />
              </div>

              {/* Event type */}
              <div>
                <Label htmlFor="event-type" className={LABEL_CLASS}>
                  Type{" "}
                  <span aria-label="required" className="text-destructive">
                    *
                  </span>
                </Label>
                <select
                  id="event-type"
                  className={SELECT_CLASS}
                  value={form.eventType}
                  onChange={(e) => {
                    set("eventType", e.target.value as EventType);
                  }}
                >
                  {EVENT_TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Summary */}
              <div>
                <Label htmlFor="event-summary" className={LABEL_CLASS}>
                  Summary
                </Label>
                <Textarea
                  id="event-summary"
                  value={form.summary}
                  onChange={(e) => {
                    set("summary", e.target.value);
                  }}
                  placeholder="One-paragraph summary…"
                  className="min-h-[80px]"
                />
              </div>

              {/* Detail */}
              <div>
                <Label htmlFor="event-detail" className={LABEL_CLASS}>
                  Detail
                </Label>
                <Textarea
                  id="event-detail"
                  value={form.detail}
                  onChange={(e) => {
                    set("detail", e.target.value);
                  }}
                  placeholder="Long-form narrative…"
                  className="min-h-[160px]"
                />
              </div>
            </div>
          </section>

          {/* When section */}
          <section>
            <SectionHeading>When</SectionHeading>
            <div className="space-y-4">
              <TemporalInput
                label="Start date"
                required
                value={form.startDate}
                onChange={(v) => {
                  set("startDate", v);
                }}
              />
              <TemporalInput
                label="End date"
                value={form.endDate}
                onChange={(v) => {
                  set("endDate", v);
                }}
              />
            </div>
          </section>

          {/* Where section */}
          <section>
            <SectionHeading>Where</SectionHeading>
            <div className="space-y-4">
              <div>
                <Label htmlFor="event-location" className={LABEL_CLASS}>
                  Location
                </Label>
                <input
                  id="event-location"
                  className={INPUT_CLASS}
                  value={form.location}
                  onChange={(e) => {
                    set("location", e.target.value);
                  }}
                  placeholder="Place name or description"
                />
              </div>
              <div>
                <Label className={LABEL_CLASS}>Coordinates</Label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      aria-label="Latitude"
                      className={INPUT_CLASS}
                      type="number"
                      step="any"
                      min={-90}
                      max={90}
                      value={form.latDeg}
                      onChange={(e) => {
                        set("latDeg", e.target.value);
                      }}
                      placeholder="Latitude"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      aria-label="Longitude"
                      className={INPUT_CLASS}
                      type="number"
                      step="any"
                      min={-180}
                      max={180}
                      value={form.lngDeg}
                      onChange={(e) => {
                        set("lngDeg", e.target.value);
                      }}
                      placeholder="Longitude"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Lineage section */}
          <section>
            <SectionHeading>Lineage</SectionHeading>
            <div className="space-y-4">
              <div>
                <Label htmlFor="event-parent" className={LABEL_CLASS}>
                  Parent event
                </Label>
                <input
                  id="event-parent"
                  className={INPUT_CLASS}
                  value={form.parentEvent}
                  onChange={(e) => {
                    set("parentEvent", e.target.value);
                  }}
                  placeholder="Search for a parent event…"
                />
              </div>
              <div>
                <Label htmlFor="event-timeline" className={LABEL_CLASS}>
                  Timeline
                </Label>
                <input
                  id="event-timeline"
                  className={INPUT_CLASS}
                  value={form.timeline}
                  onChange={(e) => {
                    set("timeline", e.target.value);
                  }}
                  placeholder="Search for a timeline…"
                />
              </div>
            </div>
          </section>

          {/* Participants section */}
          <section>
            <SectionHeading>
              Participants{" "}
              {form.participants.length > 0 && (
                <span className="text-foreground-muted">
                  ({form.participants.length})
                </span>
              )}
            </SectionHeading>
            <div className="space-y-3">
              {form.participants.map((p) => (
                <ParticipantCard
                  key={p.id}
                  participant={p}
                  onChange={(updated) => {
                    updateParticipant(p.id, updated);
                  }}
                  onRemove={() => {
                    removeParticipant(p.id);
                  }}
                />
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  const next: Participant = {
                    id: String(Date.now()),
                    name: "New participant",
                    initials: "NP",
                    role: "participant",
                    significance: "secondary",
                    note: "",
                  };
                  setForm((prev) => ({
                    ...prev,
                    participants: [...prev.participants, next],
                  }));
                }}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add participant
              </Button>
            </div>
          </section>

          {/* Categories section */}
          <section>
            <SectionHeading>Categories</SectionHeading>
            <ChipInput
              value={form.categories}
              onChange={(v) => {
                set("categories", v);
              }}
              placeholder="Add category"
              description="Press Enter or comma to add."
            />
          </section>

          {/* Media section */}
          <section>
            <SectionHeading>Media</SectionHeading>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-border bg-surface/50 text-foreground-muted">
                <ImageIcon className="h-4 w-4 opacity-40" aria-hidden />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Attach
              </Button>
            </div>
          </section>

          {/* Advanced (collapsed disclosure) */}
          <section>
            <details>
              <summary className="cursor-pointer select-none text-sm text-foreground-muted hover:text-foreground">
                ▸ Advanced (metadata, spatial JSON)
              </summary>
              <div className="mt-3 rounded-md border border-border bg-surface/30 px-4 py-3 text-xs text-foreground-muted">
                JSON editor for <code>metadata</code> and{" "}
                <code>spatial_data</code> — power-user only.
              </div>
            </details>
          </section>
        </div>

        {/* Right column ── metadata rail (fixed width, does not scroll) */}
        <aside className="w-72 shrink-0 space-y-6 border-l border-border px-5 py-6">
          {/* Slug */}
          <div>
            <SlugField
              label="Slug"
              value={form.slug}
              onChange={(v) => {
                set("slug", v);
              }}
              sourceValue={form.title}
              mode={mode}
              warning={
                mode === "edit"
                  ? "Changing the slug will break existing links to this event."
                  : undefined
              }
              description="Auto-generated from title."
            />
          </div>

          {/* Importance slider */}
          <div>
            <Label className={LABEL_CLASS}>Importance (1–10)</Label>
            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Decrease importance"
                className="h-7 w-7 shrink-0 p-0"
                onClick={() => {
                  set("importance", Math.max(1, form.importance - 1));
                }}
              >
                <Minus className="h-3.5 w-3.5" aria-hidden />
              </Button>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[form.importance]}
                onValueChange={([val]) => {
                  if (val !== undefined) set("importance", val);
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Increase importance"
                className="h-7 w-7 shrink-0 p-0"
                onClick={() => {
                  set("importance", Math.min(10, form.importance + 1));
                }}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </Button>
              <span className="w-4 shrink-0 text-right font-mono text-sm tabular-nums text-foreground">
                {form.importance}
              </span>
            </div>
          </div>

          {/* Published */}
          <div>
            <Label className={LABEL_CLASS}>Published</Label>
            <PublishedToggle
              value={form.published}
              onChange={(v) => {
                set("published", v);
              }}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Store reset ──────────────────────────────────────────────────────────────

const shellLoaders = [
  async () => {
    useUiStore.setState({
      sidebarOpen: true,
      sidebarWidth: 280,
      activeModal: null,
      modalData: {},
      toasts: [],
    });
    return {};
  },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: "Pages/Event Editor",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const CreateNew: Story = {
  loaders: shellLoaders,
  render: () => (
    <Shell
      nav={NAV}
      currentPath="/events"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[
        { label: "Events", href: "/events" },
        { label: "New event" },
      ]}
    >
      <EventEditorPage mode="create" initialForm={BLANK_FORM} />
    </Shell>
  ),
};

export const WithParticipants: Story = {
  loaders: shellLoaders,
  render: () => (
    <Shell
      nav={NAV}
      currentPath="/events"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[
        { label: "Events", href: "/events" },
        { label: "Discovery of polonium" },
      ]}
    >
      <EventEditorPage mode="create" initialForm={POLONIUM_FORM} />
    </Shell>
  ),
};

export const EditExisting: Story = {
  loaders: shellLoaders,
  render: () => (
    <Shell
      nav={NAV}
      currentPath="/events"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[
        { label: "Events", href: "/events" },
        { label: "Discovery of polonium" },
      ]}
    >
      <EventEditorPage
        mode="edit"
        initialForm={POLONIUM_FORM}
        savedAt={new Date("2026-05-27T14:34:00Z")}
      />
    </Shell>
  ),
};
