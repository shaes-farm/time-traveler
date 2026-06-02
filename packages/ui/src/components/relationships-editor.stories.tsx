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
  Plus,
  Users,
} from "lucide-react";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { useUiStore } from "@repo/ui/stores";

import { Button } from "./button";
import { Card } from "./card";
import { RelationshipCard } from "./relationship-card";
import {
  RelationshipTypeSelector,
  type RelationshipType,
} from "./relationship-type-selector";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./sheet";
import { Shell, type ShellNavItem, type ShellQuickCreateItem } from "./shell";
import { Skeleton } from "./skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Separator } from "./separator";
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

// ─── Temporal helper ──────────────────────────────────────────────────────────

const T = (
  data: Partial<TemporalData> & Pick<TemporalData, "year" | "era">,
): TemporalData => ({ precision: "exact", ...data });

// ─── Type → family group mapping ──────────────────────────────────────────────

type FamilyKey =
  | "family"
  | "professional"
  | "social"
  | "antagonistic"
  | "asymmetric";

const FAMILY_LABELS: Record<FamilyKey, string> = {
  family: "Family",
  professional: "Professional",
  social: "Social / Personal",
  antagonistic: "Antagonistic",
  asymmetric: "Asymmetric",
};

const FAMILY_ORDER: FamilyKey[] = [
  "family",
  "professional",
  "social",
  "antagonistic",
  "asymmetric",
];

const familyFor = (type: string): FamilyKey => {
  if (type === "family") return "family";
  if (type === "professional" || type === "collaboration")
    return "professional";
  // Rivalry sits with Social / Personal per the wireframe — it's
  // antagonistic in tone but still a social-standing relationship.
  if (type === "friendship" || type === "rivalry") return "social";
  if (type === "enemy") return "antagonistic";
  return "asymmetric";
};

// ─── Fixture: Marie Curie's relationships ─────────────────────────────────────

interface RelationshipFixture {
  id: string;
  otherCharacter: {
    name: string;
    slug: string;
    characterType: string;
    initials: string;
  };
  relationshipType: string;
  relationshipRole?: string | null;
  startTemporal?: TemporalData | null;
  endTemporal?: TemporalData | null;
  description?: string | null;
  directionLabel?: string;
  isReciprocal?: boolean;
  contradiction?: string;
}

const PIERRE: RelationshipFixture = {
  id: "rel-pierre-spouse",
  otherCharacter: {
    name: "Pierre Curie",
    slug: "pierre-curie",
    characterType: "human",
    initials: "PC",
  },
  relationshipType: "family",
  relationshipRole: "spouse",
  startTemporal: T({ year: 1895, era: "CE", month: 7, day: 26 }),
  endTemporal: T({ year: 1906, era: "CE", month: 4, day: 19 }),
  description:
    "Marriage; collaborated on the discovery of polonium and radium; shared the 1903 Nobel Prize.",
};

const IRENE: RelationshipFixture = {
  id: "rel-irene-parent",
  otherCharacter: {
    name: "Irène Joliot-Curie",
    slug: "irene-joliot-curie",
    characterType: "human",
    initials: "IJ",
  },
  relationshipType: "family",
  relationshipRole: "parent",
  directionLabel: "Marie is mother of Irène",
  startTemporal: T({ year: 1897, era: "CE", month: 9, day: 12 }),
  description: "Daughter; later won the 1935 Nobel Prize in Chemistry herself.",
  isReciprocal: true,
};

const EVE: RelationshipFixture = {
  id: "rel-eve-parent",
  otherCharacter: {
    name: "Ève Curie",
    slug: "eve-curie",
    characterType: "human",
    initials: "EC",
  },
  relationshipType: "family",
  relationshipRole: "parent",
  directionLabel: "Marie is mother of Ève",
  startTemporal: T({ year: 1904, era: "CE", month: 12, day: 6 }),
  description: "Daughter; journalist and biographer of her mother.",
  isReciprocal: true,
};

const FREDERIC: RelationshipFixture = {
  id: "rel-frederic-inlaw",
  otherCharacter: {
    name: "Frédéric Joliot-Curie",
    slug: "frederic-joliot-curie",
    characterType: "human",
    initials: "FJ",
  },
  relationshipType: "family",
  relationshipRole: "in_law",
  startTemporal: T({ year: 1926, era: "CE" }),
  description: "Son-in-law via Irène; co-recipient of the 1935 Nobel Prize.",
};

const BECQUEREL: RelationshipFixture = {
  id: "rel-becquerel-research",
  otherCharacter: {
    name: "Antoine Henri Becquerel",
    slug: "antoine-henri-becquerel",
    characterType: "human",
    initials: "AB",
  },
  relationshipType: "collaboration",
  relationshipRole: "research_partner",
  startTemporal: T({ year: 1896, era: "CE" }),
  endTemporal: T({ year: 1908, era: "CE" }),
  description: "Co-recipient of the 1903 Nobel Prize for radioactivity work.",
};

const SORBONNE: RelationshipFixture = {
  id: "rel-sorbonne-employer",
  otherCharacter: {
    name: "Université de Paris",
    slug: "universite-de-paris",
    characterType: "organization",
    initials: "UP",
  },
  relationshipType: "professional",
  relationshipRole: "employer",
  startTemporal: T({ year: 1906, era: "CE" }),
  endTemporal: T({ year: 1934, era: "CE" }),
  description: "First woman appointed professor at the Sorbonne.",
};

const POINCARE: RelationshipFixture = {
  id: "rel-poincare-mentor",
  otherCharacter: {
    name: "Henri Poincaré",
    slug: "henri-poincare",
    characterType: "human",
    initials: "HP",
  },
  relationshipType: "mentor_student",
  directionLabel: "Marie was mentored by Henri",
  startTemporal: T({ year: 1895, era: "CE" }),
  endTemporal: T({ year: 1903, era: "CE" }),
};

const LANGEVIN: RelationshipFixture = {
  id: "rel-langevin-rivalry",
  otherCharacter: {
    name: "Paul Langevin",
    slug: "paul-langevin",
    characterType: "human",
    initials: "PL",
  },
  relationshipType: "rivalry",
  startTemporal: T({ year: 1910, era: "CE" }),
  endTemporal: T({ year: 1911, era: "CE" }),
  description: "Public scandal following the affair and divorce proceedings.",
};

const EINSTEIN: RelationshipFixture = {
  id: "rel-einstein-friend",
  otherCharacter: {
    name: "Albert Einstein",
    slug: "albert-einstein",
    characterType: "human",
    initials: "AE",
  },
  relationshipType: "friendship",
  startTemporal: T({ year: 1909, era: "CE" }),
  endTemporal: T({ year: 1934, era: "CE" }),
  description: "Met at the 1911 Solvay Conference; long correspondence.",
};

const MARIE_RELATIONSHIPS: RelationshipFixture[] = [
  PIERRE,
  IRENE,
  EVE,
  FREDERIC,
  BECQUEREL,
  SORBONNE,
  POINCARE,
  LANGEVIN,
  EINSTEIN,
];

// Synthetic contradicting record for the WithContradiction story.
const PIERRE_AS_PARENT_CONTRADICTION: RelationshipFixture = {
  id: "rel-pierre-parent-contradiction",
  otherCharacter: PIERRE.otherCharacter,
  relationshipType: "family",
  relationshipRole: "parent",
  startTemporal: T({ year: 1895, era: "CE" }),
  contradiction:
    "Pierre Curie is also recorded as your spouse — confirm this is intentional.",
};

// Available characters for the Add sheet's "Other character" Select (excludes Marie).
const AVAILABLE_CHARACTERS = [
  { id: "pierre-curie", name: "Pierre Curie" },
  { id: "irene-joliot-curie", name: "Irène Joliot-Curie" },
  { id: "eve-curie", name: "Ève Curie" },
  { id: "frederic-joliot-curie", name: "Frédéric Joliot-Curie" },
  { id: "antoine-henri-becquerel", name: "Antoine Henri Becquerel" },
  { id: "universite-de-paris", name: "Université de Paris" },
  { id: "henri-poincare", name: "Henri Poincaré" },
  { id: "paul-langevin", name: "Paul Langevin" },
  { id: "albert-einstein", name: "Albert Einstein" },
];

// ─── Disclosure section (mirrors Batch G's pattern) ──────────────────────────

function DisclosureSection({
  legend,
  count,
  defaultOpen = true,
  emptyHint,
  children,
}: {
  legend: string;
  count: number;
  defaultOpen?: boolean;
  emptyHint: string;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 py-2 text-sm text-foreground-muted transition-colors hover:text-foreground">
        <span
          aria-hidden
          className="inline-block w-3 text-center transition-transform group-open:rotate-90"
        >
          ▸
        </span>
        <span className="font-display text-base text-foreground">{legend}</span>
        <span className="font-mono text-xs text-foreground-subtle">
          ({count})
        </span>
      </summary>
      <div className="mt-3 space-y-3 pl-5">
        {count === 0 ? (
          <p className="text-sm italic text-foreground-muted">{emptyHint}</p>
        ) : (
          children
        )}
      </div>
    </details>
  );
}

// ─── Add-relationship sheet ──────────────────────────────────────────────────

interface AddRelationshipFormState {
  otherCharacterId: string;
  type: RelationshipType;
  role: string | null;
  start: TemporalData | null;
  end: TemporalData | null;
  description: string;
}

const EMPTY_FORM: AddRelationshipFormState = {
  otherCharacterId: "",
  type: "friendship",
  role: null,
  start: null,
  end: null,
  description: "",
};

function AddRelationshipSheet({
  open,
  onOpenChange,
  initial = EMPTY_FORM,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AddRelationshipFormState;
}) {
  const [form, setForm] = React.useState<AddRelationshipFormState>(initial);

  // Reset to initial whenever the sheet transitions to open (matches the
  // TemporalInput popover pattern from Batch G).
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (next) setForm(initial);
      onOpenChange(next);
    },
    [initial, onOpenChange],
  );

  const set = <K extends keyof AddRelationshipFormState>(
    key: K,
    value: AddRelationshipFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const canSave = form.otherCharacterId !== "" && form.type !== undefined;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[min(28rem,100vw)] flex-col gap-0 overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Add relationship</SheetTitle>
          <SheetDescription>
            Add a relationship from Marie Curie&rsquo;s perspective. Reciprocal
            edges are created automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 px-6 py-4">
          <div className="space-y-1.5">
            <label
              htmlFor="add-rel-other"
              className="text-sm font-medium text-foreground"
            >
              Other character
            </label>
            <Select
              value={form.otherCharacterId || undefined}
              onValueChange={(v) => set("otherCharacterId", v)}
            >
              <SelectTrigger id="add-rel-other" aria-label="Other character">
                <SelectValue placeholder="Pick a character" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_CHARACTERS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">Relationship</p>
            <RelationshipTypeSelector
              type={form.type}
              role={form.role}
              onChange={(next) => {
                set("type", next.type);
                set("role", next.role);
              }}
            />
          </div>

          <Separator />

          <TemporalInput
            label="Start"
            value={form.start}
            onChange={(v) => set("start", v)}
          />

          <TemporalInput
            label="End"
            value={form.end}
            onChange={(v) => set("end", v)}
          />

          <div className="space-y-1.5">
            <label
              htmlFor="add-rel-description"
              className="text-sm font-medium text-foreground"
            >
              Description
            </label>
            <Textarea
              id="add-rel-description"
              rows={4}
              maxLength={500}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional — describe this relationship from Marie's perspective."
            />
          </div>
        </div>

        <SheetFooter className="px-6 pb-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!canSave}
            onClick={() => handleOpenChange(false)}
          >
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page component ──────────────────────────────────────────────────────────

interface RelationshipsEditorPageProps {
  relationships: RelationshipFixture[];
  loading?: boolean;
  initialSheetOpen?: boolean;
  initialSheetForm?: AddRelationshipFormState;
}

function RelationshipsEditorPage({
  relationships,
  loading = false,
  initialSheetOpen = false,
  initialSheetForm,
}: RelationshipsEditorPageProps) {
  const [sheetOpen, setSheetOpen] = React.useState(initialSheetOpen);

  const grouped = React.useMemo(() => {
    const buckets: Record<FamilyKey, RelationshipFixture[]> = {
      family: [],
      professional: [],
      social: [],
      antagonistic: [],
      asymmetric: [],
    };
    for (const rel of relationships) {
      buckets[familyFor(rel.relationshipType)].push(rel);
    }
    return buckets;
  }, [relationships]);

  const total = relationships.length;
  const populatedGroupCount = FAMILY_ORDER.filter(
    (k) => grouped[k].length > 0,
  ).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-end justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl text-foreground">
            Relationships
          </h1>
          <p className="text-sm text-foreground-muted">
            {total === 0
              ? "No relationships yet — start by adding one."
              : `${total} relationship${total === 1 ? "" : "s"} across ${populatedGroupCount} categor${populatedGroupCount === 1 ? "y" : "ies"}.`}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          className="gap-1.5"
          onClick={() => setSheetOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add relationship
        </Button>
      </header>

      {loading ? (
        <div className="space-y-6">
          {FAMILY_ORDER.map((key) => (
            <div key={key} className="space-y-3">
              <div className="flex items-center gap-2 py-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-6" />
              </div>
              <div className="space-y-3 pl-5">
                <Card className="space-y-3 p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {FAMILY_ORDER.map((key) => (
            <DisclosureSection
              key={key}
              legend={FAMILY_LABELS[key]}
              count={grouped[key].length}
              emptyHint="No relationships in this category."
            >
              {grouped[key].map((rel) => (
                <RelationshipCard
                  key={rel.id}
                  otherCharacter={rel.otherCharacter}
                  relationshipType={rel.relationshipType}
                  relationshipRole={rel.relationshipRole}
                  startTemporal={rel.startTemporal}
                  endTemporal={rel.endTemporal}
                  description={rel.description}
                  directionLabel={rel.directionLabel}
                  isReciprocal={rel.isReciprocal}
                  contradiction={rel.contradiction}
                  onEdit={() => {}}
                  onDuplicate={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </DisclosureSection>
          ))}
        </div>
      )}

      <AddRelationshipSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initial={initialSheetForm ?? EMPTY_FORM}
      />
    </div>
  );
}

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: "Pages/Relationships Editor",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const breadcrumbs = [
  { label: "Characters", href: "/characters" },
  { label: "Marie Curie", href: "/characters/marie-curie" },
  { label: "Relationships" },
];

function ShellWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Shell
      nav={NAV}
      currentPath="/characters/marie-curie/relationships"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={breadcrumbs}
    >
      {children}
    </Shell>
  );
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  loaders: shellLoaders,
  render: () => (
    <ShellWrapper>
      <RelationshipsEditorPage relationships={MARIE_RELATIONSHIPS} />
    </ShellWrapper>
  ),
};

export const WithContradiction: Story = {
  loaders: shellLoaders,
  render: () => (
    <ShellWrapper>
      <RelationshipsEditorPage
        relationships={[...MARIE_RELATIONSHIPS, PIERRE_AS_PARENT_CONTRADICTION]}
      />
    </ShellWrapper>
  ),
};

export const Empty: Story = {
  loaders: shellLoaders,
  render: () => (
    <ShellWrapper>
      <RelationshipsEditorPage relationships={[]} />
    </ShellWrapper>
  ),
};

export const AddSheetOpen: Story = {
  loaders: shellLoaders,
  render: () => (
    <ShellWrapper>
      <RelationshipsEditorPage
        relationships={MARIE_RELATIONSHIPS}
        initialSheetOpen
        initialSheetForm={{
          otherCharacterId: "",
          type: "family",
          role: "spouse",
          start: null,
          end: null,
          description: "",
        }}
      />
    </ShellWrapper>
  ),
};

export const Loading: Story = {
  loaders: shellLoaders,
  render: () => (
    <ShellWrapper>
      <RelationshipsEditorPage relationships={[]} loading />
    </ShellWrapper>
  ),
};
