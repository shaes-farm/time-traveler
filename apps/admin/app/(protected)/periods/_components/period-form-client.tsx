"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { generateSlug } from "@repo/services/utils/slug";
import { compareTemporal } from "@repo/services/schemas/temporal";
import type { TemporalData } from "@repo/services/schemas/temporal";

import {
  usePeriodBySlug,
  usePeriods,
  useCreatePeriod,
  useUpdatePeriod,
} from "@repo/ui/hooks/use-periods";
import { useUiStore } from "@repo/ui/stores";

import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { AutosaveIndicator } from "@repo/ui/components/autosave-indicator";
import { Button } from "@repo/ui/components/button";
import { ChipInput } from "@repo/ui/components/chip-input";
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
import { Input } from "@repo/ui/components/input";
import { SaveDropdown } from "@repo/ui/components/save-dropdown";
import { SlugField } from "@repo/ui/components/slug-field";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Textarea } from "@repo/ui/components/textarea";
import { TemporalInput } from "@repo/ui/components/temporal-input";
import { TemporalDisplay } from "@repo/ui/components/temporal-display";
import { cn } from "@repo/ui/lib/utils";

import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";
import { useUnsavedChangesGuard } from "./use-unsaved-changes-guard";
import { SignificanceRamp, type Significance } from "./significance-ramp";
import { PeriodParentPicker } from "./period-parent-picker";
import {
  periodFormSchema,
  BLANK_VALUES,
  mapRowToFormValues,
  toCreateInput,
  toUpdateData,
  seedForAddAnother,
  type PeriodFormValues,
} from "./period-form-mappers";

const SIG_OPTIONS: Significance[] = ["low", "medium", "high", "critical"];
const SIG_LABEL: Record<Significance, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const SECTION_HEADING =
  "text-xs font-semibold uppercase tracking-wider text-foreground-muted";

/** Segmented four-way significance control (wireframe 22 #3). */
function SignificanceControl({
  value,
  onChange,
}: {
  value: Significance;
  onChange: (value: Significance) => void;
}) {
  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label="Significance"
        className="flex gap-1 rounded-md border border-border p-1"
      >
        {SIG_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={cn(
              "flex-1 rounded px-2 py-1 text-xs transition-colors",
              value === option
                ? "bg-surface-2 text-foreground"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            {SIG_LABEL[option]}
          </button>
        ))}
      </div>
      <SignificanceRamp value={value} />
    </div>
  );
}

/**
 * Returns a soft, non-blocking message when the child's span falls outside the
 * chosen parent's span. Returns null when either span is incomplete or the
 * child sits inside the parent (wireframe 22 edge case).
 */
function outOfParentRangeWarning(
  childStart: TemporalData | null,
  childEnd: TemporalData | null,
  parentStart: TemporalData | null,
  parentEnd: TemporalData | null,
  parentTitle: string,
): string | null {
  if (childStart === null || parentStart === null) return null;
  const startsBefore = compareTemporal(childStart, parentStart) < 0;
  const endsAfter =
    childEnd !== null &&
    parentEnd !== null &&
    compareTemporal(childEnd, parentEnd) > 0;
  if (!startsBefore && !endsAfter) return null;
  return `This period's span extends outside ${parentTitle}. Period boundaries can overlap — this is allowed, just double-check.`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props =
  { mode: "create" } | { mode: "edit"; userId: string; slug: string };

export function PeriodFormClient(props: Props) {
  const router = useRouter();
  const addToast = useUiStore((s) => s.addToast);
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);

  const createPeriod = useCreatePeriod(client);
  const updatePeriod = useUpdatePeriod(client);
  // A separate observer for the 30s auto-save so its pending state doesn't
  // flicker the deliberate Save button.
  const autosave = useUpdatePeriod(client);

  const isEdit = props.mode === "edit";
  const editQuery = usePeriodBySlug(
    client,
    isEdit ? props.userId : "",
    isEdit ? props.slug : "",
    { enabled: isEdit },
  );
  const editRow = editQuery.data;

  const cancelHref = isEdit ? `/periods/${props.slug}` : "/periods";

  const form = useForm<PeriodFormValues>({
    resolver: zodResolver(periodFormSchema) as Resolver<PeriodFormValues>,
    defaultValues: BLANK_VALUES,
    mode: "onTouched",
  });

  // Hydrate once from the fetched row; a background refetch must not clobber
  // in-progress edits.
  const hydratedRef = React.useRef(false);
  React.useEffect(() => {
    if (!isEdit || hydratedRef.current || editRow === undefined) return;
    form.reset(mapRowToFormValues(editRow));
    hydratedRef.current = true;
  }, [isEdit, editRow, form]);

  const isDirty = form.formState.isDirty;
  const guard = useUnsavedChangesGuard(isDirty);

  const [autosaveAt, setAutosaveAt] = React.useState<Date | null>(null);
  const [addAnotherNote, setAddAnotherNote] = React.useState(false);
  const addAnotherRef = React.useRef(false);

  // Current user id — scopes the parent-period options query.
  const { data: userId = "" } = useQuery({
    queryKey: ["auth", "user-id"],
    queryFn: async () => {
      const {
        data: { user },
      } = await client.auth.getUser();
      return user?.id ?? "";
    },
    staleTime: 5 * 60_000,
  });

  const { data: periods = [] } = usePeriods(
    client,
    { userId, pageSize: 100 },
    { enabled: userId !== "" },
  );

  // -------------------------------------------------------------------------
  // Save flow (draft-only — publish lives on the detail page)
  // -------------------------------------------------------------------------

  const onValid = React.useCallback(
    async (values: PeriodFormValues) => {
      const addAnother = addAnotherRef.current;
      addAnotherRef.current = false;

      try {
        let savedSlug: string;
        if (isEdit && editRow) {
          const row = await updatePeriod.mutateAsync({
            id: editRow.id,
            data: toUpdateData(values),
          });
          savedSlug = row.slug;
        } else {
          const row = await createPeriod.mutateAsync(toCreateInput(values));
          savedSlug = row.slug;
        }

        addToast({
          id: `period-saved-${Date.now()}`,
          message: isEdit ? "Period updated." : "Period created.",
          variant: "success",
        });

        if (addAnother && !isEdit) {
          form.reset(seedForAddAnother(values));
          setAutosaveAt(null);
          setAddAnotherNote(true);
          return;
        }

        // Reset to the saved state so isDirty clears before redirect.
        form.reset({ ...values, slug: savedSlug });
        router.push(`/periods/${savedSlug}`);
      } catch {
        // Surfaced via the form-level Alert below.
      }
    },
    [isEdit, editRow, updatePeriod, createPeriod, form, addToast, router],
  );

  const submit = React.useCallback(
    (opts?: { addAnother?: boolean }) => {
      // Flush the slug synchronously: SlugField debounces generation, so a fast
      // title→Save can fire before it lands and trip the schema's slug rule.
      const { slug, title } = form.getValues();
      if (slug.trim().length === 0 && title.trim().length > 0) {
        try {
          form.setValue("slug", generateSlug(title), { shouldValidate: false });
        } catch {
          // Non-sluggable title — let validation surface it.
        }
      }
      addAnotherRef.current = opts?.addAnother ?? false;
      setAddAnotherNote(false);
      void form.handleSubmit(onValid)();
    },
    [form, onValid],
  );

  // -------------------------------------------------------------------------
  // Auto-save (edit only): every 30s while dirty. Never publishes.
  // -------------------------------------------------------------------------

  React.useEffect(() => {
    if (!isEdit || editRow === undefined) return;
    const id = editRow.id;
    const interval = window.setInterval(() => {
      if (!form.formState.isDirty) return;
      const values = form.getValues();
      autosave.mutate(
        { id, data: toUpdateData(values) },
        { onSuccess: () => setAutosaveAt(new Date()) },
      );
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [isEdit, editRow, form, autosave]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const watchedTitle = useWatch({ control: form.control, name: "title" });
  const watchedParentId = useWatch({
    control: form.control,
    name: "parent_period_id",
  });
  const watchedStart = useWatch({
    control: form.control,
    name: "temporal_data",
  });
  const watchedEnd = useWatch({
    control: form.control,
    name: "end_temporal_data",
  });

  const parentPeriod = React.useMemo(
    () => periods.find((p) => p.id === watchedParentId) ?? null,
    [periods, watchedParentId],
  );

  const rangeWarning = React.useMemo(
    () =>
      parentPeriod
        ? outOfParentRangeWarning(
            watchedStart,
            watchedEnd,
            (parentPeriod.temporal_data as TemporalData | null) ?? null,
            (parentPeriod.end_temporal_data as TemporalData | null) ?? null,
            parentPeriod.title,
          )
        : null,
    [parentPeriod, watchedStart, watchedEnd],
  );

  const isSaving = createPeriod.isPending || updatePeriod.isPending;
  const mutationError = createPeriod.error ?? updatePeriod.error;
  const hasFieldErrors = Object.keys(form.formState.errors).length > 0;

  if (isEdit && editQuery.isPending) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-4 w-96 rounded-md" />
        <div className="mt-6 space-y-2">
          {[1, 2, 3, 4].map((step) => (
            <Skeleton key={step} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (isEdit && editQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <p className="text-sm text-foreground-muted">
          This period could not be found.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/periods")}
        >
          Back to periods
        </Button>
      </div>
    );
  }

  const crumbLabel = isEdit ? (editRow?.title ?? "Period") : "New period";

  return (
    <Form {...form}>
      <form
        className="flex h-full flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <nav className="flex items-center gap-2 text-sm text-foreground-muted">
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => guard.requestNavigate("/periods")}
            >
              Periods
            </button>
            <span aria-hidden>▸</span>
            <span className="text-foreground">{crumbLabel}</span>
          </nav>

          <div className="flex items-center gap-3">
            {isEdit && (
              <AutosaveIndicator
                isSaving={autosave.isPending}
                savedAt={autosaveAt}
              />
            )}
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

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-auto">
          {/* Left column — identity, span, hierarchy, characteristics */}
          <div className="flex-1 space-y-6 overflow-auto px-6 py-6">
            {(hasFieldErrors || mutationError) && (
              <Alert variant="destructive" role="alert">
                <AlertTitle>
                  {mutationError
                    ? "Couldn’t save this period"
                    : "Please fix the highlighted fields"}
                </AlertTitle>
                <AlertDescription>
                  {mutationError instanceof Error
                    ? mutationError.message
                    : "Some fields need your attention before saving."}
                </AlertDescription>
              </Alert>
            )}

            {addAnotherNote && (
              <Alert role="status">
                <AlertDescription>
                  Saved. The parent and significance carried into this new
                  period; everything else was cleared.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Jurassic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="A brief description of the span"
                      {...field}
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
                  <FormLabel>Detail</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={12}
                      placeholder="Full description, Markdown…"
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Span */}
            <section className="space-y-4">
              <h2 className={SECTION_HEADING}>Span</h2>
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
            </section>

            {/* Hierarchy */}
            <section className="space-y-2">
              <h2 className={SECTION_HEADING}>Hierarchy</h2>
              <Controller
                control={form.control}
                name="parent_period_id"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="period-parent"
                      className="text-sm font-medium text-foreground"
                    >
                      Parent period
                    </label>
                    <PeriodParentPicker
                      id="period-parent"
                      periods={periods}
                      currentId={isEdit ? editRow?.id : undefined}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                    {parentPeriod && parentPeriod.temporal_data && (
                      <p className="text-xs text-foreground-muted">
                        Range:{" "}
                        <TemporalDisplay
                          value={parentPeriod.temporal_data as TemporalData}
                          endValue={
                            (parentPeriod.end_temporal_data as TemporalData | null) ??
                            undefined
                          }
                          format="compact"
                        />
                      </p>
                    )}
                    {rangeWarning && (
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        {rangeWarning}
                      </p>
                    )}
                  </div>
                )}
              />
            </section>

            {/* Characteristics */}
            <FormField
              control={form.control}
              name="characteristics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Characteristics</FormLabel>
                  <FormControl>
                    <ChipInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="e.g. reptiles, warm climate"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right column — significance, publish, slug */}
          <div className="w-80 shrink-0 space-y-6 overflow-auto border-l border-border px-6 py-6">
            <section className="space-y-3">
              <h2 className={SECTION_HEADING}>Significance</h2>
              <Controller
                control={form.control}
                name="significance"
                render={({ field }) => (
                  <SignificanceControl
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </section>

            <section className="space-y-2">
              <h2 className={SECTION_HEADING}>Published</h2>
              <p className="text-sm text-foreground-muted">
                Draft — publish from the period’s detail page once it’s ready.
              </p>
            </section>

            <Controller
              control={form.control}
              name="slug"
              render={({ field }) => (
                <SlugField
                  label="Slug"
                  value={field.value}
                  onChange={field.onChange}
                  sourceValue={watchedTitle}
                  mode={isEdit ? "edit" : "create"}
                  warning={
                    isEdit
                      ? "Changing the slug will break existing links to this period."
                      : undefined
                  }
                  description="Auto-generated from title."
                />
              )}
            />
          </div>
        </div>
      </form>

      {/* Discard-changes confirmation */}
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
              You have unsaved changes to this period. Leaving now will lose
              them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={guard.cancelNavigation}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={guard.confirmNavigation}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
