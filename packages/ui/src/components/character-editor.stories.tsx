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
  UploadCloud,
  Users,
} from "lucide-react";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { useUiStore } from "@repo/ui/stores";
import { AutosaveIndicator } from "./autosave-indicator";
import { Button } from "./button";
import { ChipInput } from "./chip-input";
import { Label } from "./label";
import { SaveDropdown } from "./save-dropdown";
import { Separator } from "./separator";
import { Shell, type ShellNavItem, type ShellQuickCreateItem } from "./shell";
import { SlugField } from "./slug-field";
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

type CharacterType =
  | "human"
  | "animal"
  | "mythological"
  | "fictional"
  | "organization"
  | "divine"
  | "artifact";

type Significance = "low" | "medium" | "high" | "critical";

interface CharacterFormState {
  name: string;
  characterType: CharacterType;
  slug: string;
  aliases: string[];
  culturalContext: string[];
  biography: string;
  physicalDescription: string;
  birthDate: TemporalData | null;
  deathDate: TemporalData | null;
  significance: Significance;
  published: boolean;
}

const BLANK_FORM: CharacterFormState = {
  name: "",
  characterType: "human",
  slug: "",
  aliases: [],
  culturalContext: [],
  biography: "",
  physicalDescription: "",
  birthDate: null,
  deathDate: null,
  significance: "medium",
  published: false,
};

const MARIE_CURIE_FORM: CharacterFormState = {
  name: "Marie Curie",
  characterType: "human",
  slug: "marie-curie",
  aliases: ["Maria Skłodowska", "Madame Curie"],
  culturalContext: ["Polish", "French"],
  biography:
    "Polish-French physicist and chemist. Pioneer of radioactivity research. " +
    "First woman to win a Nobel Prize, first person to win in two scientific fields.",
  physicalDescription: "Dark hair, gray eyes, slight build.",
  birthDate: {
    year: 1867,
    era: "CE",
    precision: "exact",
    month: 11,
    day: 7,
  },
  deathDate: {
    year: 1934,
    era: "CE",
    precision: "exact",
    month: 7,
    day: 4,
  },
  significance: "critical",
  published: true,
};

// ─── Layout primitives ────────────────────────────────────────────────────────

const SECTION_HEADING_CLASS =
  "mb-1.5 font-display text-sm font-normal text-foreground";
const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-foreground";
const INPUT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const RADIO_LABEL_CLASS =
  "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground has-[:checked]:bg-surface has-[:checked]:text-foreground";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className={SECTION_HEADING_CLASS}>{children}</h2>
      <Separator />
    </div>
  );
}

// ─── Character type radio grid ────────────────────────────────────────────────

const CHARACTER_TYPES: { value: CharacterType; label: string }[] = [
  { value: "human", label: "Human" },
  { value: "animal", label: "Animal" },
  { value: "mythological", label: "Mythological" },
  { value: "fictional", label: "Fictional" },
  { value: "organization", label: "Organization" },
  { value: "divine", label: "Divine" },
  { value: "artifact", label: "Artifact" },
];

function CharacterTypeRadio({
  value,
  onChange,
}: {
  value: CharacterType;
  onChange: (v: CharacterType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-0.5">
      {CHARACTER_TYPES.map((t) => (
        <label key={t.value} className={RADIO_LABEL_CLASS}>
          <input
            type="radio"
            name="character-type"
            value={t.value}
            checked={value === t.value}
            onChange={() => {
              onChange(t.value);
            }}
            className="accent-primary h-3.5 w-3.5 shrink-0"
          />
          <span>{t.label}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Significance radio group ─────────────────────────────────────────────────

const SIGNIFICANCE_OPTIONS: { value: Significance; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

function SignificanceRadio({
  value,
  onChange,
}: {
  value: Significance;
  onChange: (v: Significance) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-0.5">
      {SIGNIFICANCE_OPTIONS.map((s) => (
        <label key={s.value} className={RADIO_LABEL_CLASS}>
          <input
            type="radio"
            name="significance"
            value={s.value}
            checked={value === s.value}
            onChange={() => {
              onChange(s.value);
            }}
            className="accent-primary h-3.5 w-3.5 shrink-0"
          />
          <span>{s.label}</span>
        </label>
      ))}
    </div>
  );
}

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

// ─── Main page component ──────────────────────────────────────────────────────

interface CharacterEditorPageProps {
  mode: "create" | "edit";
  initialForm: CharacterFormState;
  isSaving?: boolean;
  savedAt?: Date | null;
}

function CharacterEditorPage({
  mode,
  initialForm,
  isSaving = false,
  savedAt = null,
}: CharacterEditorPageProps) {
  const [form, setForm] = React.useState<CharacterFormState>(initialForm);
  const [autosaveAt, setAutosaveAt] = React.useState<Date | null>(savedAt);
  const [autosaving, setAutosaving] = React.useState(isSaving);

  const set = <K extends keyof CharacterFormState>(
    key: K,
    value: CharacterFormState[K],
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

  const breadcrumbs =
    mode === "create"
      ? [
          { label: "Characters", href: "/characters" },
          { label: "New character" },
        ]
      : [
          { label: "Characters", href: "/characters" },
          { label: form.name || "Edit character" },
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
              {/* Name */}
              <div>
                <Label htmlFor="char-name" className={LABEL_CLASS}>
                  Name{" "}
                  <span aria-label="required" className="text-destructive">
                    *
                  </span>
                </Label>
                <input
                  id="char-name"
                  className={INPUT_CLASS}
                  value={form.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                  }}
                  placeholder="Character name"
                />
              </div>

              {/* Character type */}
              <div>
                <Label className={LABEL_CLASS}>
                  Character type{" "}
                  <span aria-label="required" className="text-destructive">
                    *
                  </span>
                </Label>
                <CharacterTypeRadio
                  value={form.characterType}
                  onChange={(v) => {
                    set("characterType", v);
                  }}
                />
              </div>

              {/* Aliases */}
              <div>
                <ChipInput
                  label="Aliases"
                  value={form.aliases}
                  onChange={(v) => {
                    set("aliases", v);
                  }}
                  placeholder="Add alias"
                  description="Press Enter or comma to add. Backspace removes the last alias."
                />
              </div>

              {/* Cultural context */}
              <div>
                <ChipInput
                  label="Cultural context"
                  value={form.culturalContext}
                  onChange={(v) => {
                    set("culturalContext", v);
                  }}
                  placeholder="Add context"
                />
              </div>

              {/* Biography */}
              <div>
                <Label htmlFor="char-bio" className={LABEL_CLASS}>
                  Biography
                </Label>
                <Textarea
                  id="char-bio"
                  value={form.biography}
                  onChange={(e) => {
                    set("biography", e.target.value);
                  }}
                  placeholder="Write a biography…"
                  className="min-h-[120px]"
                />
              </div>

              {/* Physical description */}
              <div>
                <Label htmlFor="char-physical" className={LABEL_CLASS}>
                  Physical description
                </Label>
                <Textarea
                  id="char-physical"
                  value={form.physicalDescription}
                  onChange={(e) => {
                    set("physicalDescription", e.target.value);
                  }}
                  placeholder="Describe physical appearance…"
                />
              </div>
            </div>
          </section>

          {/* Temporal scope section */}
          <section>
            <SectionHeading>Temporal scope</SectionHeading>
            <div className="space-y-4">
              <TemporalInput
                label="Birth date"
                value={form.birthDate}
                onChange={(v) => {
                  set("birthDate", v);
                }}
              />
              <TemporalInput
                label="Death date"
                value={form.deathDate}
                onChange={(v) => {
                  set("deathDate", v);
                }}
              />
            </div>
          </section>

          {/* Profile media section */}
          <section>
            <SectionHeading>Profile media</SectionHeading>
            <div className="flex h-28 items-center justify-center rounded-md border border-dashed border-border bg-surface/50 text-sm text-foreground-muted">
              <div className="flex flex-col items-center gap-2">
                <UploadCloud className="h-5 w-5 opacity-50" aria-hidden />
                <span>Drop image or click to upload</span>
              </div>
            </div>
          </section>

          {/* Advanced (collapsed disclosure) */}
          <section>
            <details>
              <summary className="cursor-pointer select-none text-sm text-foreground-muted hover:text-foreground">
                ▸ Advanced (profile_data, metadata)
              </summary>
              <div className="mt-3 rounded-md border border-border bg-surface/30 px-4 py-3 text-xs text-foreground-muted">
                JSON editor for <code>profile_data</code> and{" "}
                <code>metadata</code> — power-user only.
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
              sourceValue={form.name}
              mode={mode}
              warning={
                mode === "edit"
                  ? "Changing the slug will break existing links to this character."
                  : undefined
              }
              description="Auto-generated from name."
            />
          </div>

          {/* Significance */}
          <div>
            <Label className={LABEL_CLASS}>Significance</Label>
            <SignificanceRadio
              value={form.significance}
              onChange={(v) => {
                set("significance", v);
              }}
            />
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
  title: "Pages/Character Editor",
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
      currentPath="/characters"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[
        { label: "Characters", href: "/characters" },
        { label: "New character" },
      ]}
    >
      <CharacterEditorPage mode="create" initialForm={BLANK_FORM} />
    </Shell>
  ),
};

export const EditExisting: Story = {
  loaders: shellLoaders,
  render: () => (
    <Shell
      nav={NAV}
      currentPath="/characters"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[
        { label: "Characters", href: "/characters" },
        { label: "Marie Curie" },
      ]}
    >
      <CharacterEditorPage
        mode="edit"
        initialForm={MARIE_CURIE_FORM}
        savedAt={new Date("2026-05-27T14:34:00Z")}
      />
    </Shell>
  ),
};

export const AutosaveInProgress: Story = {
  loaders: shellLoaders,
  render: () => (
    <Shell
      nav={NAV}
      currentPath="/characters"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[
        { label: "Characters", href: "/characters" },
        { label: "Marie Curie" },
      ]}
    >
      <CharacterEditorPage
        mode="edit"
        initialForm={MARIE_CURIE_FORM}
        isSaving
      />
    </Shell>
  ),
};
