import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BookOpen,
  Calendar,
  Clock,
  Edit,
  FolderTree,
  GitBranch,
  Image as ImageIcon,
  LayoutDashboard,
  MoreHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import type { TemporalData } from "@repo/services/schemas/temporal.js";
import { useUiStore } from "@repo/ui/stores";
import { Avatar, AvatarFallback } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";
import { Separator } from "./separator";
import { Skeleton } from "./skeleton";
import { StatusBadge } from "./status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { TemporalDisplay } from "./temporal-display";
import { Shell, type ShellNavItem, type ShellQuickCreateItem } from "./shell";

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

// ─── Character fixture data ───────────────────────────────────────────────────

const T = (
  data: Partial<TemporalData> & Pick<TemporalData, "year" | "era">,
): TemporalData => ({ precision: "exact", ...data });

interface CharacterFixture {
  name: string;
  slug: string;
  characterType: string;
  significance: string;
  status: "published" | "draft" | "shared";
  birth: TemporalData | null;
  death: TemporalData | null;
  /** Year-only versions for the compact header span. */
  birthSpan: TemporalData | null;
  deathSpan: TemporalData | null;
  lifespan: string | null;
  aliases: string[];
  culturalContext: string[];
  biography: string | null;
  physicalDescription: string | null;
  createdAt: string;
  updatedAt: string;
  eventCount: number;
  relationshipCount: number;
  mediaCount: number;
}

const MARIE_CURIE: CharacterFixture = {
  name: "Marie Curie",
  slug: "marie-curie",
  characterType: "Human",
  significance: "Critical significance",
  status: "published",
  birth: T({ year: 1867, era: "CE", month: 11, day: 7, precision: "exact" }),
  death: T({ year: 1934, era: "CE", month: 7, day: 4, precision: "exact" }),
  birthSpan: T({ year: 1867, era: "CE", precision: "exact" }),
  deathSpan: T({ year: 1934, era: "CE", precision: "exact" }),
  lifespan: "Lived 66 years.",
  aliases: ["Maria Skłodowska", "Madame Curie"],
  culturalContext: ["Polish", "French"],
  biography:
    "Polish-French physicist and chemist. Pioneer of radioactivity research. " +
    "First woman to win a Nobel Prize, first person to win in two scientific " +
    "fields. Discovered polonium and radium with her husband Pierre Curie.",
  physicalDescription:
    "Dark hair, gray eyes, slight build. Often photographed with laboratory glassware.",
  createdAt: "2026-04-12",
  updatedAt: "2026-05-21",
  eventCount: 12,
  relationshipCount: 4,
  mediaCount: 3,
};

const HOMO_SAPIENS_IDALTU: CharacterFixture = {
  name: "Homo sapiens idaltu",
  slug: "homo-sapiens-idaltu",
  characterType: "Human",
  significance: "High significance",
  status: "draft",
  birth: T({
    year: 160,
    era: "KYA",
    precision: "approximate",
    uncertainty: 10_000,
  }),
  death: null,
  birthSpan: T({
    year: 160,
    era: "KYA",
    precision: "approximate",
    uncertainty: 10_000,
  }),
  deathSpan: null,
  lifespan: null,
  aliases: ["Herto Man"],
  culturalContext: ["Prehistoric Africa"],
  biography: null,
  physicalDescription: null,
  createdAt: "2026-04-20",
  updatedAt: "2026-05-10",
  eventCount: 2,
  relationshipCount: 0,
  mediaCount: 0,
};

// ─── Store reset ──────────────────────────────────────────────────────────────

const resetShellUiState = () => {
  useUiStore.setState({
    sidebarOpen: true,
    sidebarWidth: 280,
    activeModal: null,
    modalData: {},
    toasts: [],
  });
};

const shellLoaders = [
  async () => {
    resetShellUiState();
    return {};
  },
];

// ─── Layout primitives ────────────────────────────────────────────────────────

const SectionHeading = ({ children }: { children: ReactNode }) => (
  <div>
    <h2 className="font-display text-sm font-normal text-foreground">
      {children}
    </h2>
    <Separator className="mt-1.5" />
  </div>
);

const TAB_TRIGGER_CLASS =
  "rounded-none border-b-2 border-transparent px-4 pb-3 pt-0.5 text-sm font-medium text-foreground-muted transition-colors data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

// ─── Character identity header ────────────────────────────────────────────────

const CharacterHeader = ({ character }: { character: CharacterFixture }) => {
  const initials = character.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex items-start gap-5">
        {/* Photo + replace button */}
        <div className="flex flex-col items-center gap-1.5">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-base">{initials}</AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-0.5 text-xs text-foreground-muted"
          >
            Replace
          </Button>
        </div>

        {/* Identity */}
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl leading-tight text-foreground">
            {character.name}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {character.characterType}
            </Badge>
            <span className="text-sm text-foreground-muted">
              {character.significance}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-foreground-muted">
            <span>{character.slug}</span>
            {character.birthSpan && (
              <>
                <span aria-hidden>·</span>
                <TemporalDisplay
                  value={character.birthSpan}
                  endValue={character.deathSpan ?? undefined}
                  format="compact"
                />
              </>
            )}
          </div>
          {character.aliases.length > 0 && (
            <p className="text-sm text-foreground-muted">
              Also known as:{" "}
              <span className="text-foreground">
                {character.aliases.join(", ")}
              </span>
            </p>
          )}
          {character.culturalContext.length > 0 && (
            <p className="text-sm text-foreground-muted">
              {character.culturalContext.join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="secondary" size="sm" className="gap-1.5">
          <Edit className="h-3.5 w-3.5" aria-hidden />
          Edit
        </Button>
        <StatusBadge status={character.status} />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="More actions"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
};

// ─── Overview tab ─────────────────────────────────────────────────────────────

const OverviewTab = ({ character }: { character: CharacterFixture }) => (
  <div className="space-y-8">
    <section className="space-y-3">
      <SectionHeading>Biography</SectionHeading>
      {character.biography ? (
        <p className="text-sm leading-relaxed text-foreground">
          {character.biography}
        </p>
      ) : (
        <p className="text-sm text-foreground-muted">
          No biography.{" "}
          <button
            type="button"
            className="text-foreground underline underline-offset-2"
          >
            Add biography
          </button>
        </p>
      )}
    </section>

    <section className="space-y-3">
      <SectionHeading>Physical description</SectionHeading>
      {character.physicalDescription ? (
        <p className="text-sm leading-relaxed text-foreground">
          {character.physicalDescription}
        </p>
      ) : (
        <p className="text-sm text-foreground-muted">
          No description.{" "}
          <button
            type="button"
            className="text-foreground underline underline-offset-2"
          >
            Add physical description
          </button>
        </p>
      )}
    </section>

    <section className="space-y-3">
      <SectionHeading>Temporal scope</SectionHeading>
      <dl className="space-y-3">
        {character.birth ? (
          <div className="flex items-start gap-6">
            <dt className="w-10 shrink-0 pt-0.5 text-sm text-foreground-muted">
              Birth
            </dt>
            <dd>
              <TemporalDisplay
                value={character.birth}
                format="block"
                showExact
              />
            </dd>
          </div>
        ) : (
          <div className="flex items-start gap-6">
            <dt className="w-10 shrink-0 pt-0.5 text-sm text-foreground-muted">
              Birth
            </dt>
            <dd className="text-sm text-foreground-muted">—</dd>
          </div>
        )}
        {character.death ? (
          <div className="flex items-start gap-6">
            <dt className="w-10 shrink-0 pt-0.5 text-sm text-foreground-muted">
              Death
            </dt>
            <dd>
              <TemporalDisplay
                value={character.death}
                format="block"
                showExact
              />
            </dd>
          </div>
        ) : (
          <div className="flex items-start gap-6">
            <dt className="w-10 shrink-0 pt-0.5 text-sm text-foreground-muted">
              Death
            </dt>
            <dd className="text-sm text-foreground-muted">—</dd>
          </div>
        )}
        {character.lifespan && (
          <p className="text-sm text-foreground-muted">{character.lifespan}</p>
        )}
      </dl>
    </section>

    <section className="space-y-3">
      <SectionHeading>Metadata</SectionHeading>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-subtle">
        <span>
          Created{" "}
          <time dateTime={character.createdAt}>{character.createdAt}</time>
        </span>
        <span aria-hidden>·</span>
        <span>
          Updated{" "}
          <time dateTime={character.updatedAt}>{character.updatedAt}</time>
        </span>
        <span aria-hidden>·</span>
        <span>
          Slug{" "}
          <code className="font-mono text-foreground-muted">
            {character.slug}
          </code>
        </span>
      </div>
    </section>
  </div>
);

// ─── Stub tab content (Events / Relationships / Media land in later batches) ──

const StubTabContent = ({ label }: { label: string }) => (
  <p className="text-sm text-foreground-muted">
    {label} — lands in a later batch.
  </p>
);

// ─── Danger zone ──────────────────────────────────────────────────────────────

const DangerZone = ({ name }: { name: string }) => (
  <details className="rounded-md border border-destructive/20">
    <summary className="cursor-pointer px-4 py-3 text-sm text-foreground-muted">
      Danger zone
    </summary>
    <div className="border-t border-destructive/20 px-4 py-4">
      <p className="mb-3 text-xs text-foreground-muted">
        Permanently delete <strong className="text-foreground">{name}</strong>{" "}
        and all associated data. This action cannot be undone.
      </p>
      {/*
       * DECISION NEEDED: Button needs a `destructive` variant. Using inline
       * className override here — add the variant to button.tsx in Batch G
       * when editor primitives are built (it will be needed for delete confirms).
       */}
      <Button
        variant="primary"
        size="sm"
        className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Delete character
      </Button>
    </div>
  </details>
);

// ─── Full page layout ─────────────────────────────────────────────────────────

const CharacterDetailPage = ({
  character,
}: {
  character: CharacterFixture;
}) => (
  <div className="mx-auto max-w-5xl space-y-8 p-6">
    <CharacterHeader character={character} />

    <Tabs defaultValue="overview">
      <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
        <TabsTrigger value="overview" className={TAB_TRIGGER_CLASS}>
          Overview
        </TabsTrigger>
        <TabsTrigger value="events" className={TAB_TRIGGER_CLASS}>
          {`Events (${character.eventCount})`}
        </TabsTrigger>
        <TabsTrigger value="relationships" className={TAB_TRIGGER_CLASS}>
          {`Relationships (${character.relationshipCount})`}
        </TabsTrigger>
        <TabsTrigger value="media" className={TAB_TRIGGER_CLASS}>
          Media
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-8">
        <OverviewTab character={character} />
      </TabsContent>
      <TabsContent value="events" className="mt-8">
        <StubTabContent label="Events list" />
      </TabsContent>
      <TabsContent value="relationships" className="mt-8">
        <StubTabContent label="Relationships editor" />
      </TabsContent>
      <TabsContent value="media" className="mt-8">
        <StubTabContent label="Media grid" />
      </TabsContent>
    </Tabs>

    <DangerZone name={character.name} />
  </div>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const CharacterDetailLoading = () => (
  <div className="mx-auto max-w-5xl space-y-8 p-6">
    <div className="flex items-start justify-between gap-6">
      <div className="flex items-start gap-5">
        <div className="flex flex-col items-center gap-1.5">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="space-y-2 pt-1">
          <Skeleton className="h-7 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>

    <div className="flex gap-4 border-b border-border pb-0">
      {["Overview", "Events (12)", "Relationships (4)", "Media"].map(
        (label) => (
          <Skeleton key={label} className="mb-3 h-4 w-20" />
        ),
      )}
    </div>

    <div className="space-y-8">
      {["Biography", "Physical description", "Temporal scope"].map(
        (section) => (
          <div key={section} className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Separator />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          </div>
        ),
      )}
    </div>
  </div>
);

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: "Pages/Character Detail",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Overview: Story = {
  loaders: shellLoaders,
  render: () => (
    <Shell
      nav={NAV}
      currentPath="/characters/marie-curie"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[
        { label: "Characters", href: "/characters" },
        { label: "Marie Curie" },
      ]}
    >
      <CharacterDetailPage character={MARIE_CURIE} />
    </Shell>
  ),
};

export const Loading: Story = {
  loaders: shellLoaders,
  render: () => (
    <Shell
      nav={NAV}
      currentPath="/characters"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[
        { label: "Characters", href: "/characters" },
        { label: "Loading…" },
      ]}
    >
      <CharacterDetailLoading />
    </Shell>
  ),
};

export const PrehistoricCharacter: Story = {
  loaders: shellLoaders,
  render: () => (
    <Shell
      nav={NAV}
      currentPath="/characters/homo-sapiens-idaltu"
      user={SHELL_USER}
      quickCreateItems={QUICK_CREATE}
      breadcrumbs={[
        { label: "Characters", href: "/characters" },
        { label: "Homo sapiens idaltu" },
      ]}
    >
      <CharacterDetailPage character={HOMO_SAPIENS_IDALTU} />
    </Shell>
  ),
};
