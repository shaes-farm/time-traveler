"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { useForm, useWatch, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  timelineTypeEnum,
  timelineVisibilityEnum,
} from "@repo/services/schemas/timeline";
import { generateSlug } from "@repo/services/utils/slug";

import {
  useTimelineBySlug,
  useCreateTimeline,
  useUpdateTimeline,
} from "@repo/ui/hooks/use-timelines";
import { useCharacters } from "@repo/ui/hooks/use-characters";
import { useUiStore } from "@repo/ui/stores";

import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
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
  FormDescription,
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
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Separator } from "@repo/ui/components/separator";
import { SaveDropdown } from "@repo/ui/components/save-dropdown";
import { SlugField } from "@repo/ui/components/slug-field";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TemporalInput } from "@repo/ui/components/temporal-input";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/utils";

import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";
import { useUnsavedChangesGuard } from "./use-unsaved-changes-guard";
import {
  timelineFormSchema,
  BLANK_VALUES,
  mapRowToFormValues,
  toCreateInput,
  toUpdateData,
} from "./timeline-form-mappers";
import type { TimelineFormValues } from "./timeline-form-mappers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimelineType = z.infer<typeof timelineTypeEnum>;
type Visibility = z.infer<typeof timelineVisibilityEnum>;

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

const VISIBILITY_HINTS: Record<Visibility, string> = {
  private: "Only you can see this.",
  public: "Anyone with the link.",
  shared: "Named collaborators only.",
};

// ---------------------------------------------------------------------------
// Subject character picker
// ---------------------------------------------------------------------------

type ServiceClient = Parameters<typeof useCharacters>[0];

function SubjectCharacterPicker({
  client,
  value,
  onChange,
  error,
}: {
  client: ServiceClient;
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const { data: characters, isPending } = useCharacters(client, {});

  const selected = characters?.find((c) => c.id === value);
  const selectedLabel = selected?.name ?? (value ? "Selected character" : "");

  return (
    <div>
      <Label className={LABEL_CLASS}>
        Subject character{" "}
        <span aria-label="required" className="text-destructive">
          *
        </span>
      </Label>
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
            {selectedLabel || "Search for a character…"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search characters…" />
            <CommandList>
              <CommandEmpty>
                {isPending ? "Loading…" : "No characters found."}
              </CommandEmpty>
              <CommandGroup>
                {characters?.map((character) => (
                  <CommandItem
                    key={character.id}
                    value={character.name}
                    onSelect={() => {
                      onChange(
                        character.id === value ? undefined : character.id,
                      );
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === character.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {character.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="mt-1 text-xs text-foreground-muted">
        Biographical timelines are about one character.
      </p>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props =
  | { mode: "create" }
  | { mode: "edit"; userId: string; slug: string };

export function TimelineFormClient(props: Props) {
  const router = useRouter();
  const addToast = useUiStore((s) => s.addToast);
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);

  const createTimeline = useCreateTimeline(client);
  const updateTimeline = useUpdateTimeline(client);

  // Edit mode: fetch the existing row (userId resolved server-side).
  const isEdit = props.mode === "edit";
  const editQuery = useTimelineBySlug(client, isEdit ? props.slug : "", {
    enabled: isEdit,
  });

  // Cancel returns to the timeline being edited (its detail page); when
  // creating, there is no detail page yet, so fall back to the list.
  const cancelHref =
    props.mode === "edit" ? `/timelines/${props.slug}` : "/timelines";

  const form = useForm<TimelineFormValues>({
    resolver: zodResolver(timelineFormSchema) as Resolver<TimelineFormValues>,
    defaultValues: BLANK_VALUES,
    mode: "onTouched",
  });

  // Hydrate the form once from the fetched row (guard against re-hydration on
  // background refetch wiping user edits).
  const hydratedRef = React.useRef(false);
  const editRow = editQuery.data;
  React.useEffect(() => {
    if (!isEdit || hydratedRef.current || editRow === undefined) return;
    form.reset(mapRowToFormValues(editRow));
    hydratedRef.current = true;
  }, [isEdit, editRow, form]);

  const isDirty = form.formState.isDirty;
  const guard = useUnsavedChangesGuard(isDirty);

  // Confirm dialog state for switching timeline_type away from biographical.
  const [pendingType, setPendingType] = React.useState<TimelineType | null>(
    null,
  );

  const addAnotherRef = React.useRef(false);

  // -------------------------------------------------------------------------
  // Save flow
  //
  // The editor only writes draft content. Publication lives on the timeline
  // detail page (#44), gated on having at least one linked event — neither is
  // available or meaningful here, so there is no publish path in this form.
  // -------------------------------------------------------------------------

  const finalize = React.useCallback(
    (slug: string, addAnother: boolean) => {
      // Mark the form clean so the unsaved-changes guard won't fire on redirect.
      if (addAnother) {
        form.reset(BLANK_VALUES);
        return;
      }
      // TODO(#44): redirect to the protected timeline detail page once it
      // exists. Until then `/timelines/[slug]` resolves to the public reader.
      router.push(`/timelines/${slug}`);
    },
    [form, router],
  );

  const onValid = React.useCallback(
    async (values: TimelineFormValues) => {
      const addAnother = addAnotherRef.current;
      addAnotherRef.current = false;

      try {
        let savedSlug: string;

        if (isEdit) {
          const row = await updateTimeline.mutateAsync({
            id: editRow!.id,
            data: toUpdateData(values),
          });
          savedSlug = row.slug;
        } else {
          const row = await createTimeline.mutateAsync(toCreateInput(values));
          savedSlug = row.slug;
        }

        // Reset to the saved values so isDirty clears before any redirect.
        form.reset(values);
        addToast({
          id: `timeline-saved-${Date.now()}`,
          message: isEdit ? "Timeline updated." : "Timeline created.",
          variant: "success",
        });

        finalize(savedSlug, addAnother);
      } catch {
        // Mutation errors surface via the form-level Alert below.
      }
    },
    [isEdit, editRow, updateTimeline, createTimeline, form, addToast, finalize],
  );

  const submit = React.useCallback(
    (opts?: { addAnother?: boolean }) => {
      // SlugField generates the slug from the title on a debounce, so a quick
      // title→Save can fire before it lands and trip the schema's min-length
      // slug rule. Flush it synchronously here (mirroring the service's own
      // title→slug fallback) so a quick-save never hard-fails on that timing.
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
  // timeline_type change (clear subject when leaving biographical)
  // -------------------------------------------------------------------------

  const handleTypeChange = React.useCallback(
    (next: TimelineType) => {
      const current = form.getValues("timeline_type");
      const hasSubject = Boolean(form.getValues("subject_character_id"));
      if (current === "biographical" && next !== "biographical" && hasSubject) {
        setPendingType(next);
        return;
      }
      form.setValue("timeline_type", next, { shouldDirty: true });
    },
    [form],
  );

  const confirmTypeChange = React.useCallback(() => {
    if (pendingType === null) return;
    form.setValue("subject_character_id", undefined, { shouldDirty: true });
    form.setValue("timeline_type", pendingType, { shouldDirty: true });
    setPendingType(null);
  }, [pendingType, form]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const watchedTitle = useWatch({ control: form.control, name: "title" });
  const watchedType = useWatch({
    control: form.control,
    name: "timeline_type",
  });
  const slugMode = isEdit ? "edit" : "create";
  const isSaving = createTimeline.isPending || updateTimeline.isPending;

  const mutationError = createTimeline.error ?? updateTimeline.error ?? null;
  const hasFieldErrors = Object.keys(form.formState.errors).length > 0;

  if (isEdit && editQuery.isPending) {
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
          <AlertTitle>Couldn’t load this timeline</AlertTitle>
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
        { label: "Timelines", href: "/timelines" },
        { label: watchedTitle || "Edit timeline" },
      ]
    : [{ label: "Timelines", href: "/timelines" }, { label: "New timeline" }];

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
                    ? "Couldn’t save this timeline"
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
                          placeholder="Timeline title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label htmlFor="timeline-type" className={LABEL_CLASS}>
                    Type{" "}
                    <span aria-label="required" className="text-destructive">
                      *
                    </span>
                  </Label>
                  <select
                    id="timeline-type"
                    className={INPUT_CLASS}
                    value={watchedType}
                    onChange={(e) =>
                      handleTypeChange(e.target.value as TimelineType)
                    }
                  >
                    {timelineTypeEnum.options.map((value) => (
                      <option key={value} value={value}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {watchedType === "biographical" && (
                  <Controller
                    control={form.control}
                    name="subject_character_id"
                    render={({ field, fieldState }) => (
                      <SubjectCharacterPicker
                        client={client}
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                )}

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
                          placeholder="Long-form description…"
                          className="min-h-35"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Span */}
            <section>
              <SectionHeading>Span</SectionHeading>
              <div className="space-y-4">
                <Controller
                  control={form.control}
                  name="temporal_data"
                  render={({ field, fieldState }) => (
                    <TemporalInput
                      label="Start"
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
                      label="End"
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="scale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={LABEL_CLASS}>Scale</FormLabel>
                      <FormControl>
                        <input
                          {...field}
                          className={INPUT_CLASS}
                          placeholder="e.g. a single lifetime, an epoch…"
                        />
                      </FormControl>
                      <FormDescription>
                        Free-text label describing the temporal grain.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Advanced */}
            <section>
              <details>
                <summary className="cursor-pointer select-none text-sm text-foreground-muted hover:text-foreground">
                  ▸ Advanced (fractal depth, metadata)
                </summary>
                <div className="mt-3 space-y-4 rounded-md border border-border bg-surface/30 px-4 py-3">
                  <FormField
                    control={form.control}
                    name="fractal_depth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={LABEL_CLASS}>
                          Fractal depth
                        </FormLabel>
                        <FormControl>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            className={`${INPUT_CLASS} max-w-30`}
                            value={
                              Number.isFinite(field.value) ? field.value : ""
                            }
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormDescription>
                          How many zoom levels this timeline supports (default
                          5).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <p className="text-xs text-foreground-muted">
                    A <code>metadata</code> JSON editor is a later, power-user
                    enhancement.
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
                      ? "Changing the slug will break existing links to this timeline."
                      : undefined
                  }
                  description="Auto-generated from title."
                />
              )}
            />

            {/* Visibility (who can reach this) — distinct from publication,
                which is managed on the timeline detail page (#44). */}
            <Controller
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <div>
                  <Label className={LABEL_CLASS}>Visibility</Label>
                  <RadioGroup
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as Visibility)}
                  >
                    {timelineVisibilityEnum.options.map((value) => (
                      <label
                        key={value}
                        htmlFor={`vis-${value}`}
                        className="flex cursor-pointer items-start gap-2.5"
                      >
                        <RadioGroupItem
                          id={`vis-${value}`}
                          value={value}
                          className="mt-0.5"
                        />
                        <span className="flex flex-col">
                          <span className="text-sm capitalize text-foreground">
                            {value}
                          </span>
                          <span className="text-xs text-foreground-muted">
                            {VISIBILITY_HINTS[value]}
                          </span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              )}
            />

            <p className="border-t border-border pt-4 text-xs text-foreground-muted">
              New timelines are saved as drafts. You can publish from the
              timeline’s page once it has at least one event.
            </p>
          </aside>
        </div>
      </form>

      {/* ── Confirm: switching away from biographical ─────────────────── */}
      <Dialog
        open={pendingType !== null}
        onOpenChange={(open) => {
          if (!open) setPendingType(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove the subject character?</DialogTitle>
            <DialogDescription>
              Only biographical timelines have a subject character. Switching
              the type will clear the one you selected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingType(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmTypeChange}
            >
              Switch &amp; clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
