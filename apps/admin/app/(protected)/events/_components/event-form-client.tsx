"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, ExternalLink, X } from "lucide-react";
import { useForm, useWatch, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { eventSchema, eventTypeEnum } from "@repo/services/schemas/event";
import type { EventInput } from "@repo/services/schemas/event";
import type {
  CreateEventInput,
  EventWithRelations,
} from "@repo/services/event-service";
import {
  temporalDataSchema,
  compareTemporal,
} from "@repo/services/schemas/temporal";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { generateSlug } from "@repo/services/utils/slug";

import {
  useEventBySlug,
  useCreateEvent,
  useUpdateEvent,
} from "@repo/ui/hooks/use-events";
import {
  useTimelines,
  useCreateTimeline,
  useAddEventToTimeline,
  useRemoveEventFromTimeline,
  useEventTimelineLinks,
} from "@repo/ui/hooks/use-timelines";
import { useUiStore } from "@repo/ui/stores";

import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Label } from "@repo/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { Separator } from "@repo/ui/components/separator";
import { SaveDropdown } from "@repo/ui/components/save-dropdown";
import { SlugField } from "@repo/ui/components/slug-field";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Slider } from "@repo/ui/components/slider";
import { TemporalInput } from "@repo/ui/components/temporal-input";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/utils";

import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";
// The unsaved-changes guard is feature-agnostic; reuse the timeline editor's.
import { useUnsavedChangesGuard } from "../../timelines/_components/use-unsaved-changes-guard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventType = z.infer<typeof eventTypeEnum>;

/**
 * The form's working value type. Uses the schema's snake_case field names so
 * `zodResolver` validates directly. Two shape differences from the persisted
 * `eventSchema`:
 *  - `temporal_data` is nullable here (the empty UI state); the required check
 *    lives in `eventFormSchema` below for a clean message.
 *  - `spatial_data` (a lat/lng JSONB blob) is split into two scalar
 *    `latitude`/`longitude` inputs and recombined on persist.
 *  - `appears_in` holds the "also appears in" timeline ids (the `timeline_events`
 *    junction), reconciled separately from the event row write.
 *
 * Publication is intentionally NOT editable here, mirroring the timeline editor:
 * the editor only writes draft content. Publish/unpublish is a separate control
 * (event detail + the publish workflow, #48).
 */
export interface EventFormValues {
  title: string;
  slug: string;
  summary: string;
  detail: string;
  event_type: EventType;
  importance: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  temporal_data: TemporalData | null;
  end_temporal_data: TemporalData | null;
  timeline_id: string | undefined;
  appears_in: string[];
  detail_timeline_id: string | undefined;
  metadata: Record<string, unknown> | undefined;
}

// ---------------------------------------------------------------------------
// Validation — wrap the canonical schema (do not mutate it)
// ---------------------------------------------------------------------------

/**
 * Form-only schema: reuses `eventSchema` for every field, but
 *  - drops `spatial_data` in favour of scalar `latitude`/`longitude`;
 *  - makes the temporal fields nullable (the empty UI state), then requires a
 *    start via superRefine with a friendly message;
 *  - adds the "also appears in" id list;
 *  - enforces the cross-field rules from #46: end-not-before-start (hard error),
 *    expands-into ≠ primary timeline, and coordinates supplied as a pair.
 * These refinements are validation-only and never reach the service.
 */
export const eventFormSchema = eventSchema
  .omit({ spatial_data: true })
  .extend({
    temporal_data: temporalDataSchema.nullable(),
    end_temporal_data: temporalDataSchema.nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    appears_in: z.array(z.string().uuid()).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.temporal_data === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["temporal_data"],
        message: "A start date is required.",
      });
    }
    if (
      data.temporal_data &&
      data.end_temporal_data &&
      compareTemporal(data.end_temporal_data, data.temporal_data) < 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_temporal_data"],
        message: "End must be the same as or later than the start.",
      });
    }
    if (
      data.detail_timeline_id &&
      data.timeline_id &&
      data.detail_timeline_id === data.timeline_id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["detail_timeline_id"],
        message: "An event can't expand into its own primary timeline.",
      });
    }
    const hasLat = data.latitude != null;
    const hasLng = data.longitude != null;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasLat ? "longitude" : "latitude"],
        message: "Latitude and longitude must be provided together.",
      });
    }
  });

// ---------------------------------------------------------------------------
// Pure mappers (exported for unit testing)
// ---------------------------------------------------------------------------

export const BLANK_VALUES: EventFormValues = {
  title: "",
  slug: "",
  summary: "",
  detail: "",
  event_type: "milestone",
  importance: 5,
  location: "",
  latitude: null,
  longitude: null,
  temporal_data: null,
  end_temporal_data: null,
  timeline_id: undefined,
  appears_in: [],
  detail_timeline_id: undefined,
  metadata: undefined,
};

/** Coerce stored JSON to TemporalData, treating invalid/empty (`{}`) as null. */
export function toTemporalOrNull(json: unknown): TemporalData | null {
  const result = temporalDataSchema.safeParse(json);
  return result.success ? result.data : null;
}

/** Read a numeric coordinate out of the stored `spatial_data` JSONB. */
export function readCoordinate(
  spatial: unknown,
  key: "lat" | "lng",
): number | null {
  if (spatial && typeof spatial === "object" && !Array.isArray(spatial)) {
    const value = (spatial as Record<string, unknown>)[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }
  return null;
}

/** Recombine the two scalar inputs back into a `spatial_data` blob. */
export function toSpatialData(
  latitude: number | null,
  longitude: number | null,
): Record<string, number> | undefined {
  if (latitude == null || longitude == null) return undefined;
  return { lat: latitude, lng: longitude };
}

export function mapRowToFormValues(
  row: EventWithRelations,
  appearsIn: string[],
): EventFormValues {
  return {
    title: row.title,
    slug: row.slug,
    summary: row.summary ?? "",
    detail: row.detail ?? "",
    event_type: (row.event_type as EventType | null) ?? "milestone",
    importance: row.importance ?? 5,
    location: row.location ?? "",
    latitude: readCoordinate(row.spatial_data, "lat"),
    longitude: readCoordinate(row.spatial_data, "lng"),
    // Legacy rows may still contain '{}' JSON from migration defaults; treat
    // anything that isn't real TemporalData as null so the editor doesn't render
    // a garbage "undefined …" value.
    temporal_data: toTemporalOrNull(row.temporal_data),
    end_temporal_data: toTemporalOrNull(row.end_temporal_data),
    timeline_id: row.timeline_id ?? undefined,
    appears_in: appearsIn,
    detail_timeline_id: row.detail_timeline_id ?? undefined,
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
  };
}

/** Drops empty-string optionals so we never persist "" for nullable text. */
function toPersistedFields(values: EventFormValues) {
  return {
    title: values.title,
    summary: values.summary || undefined,
    detail: values.detail || undefined,
    event_type: values.event_type,
    importance: values.importance,
    location: values.location || undefined,
    temporal_data: values.temporal_data as TemporalData,
    end_temporal_data: values.end_temporal_data ?? null,
    timeline_id: values.timeline_id ?? null,
    detail_timeline_id: values.detail_timeline_id ?? null,
    metadata: values.metadata,
  };
}

export function toCreateInput(values: EventFormValues): CreateEventInput {
  return {
    ...toPersistedFields(values),
    spatial_data: toSpatialData(values.latitude, values.longitude),
    slug: values.slug || undefined,
  };
}

export function toUpdateData(values: EventFormValues): Partial<EventInput> {
  return {
    ...toPersistedFields(values),
    // On update an empty `{}` clears any previously stored coordinates, whereas
    // `undefined` would leave them untouched.
    spatial_data: toSpatialData(values.latitude, values.longitude) ?? {},
    slug: values.slug,
  };
}

/** Computes the timeline_events junction membership diff for an edit save. */
export function diffAppearsIn(
  initial: string[],
  next: string[],
): { toAdd: string[]; toRemove: string[] } {
  const initialSet = new Set(initial);
  const nextSet = new Set(next);
  return {
    toAdd: next.filter((id) => !initialSet.has(id)),
    toRemove: initial.filter((id) => !nextSet.has(id)),
  };
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-foreground";
const INPUT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

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

// ---------------------------------------------------------------------------
// Timeline pickers
// ---------------------------------------------------------------------------

type ServiceClient = Parameters<typeof useTimelines>[0];
type TimelineOption = { id: string; title: string };

/** Single-select timeline combobox (primary timeline + expands-into). */
function TimelinePicker({
  options,
  isPending,
  value,
  onChange,
  placeholder,
  excludeIds = [],
  allowClear = false,
}: {
  options: TimelineOption[];
  isPending: boolean;
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  placeholder: string;
  excludeIds?: string[];
  allowClear?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const visible = options.filter((o) => !excludeIds.includes(o.id));
  const selected = options.find((o) => o.id === value);
  const selectedLabel = selected?.title ?? (value ? "Selected timeline" : "");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
          )}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search timelines…" />
          <CommandList>
            <CommandEmpty>
              {isPending ? "Loading…" : "No timelines found."}
            </CommandEmpty>
            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onChange(undefined);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value ? "opacity-0" : "opacity-100",
                    )}
                  />
                  — none —
                </CommandItem>
              )}
              {visible.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.title}
                  onSelect={() => {
                    onChange(option.id === value ? undefined : option.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Multi-select for "also appears in" — selected timelines render as chips. */
function TimelineMultiPicker({
  options,
  isPending,
  value,
  onChange,
  excludeIds = [],
}: {
  options: TimelineOption[];
  isPending: boolean;
  value: string[];
  onChange: (ids: string[]) => void;
  excludeIds?: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const visible = options.filter((o) => !excludeIds.includes(o.id));
  const byId = React.useMemo(
    () => new Map(options.map((o) => [o.id, o])),
    [options],
  );

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1">
              {byId.get(id)?.title ?? "Timeline"}
              <button
                type="button"
                aria-label={`Remove ${byId.get(id)?.title ?? "timeline"}`}
                onClick={() => toggle(id)}
                className="rounded-sm hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="font-normal text-muted-foreground"
          >
            + Add timeline
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search timelines…" />
            <CommandList>
              <CommandEmpty>
                {isPending ? "Loading…" : "No timelines found."}
              </CommandEmpty>
              <CommandGroup>
                {visible.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.title}
                    onSelect={() => toggle(option.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(option.id) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props =
  | { mode: "create" }
  | { mode: "edit"; userId: string; slug: string };

export function EventFormClient(props: Props) {
  const router = useRouter();
  const addToast = useUiStore((s) => s.addToast);
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);

  const createEvent = useCreateEvent(client);
  const updateEvent = useUpdateEvent(client);
  const addToTimeline = useAddEventToTimeline(client);
  const removeFromTimeline = useRemoveEventFromTimeline(client);
  const createTimeline = useCreateTimeline(client);

  // Timelines available to the pickers. RLS already constrains writes — linking
  // to a timeline the user can't write to will fail at save and surface a toast.
  const { data: timelines, isPending: timelinesPending } = useTimelines(
    client as ServiceClient,
    {},
  );
  const timelineOptions: TimelineOption[] = React.useMemo(
    () => (timelines ?? []).map((t) => ({ id: t.id, title: t.title })),
    [timelines],
  );

  const isEdit = props.mode === "edit";
  const editQuery = useEventBySlug(
    client,
    isEdit ? props.userId : "",
    isEdit ? props.slug : "",
    { enabled: isEdit },
  );
  const linksQuery = useEventTimelineLinks(client, editQuery.data?.id ?? "", {
    enabled: isEdit && editQuery.data?.id !== undefined,
  });

  const cancelHref =
    props.mode === "edit" ? `/events/${props.slug}` : "/events";

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema) as Resolver<EventFormValues>,
    defaultValues: BLANK_VALUES,
    mode: "onTouched",
  });

  // Snapshot of the persisted "also appears in" set, for the edit-save diff.
  const initialAppearsInRef = React.useRef<string[]>([]);

  // Hydrate the form once both the event row and its junction links resolve
  // (guard against re-hydration on background refetch wiping user edits).
  const hydratedRef = React.useRef(false);
  const editRow = editQuery.data;
  const links = linksQuery.data;
  React.useEffect(() => {
    if (!isEdit || hydratedRef.current) return;
    if (editRow === undefined || links === undefined) return;
    form.reset(mapRowToFormValues(editRow, links));
    initialAppearsInRef.current = links;
    hydratedRef.current = true;
  }, [isEdit, editRow, links, form]);

  const isDirty = form.formState.isDirty;
  const guard = useUnsavedChangesGuard(isDirty);

  const addAnotherRef = React.useRef(false);

  // -------------------------------------------------------------------------
  // Junction reconciliation ("also appears in")
  // -------------------------------------------------------------------------

  const syncAppearsIn = React.useCallback(
    async (eventId: string, toAdd: string[], toRemove: string[]) => {
      await Promise.all([
        ...toAdd.map((timelineId) =>
          addToTimeline.mutateAsync({ timelineId, eventId }),
        ),
        ...toRemove.map((timelineId) =>
          removeFromTimeline.mutateAsync({ timelineId, eventId }),
        ),
      ]);
    },
    [addToTimeline, removeFromTimeline],
  );

  // -------------------------------------------------------------------------
  // Save flow
  // -------------------------------------------------------------------------

  const finalize = React.useCallback(
    (slug: string, addAnother: boolean, values: EventFormValues) => {
      if (addAnother) {
        // Curated carry-forward per the wireframe: event_type + primary timeline.
        form.reset({
          ...BLANK_VALUES,
          event_type: values.event_type,
          timeline_id: values.timeline_id,
        });
        initialAppearsInRef.current = [];
        return;
      }
      router.push(`/events/${slug}`);
    },
    [form, router],
  );

  const onValid = React.useCallback(
    async (values: EventFormValues) => {
      const addAnother = addAnotherRef.current;
      addAnotherRef.current = false;

      try {
        let savedSlug: string;
        let savedId: string;

        if (isEdit) {
          const row = await updateEvent.mutateAsync({
            id: editRow!.id,
            data: toUpdateData(values),
          });
          savedSlug = row.slug;
          savedId = row.id;
        } else {
          const row = await createEvent.mutateAsync(toCreateInput(values));
          savedSlug = row.slug;
          savedId = row.id;
        }

        // Reset to the saved values so isDirty clears before any redirect.
        form.reset(values);

        // Reconcile "also appears in" junction rows. A failure here doesn't
        // undo the saved event, so report it without blocking the redirect.
        const { toAdd, toRemove } = isEdit
          ? diffAppearsIn(initialAppearsInRef.current, values.appears_in)
          : { toAdd: values.appears_in, toRemove: [] as string[] };
        let junctionFailed = false;
        if (toAdd.length > 0 || toRemove.length > 0) {
          try {
            await syncAppearsIn(savedId, toAdd, toRemove);
            initialAppearsInRef.current = values.appears_in;
          } catch {
            junctionFailed = true;
          }
        }

        addToast({
          id: `event-saved-${Date.now()}`,
          message: junctionFailed
            ? "Event saved, but some “also appears in” links failed — retry from the event page."
            : isEdit
              ? "Event updated."
              : "Event created.",
          variant: junctionFailed ? "warning" : "success",
        });

        finalize(savedSlug, addAnother, values);
      } catch {
        // Mutation errors surface via the form-level Alert below.
      }
    },
    [
      isEdit,
      editRow,
      updateEvent,
      createEvent,
      form,
      addToast,
      finalize,
      syncAppearsIn,
    ],
  );

  const submit = React.useCallback(
    (opts?: { addAnother?: boolean }) => {
      // SlugField generates the slug from the title on a debounce, so a quick
      // title→Save can fire before it lands and trip the schema's slug rule.
      // Flush it synchronously here so a quick-save never hard-fails on timing.
      const { slug, title } = form.getValues();
      if (slug.trim().length === 0 && title.trim().length > 0) {
        try {
          form.setValue("slug", generateSlug(title), { shouldValidate: false });
        } catch {
          // Non-sluggable title (e.g. emoji-only) — let validation surface it.
        }
      }
      addAnotherRef.current = opts?.addAnother ?? false;
      void form.handleSubmit(onValid)();
    },
    [form, onValid],
  );

  // -------------------------------------------------------------------------
  // "Expands into" → create a sub-timeline with inherited defaults
  // -------------------------------------------------------------------------

  const handleCreateSubTimeline = React.useCallback(async () => {
    const { title, temporal_data, end_temporal_data } = form.getValues();
    if (!temporal_data) {
      addToast({
        id: `subtimeline-needs-date-${Date.now()}`,
        message: "Set the event's start date before creating a sub-timeline.",
        variant: "warning",
      });
      return;
    }
    try {
      const created = await createTimeline.mutateAsync({
        title: title.trim() ? `${title.trim()} — detail` : "Untitled detail",
        temporal_data,
        end_temporal_data: end_temporal_data ?? null,
      });
      form.setValue("detail_timeline_id", created.id, { shouldDirty: true });
      addToast({
        id: `subtimeline-created-${Date.now()}`,
        message: "Sub-timeline created and linked. Save to persist the link.",
        variant: "success",
      });
    } catch {
      addToast({
        id: `subtimeline-failed-${Date.now()}`,
        message: "Couldn't create the sub-timeline.",
        variant: "error",
      });
    }
  }, [form, createTimeline, addToast]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const watchedTitle = useWatch({ control: form.control, name: "title" });
  const watchedPrimary = useWatch({
    control: form.control,
    name: "timeline_id",
  });
  const watchedAppearsIn = useWatch({
    control: form.control,
    name: "appears_in",
  });
  const slugMode = isEdit ? "edit" : "create";
  const isSaving = createEvent.isPending || updateEvent.isPending;

  const mutationError = createEvent.error ?? updateEvent.error ?? null;
  const hasFieldErrors = Object.keys(form.formState.errors).length > 0;

  if (isEdit && (editQuery.isPending || linksQuery.isPending)) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isEdit && editQuery.isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive" role="alert">
          <AlertTitle>Couldn’t load this event</AlertTitle>
          <AlertDescription>
            {editQuery.error instanceof Error
              ? editQuery.error.message
              : "Unknown error."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const breadcrumbs = isEdit
    ? [
        { label: "Events", href: "/events" },
        { label: watchedTitle || "Edit event" },
      ]
    : [{ label: "Events", href: "/events" }, { label: "New event" }];

  // Expands-into excludes the event's own home/appears-in timelines (a soft,
  // client-side complement to the service-layer fractal-cycle guard).
  const expandsIntoExclude = [
    ...(watchedPrimary ? [watchedPrimary] : []),
    ...(watchedAppearsIn ?? []),
  ];

  return (
    <Form {...form}>
      <form
        className="flex h-full flex-col overflow-hidden"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {/* ── Toolbar ──────────────────────────────────────────────────── */}
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
                  <button
                    type="button"
                    className="hover:text-foreground"
                    onClick={() => guard.requestNavigate(crumb.href!)}
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => guard.requestNavigate(cancelHref)}
            >
              Cancel
            </Button>
            <SaveDropdown
              onSave={() => submit()}
              disabled={isSaving}
              onSaveAndAddAnother={
                isEdit ? undefined : () => submit({ addAnother: true })
              }
            />
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-auto">
          {/* Left column — main form */}
          <div className="flex-1 space-y-8 overflow-auto px-6 py-6">
            {(hasFieldErrors || mutationError) && (
              <Alert variant="destructive" role="alert">
                <AlertTitle>
                  {mutationError
                    ? "Couldn’t save this event"
                    : "Please fix the highlighted fields"}
                </AlertTitle>
                <AlertDescription>
                  {mutationError instanceof Error
                    ? mutationError.message
                    : "Some fields need your attention before saving."}
                </AlertDescription>
              </Alert>
            )}

            {/* Identity */}
            <section>
              <SectionHeading>Identity</SectionHeading>
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={LABEL_CLASS}>
                        Title{" "}
                        <span
                          aria-label="required"
                          className="text-destructive"
                        >
                          *
                        </span>
                      </FormLabel>
                      <FormControl>
                        <input
                          {...field}
                          className={INPUT_CLASS}
                          placeholder="Event title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Controller
                  control={form.control}
                  name="event_type"
                  render={({ field }) => (
                    <div>
                      <Label htmlFor="event-type" className={LABEL_CLASS}>
                        Type{" "}
                        <span
                          aria-label="required"
                          className="text-destructive"
                        >
                          *
                        </span>
                      </Label>
                      <select
                        id="event-type"
                        className={INPUT_CLASS}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(e.target.value as EventType)
                        }
                      >
                        {eventTypeEnum.options.map((value) => (
                          <option key={value} value={value}>
                            {value.charAt(0).toUpperCase() + value.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={LABEL_CLASS}>Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="One-paragraph summary…"
                          className="min-h-20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="detail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={LABEL_CLASS}>Detail</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Long-form narrative…"
                          className="min-h-35"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* When */}
            <section>
              <SectionHeading>When</SectionHeading>
              <div className="space-y-4">
                <Controller
                  control={form.control}
                  name="temporal_data"
                  render={({ field, fieldState }) => (
                    <TemporalInput
                      label="Start date"
                      required
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="end_temporal_data"
                  render={({ field, fieldState }) => (
                    <TemporalInput
                      label="End date"
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            </section>

            {/* Where */}
            <section>
              <SectionHeading>Where</SectionHeading>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={LABEL_CLASS}>Location</FormLabel>
                      <FormControl>
                        <input
                          {...field}
                          className={INPUT_CLASS}
                          placeholder="e.g. Paris, France"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className={LABEL_CLASS}>Latitude</FormLabel>
                        <FormControl>
                          <input
                            type="number"
                            step="any"
                            min={-90}
                            max={90}
                            className={INPUT_CLASS}
                            placeholder="48.8566"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? null
                                  : e.target.valueAsNumber,
                              )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className={LABEL_CLASS}>Longitude</FormLabel>
                        <FormControl>
                          <input
                            type="number"
                            step="any"
                            min={-180}
                            max={180}
                            className={INPUT_CLASS}
                            placeholder="2.3522"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? null
                                  : e.target.valueAsNumber,
                              )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </section>

            {/* Timelines */}
            <section>
              <SectionHeading>Timelines</SectionHeading>
              <div className="space-y-5">
                <Controller
                  control={form.control}
                  name="timeline_id"
                  render={({ field }) => (
                    <div>
                      <Label className={LABEL_CLASS}>Primary timeline</Label>
                      <TimelinePicker
                        options={timelineOptions}
                        isPending={timelinesPending}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select the home timeline…"
                        allowClear
                      />
                      <p className="mt-1 text-xs text-foreground-muted">
                        The event’s home timeline. Drives collaborator access;
                        an event with no primary timeline is owner-only.
                      </p>
                    </div>
                  )}
                />

                <Controller
                  control={form.control}
                  name="appears_in"
                  render={({ field }) => (
                    <div>
                      <Label className={LABEL_CLASS}>Also appears in</Label>
                      <TimelineMultiPicker
                        options={timelineOptions}
                        isPending={timelinesPending}
                        value={field.value}
                        onChange={field.onChange}
                        excludeIds={watchedPrimary ? [watchedPrimary] : []}
                      />
                      <p className="mt-1 text-xs text-foreground-muted">
                        Additional timelines this event surfaces in, without
                        changing its home.
                      </p>
                    </div>
                  )}
                />

                <Controller
                  control={form.control}
                  name="detail_timeline_id"
                  render={({ field, fieldState }) => (
                    <div>
                      <Label className={LABEL_CLASS}>
                        Expands into (sub-timeline)
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <TimelinePicker
                            options={timelineOptions}
                            isPending={timelinesPending}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="— none —"
                            excludeIds={expandsIntoExclude}
                            allowClear
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          className="shrink-0 px-3"
                          aria-label="Create a sub-timeline from this event"
                          title="Create a sub-timeline from this event"
                          disabled={createTimeline.isPending}
                          onClick={handleCreateSubTimeline}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mt-1 text-xs text-foreground-muted">
                        The fractal drill-down: the sub-timeline this event
                        decomposes into. ↗ mints a new one seeded from this
                        event.
                      </p>
                      {fieldState.error && (
                        <p className="mt-1 text-xs text-destructive">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            </section>

            {/* Advanced */}
            <section>
              <details>
                <summary className="cursor-pointer select-none text-sm text-foreground-muted hover:text-foreground">
                  ▸ Advanced (metadata, spatial JSON)
                </summary>
                <div className="mt-3 space-y-4 rounded-md border border-border bg-surface/30 px-4 py-3">
                  <p className="text-xs text-foreground-muted">
                    A <code>metadata</code> / spatial JSON editor is a later,
                    power-user enhancement. Coordinates are captured above.
                  </p>
                </div>
              </details>
            </section>
          </div>

          {/* Right column — metadata rail */}
          <aside className="w-72 shrink-0 space-y-6 border-l border-border px-5 py-6">
            <Controller
              control={form.control}
              name="slug"
              render={({ field }) => (
                <SlugField
                  label="Slug"
                  value={field.value}
                  onChange={field.onChange}
                  sourceValue={watchedTitle}
                  mode={slugMode}
                  warning={
                    isEdit
                      ? "Changing the slug will break existing links to this event."
                      : undefined
                  }
                  description="Auto-generated from title."
                />
              )}
            />

            <Controller
              control={form.control}
              name="importance"
              render={({ field }) => (
                <div>
                  <Label className={LABEL_CLASS}>
                    Importance{" "}
                    <span className="text-foreground-muted">
                      ({field.value})
                    </span>
                  </Label>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[field.value]}
                    onValueChange={(v) => field.onChange(v[0])}
                    aria-label="Importance (1 to 10)"
                  />
                  <p className="mt-1 text-xs text-foreground-muted">
                    1 (minor) – 10 (pivotal).
                  </p>
                </div>
              )}
            />

            <p className="border-t border-border pt-4 text-xs text-foreground-muted">
              New events are saved as drafts. You can publish from the event’s
              page.
            </p>
          </aside>
        </div>
      </form>

      {/* ── Confirm: discard unsaved changes ──────────────────────────── */}
      <Dialog
        open={guard.isConfirmOpen}
        onOpenChange={(open) => {
          if (!open) guard.cancelNavigation();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes. If you leave now, they’ll be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={guard.cancelNavigation}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={guard.confirmNavigation}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
