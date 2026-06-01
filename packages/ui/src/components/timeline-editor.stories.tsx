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
  Users,
} from "lucide-react";
import type { TemporalData } from "@repo/services/schemas/temporal.js";
import { useUiStore } from "@repo/ui/stores";
import { AutosaveIndicator } from "./autosave-indicator";
import { Button } from "./button";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { SaveDropdown } from "./save-dropdown";
import { Separator } from "./separator";
import { Shell, type ShellNavItem, type ShellQuickCreateItem } from "./shell";
import { SlugField } from "./slug-field";
import { Switch } from "./switch";
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

type TimelineType = "general" | "biographical" | "comparative";
type Visibility = "private" | "public" | "shared";

interface TimelineFormState {
  title: string;
  slug: string;
  timelineType: TimelineType;
  summary: string;
  detail: string;
  scale: string;
  subjectCharacter: string;
  startDate: TemporalData | null;
  endDate: TemporalData | null;
  visibility: Visibility;
  published: boolean;
  fractalDepth: number;
}

const BLANK_FORM: TimelineFormState = {
  title: "",
  slug: "",
  timelineType: "general",
  summary: "",
  detail: "",
  scale: "",
  subjectCharacter: "",
  startDate: null,
  endDate: null,
  visibility: "private",
  published: false,
  fractalDepth: 5,
};

const CURIE_FORM: TimelineFormState = {
  title: "Curie scientific biography",
  slug: "curie-scientific-biography",
  timelineType: "biographical",
  summary:
    "The scientific life of Marie Curie, from her arrival in Paris through her two Nobel Prizes to her death from aplastic anemia.",
  detail:
    "A biographical timeline tracing Marie Curie's research career, collaborations, and recognition across the late 19th and early 20th centuries.",
  scale: "a single lifetime",
  subjectCharacter: "Marie Curie",
  startDate: { year: 1867, era: "CE", precision: "exact" },
  endDate: { year: 1934, era: "CE", precision: "exact" },
  visibility: "public",
  published: true,
  fractalDepth: 5,
};

// ─── Layout primitives (match the event editor) ────────────────────────────────

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

const TYPE_OPTIONS: { value: TimelineType; label: string }[] = [
  { value: "general", label: "General" },
  { value: "biographical", label: "Biographical" },
  { value: "comparative", label: "Comparative" },
];

const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  hint: string;
}[] = [
  { value: "private", label: "Private", hint: "Only you can see this." },
  { value: "public", label: "Public", hint: "Anyone with the link." },
  { value: "shared", label: "Shared", hint: "Named collaborators only." },
];

// ─── Page component ─────────────────────────────────────────────────────────────

interface TimelineEditorPageProps {
  mode: "create" | "edit";
  initialForm: TimelineFormState;
  savedAt?: Date | null;
}

function TimelineEditorPage({
  mode,
  initialForm,
  savedAt = null,
}: TimelineEditorPageProps) {
  const [form, setForm] = React.useState<TimelineFormState>(initialForm);
  const [autosaveAt, setAutosaveAt] = React.useState<Date | null>(savedAt);
  const [autosaving, setAutosaving] = React.useState(false);

  const set = <K extends keyof TimelineFormState>(
    key: K,
    value: TimelineFormState[K],
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
      ? [{ label: "Timelines", href: "/timelines" }, { label: "New timeline" }]
      : [
          { label: "Timelines", href: "/timelines" },
          { label: form.title || "Edit timeline" },
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
              <div>
                <Label htmlFor="timeline-title" className={LABEL_CLASS}>
                  Title{" "}
                  <span aria-label="required" className="text-destructive">
                    *
                  </span>
                </Label>
                <input
                  id="timeline-title"
                  className={INPUT_CLASS}
                  value={form.title}
                  onChange={(e) => {
                    set("title", e.target.value);
                  }}
                  placeholder="Timeline title"
                />
              </div>

              <div>
                <Label htmlFor="timeline-type" className={LABEL_CLASS}>
                  Type{" "}
                  <span aria-label="required" className="text-destructive">
                    *
                  </span>
                </Label>
                <select
                  id="timeline-type"
                  className={SELECT_CLASS}
                  value={form.timelineType}
                  onChange={(e) => {
                    set("timelineType", e.target.value as TimelineType);
                  }}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject character — only for biographical timelines */}
              {form.timelineType === "biographical" && (
                <div>
                  <Label htmlFor="timeline-subject" className={LABEL_CLASS}>
                    Subject character{" "}
                    <span aria-label="required" className="text-destructive">
                      *
                    </span>
                  </Label>
                  <input
                    id="timeline-subject"
                    className={INPUT_CLASS}
                    value={form.subjectCharacter}
                    onChange={(e) => {
                      set("subjectCharacter", e.target.value);
                    }}
                    placeholder="Search for a character…"
                  />
                  <p className="mt-1 text-xs text-foreground-muted">
                    Biographical timelines are about one character.
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="timeline-summary" className={LABEL_CLASS}>
                  Summary
                </Label>
                <Textarea
                  id="timeline-summary"
                  value={form.summary}
                  onChange={(e) => {
                    set("summary", e.target.value);
                  }}
                  placeholder="One-paragraph summary…"
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="timeline-detail" className={LABEL_CLASS}>
                  Detail
                </Label>
                <Textarea
                  id="timeline-detail"
                  value={form.detail}
                  onChange={(e) => {
                    set("detail", e.target.value);
                  }}
                  placeholder="Long-form description…"
                  className="min-h-[140px]"
                />
              </div>
            </div>
          </section>

          {/* Span section */}
          <section>
            <SectionHeading>Span</SectionHeading>
            <div className="space-y-4">
              <TemporalInput
                label="Start"
                value={form.startDate}
                onChange={(v) => {
                  set("startDate", v);
                }}
              />
              <TemporalInput
                label="End"
                value={form.endDate}
                onChange={(v) => {
                  set("endDate", v);
                }}
              />
              <div>
                <Label htmlFor="timeline-scale" className={LABEL_CLASS}>
                  Scale
                </Label>
                <input
                  id="timeline-scale"
                  className={INPUT_CLASS}
                  value={form.scale}
                  onChange={(e) => {
                    set("scale", e.target.value);
                  }}
                  placeholder="e.g. a single lifetime, an epoch…"
                />
                <p className="mt-1 text-xs text-foreground-muted">
                  Free-text label describing the temporal grain.
                </p>
              </div>
            </div>
          </section>

          {/* Advanced disclosure */}
          <section>
            <details>
              <summary className="cursor-pointer select-none text-sm text-foreground-muted hover:text-foreground">
                ▸ Advanced (fractal depth, metadata)
              </summary>
              <div className="mt-3 space-y-4 rounded-md border border-border bg-surface/30 px-4 py-3">
                <div>
                  <Label htmlFor="timeline-depth" className={LABEL_CLASS}>
                    Fractal depth
                  </Label>
                  <input
                    id="timeline-depth"
                    type="number"
                    min={1}
                    max={10}
                    className={`${INPUT_CLASS} max-w-[120px]`}
                    value={form.fractalDepth}
                    onChange={(e) => {
                      set("fractalDepth", Number(e.target.value));
                    }}
                  />
                  <p className="mt-1 text-xs text-foreground-muted">
                    How many zoom levels this timeline supports (default 5).
                  </p>
                </div>
                <p className="text-xs text-foreground-muted">
                  JSON editor for <code>metadata</code> — power-user only.
                </p>
              </div>
            </details>
          </section>
        </div>

        {/* Right column ── metadata rail */}
        <aside className="w-72 shrink-0 space-y-6 border-l border-border px-5 py-6">
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
                  ? "Changing the slug will break existing links to this timeline."
                  : undefined
              }
              description="Auto-generated from title."
            />
          </div>

          {/* Visibility — orthogonal to publication */}
          <div>
            <Label className={LABEL_CLASS}>Visibility</Label>
            <RadioGroup
              value={form.visibility}
              onValueChange={(v) => {
                set("visibility", v as Visibility);
              }}
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`vis-${opt.value}`}
                  className="flex cursor-pointer items-start gap-2.5"
                >
                  <RadioGroupItem
                    id={`vis-${opt.value}`}
                    value={opt.value}
                    className="mt-0.5"
                  />
                  <span className="flex flex-col">
                    <span className="text-sm text-foreground">{opt.label}</span>
                    <span className="text-xs text-foreground-muted">
                      {opt.hint}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Publication — separate control, never merged with visibility */}
          <div>
            <Label className={LABEL_CLASS}>Publication</Label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
              <Switch
                checked={form.published}
                onCheckedChange={(v) => {
                  set("published", v);
                }}
              />
              <span>
                {form.published ? "Published" : "Draft — publish on save"}
              </span>
            </label>
            <p className="mt-1.5 text-xs text-foreground-muted">
              Independent of visibility. Publishing is also available from the
              timeline detail page.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Store reset ────────────────────────────────────────────────────────────────

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

// ─── Meta ───────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: "Pages/Timeline Editor",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const CreateNew: Story = {
  loaders: shellLoaders,
  render: () => (
    <Shell
      nav={NAV}
      currentPath="/timelines"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[
        { label: "Timelines", href: "/timelines" },
        { label: "New timeline" },
      ]}
    >
      <TimelineEditorPage mode="create" initialForm={BLANK_FORM} />
    </Shell>
  ),
};

export const EditBiographical: Story = {
  loaders: shellLoaders,
  render: () => (
    <Shell
      nav={NAV}
      currentPath="/timelines"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[
        { label: "Timelines", href: "/timelines" },
        { label: "Curie scientific biography" },
      ]}
    >
      <TimelineEditorPage
        mode="edit"
        initialForm={CURIE_FORM}
        savedAt={new Date("2026-05-28T14:34:00Z")}
      />
    </Shell>
  ),
};
