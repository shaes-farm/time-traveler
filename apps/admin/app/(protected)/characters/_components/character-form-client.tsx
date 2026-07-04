"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Music, UploadCloud, Video } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { generateSlug } from "@repo/services/utils/slug";

import {
  useCharacterBySlug,
  useCreateCharacter,
  useUpdateCharacter,
  useAutosaveCharacter,
  usePublishCharacter,
  useUnpublishCharacter,
  useAddMediaToCharacter,
  useRemoveMediaFromCharacter,
  useSetPrimaryCharacterMedia,
} from "@repo/ui/hooks/use-characters";
import { useMediaItem } from "@repo/ui/hooks/use-media";
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
import { Label } from "@repo/ui/components/label";
import { Separator } from "@repo/ui/components/separator";
import { SaveDropdown } from "@repo/ui/components/save-dropdown";
import { SlugField } from "@repo/ui/components/slug-field";
import { Skeleton } from "@repo/ui/components/skeleton";
import { TemporalInput } from "@repo/ui/components/temporal-input";
import { Textarea } from "@repo/ui/components/textarea";

import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";
import {
  MediaSection,
  type AttachedMedia,
} from "../../_components/media/media-section";
import { AttachMediaDialog } from "../../_components/media/attach-media-dialog";
import { useUnsavedChangesGuard } from "./use-unsaved-changes-guard";
import {
  characterFormSchema,
  BLANK_VALUES,
  jsonObjectError,
  mapRowToFormValues,
  toCreateInput,
  toUpdateData,
  seedForAddAnother,
  type CharacterFormValues,
  type CharacterType,
  type Significance,
} from "./character-form-mappers";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-foreground";
const INPUT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const RADIO_LABEL_CLASS =
  "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground has-[:checked]:bg-surface has-[:checked]:text-foreground";

const CHARACTER_TYPES: { value: CharacterType; label: string }[] = [
  { value: "human", label: "Human" },
  { value: "animal", label: "Animal" },
  { value: "mythological", label: "Mythological" },
  { value: "fictional", label: "Fictional" },
  { value: "organization", label: "Organization" },
  { value: "divine", label: "Divine" },
  { value: "artifact", label: "Artifact" },
];

const SIGNIFICANCE_OPTIONS: { value: Significance; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

/** Type-specific top-level columns surfaced per character_type. */
type TypeField = "species" | "breed" | "domain";
const TYPE_FIELDS: Record<CharacterType, TypeField[]> = {
  human: [],
  animal: ["species", "breed"],
  mythological: ["domain"],
  fictional: [],
  organization: [],
  divine: ["domain"],
  artifact: [],
};
const TYPE_FIELD_LABELS: Record<TypeField, string> = {
  species: "Species",
  breed: "Breed",
  domain: "Domain",
};

function joinAnd(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

/** Temporal-scope labels adapt to the character type (wireframe 05). */
function temporalLabels(type: CharacterType): { birth: string; death: string } {
  if (type === "organization") return { birth: "Founded", death: "Dissolved" };
  if (type === "artifact") return { birth: "Created", death: "Destroyed" };
  return { birth: "Birth date", death: "Death date" };
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

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

function RequiredMark() {
  return (
    <span aria-label="required" className="text-destructive">
      *
    </span>
  );
}

// ---------------------------------------------------------------------------
// Create-flow profile media slot
//
// The live MediaSection needs a character_id to write junctions, which doesn't
// exist until the first save. In the create flow we instead let the user pick
// or upload one media row through the same Attach dialog, hold its id in form
// state, and write the `character_media` primary junction after the character
// is created (see onValid).
// ---------------------------------------------------------------------------

type ServiceClient = ReturnType<typeof getBrowserSupabaseClient>;

function CreateProfileMediaSlot({
  client,
  value,
  onChange,
}: {
  client: ServiceClient;
  value: string | null;
  onChange: (mediaId: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const media = useMediaItem(client, value ?? "", { enabled: value != null });
  const row = media.data;

  const Icon =
    row?.media_type === "video"
      ? Video
      : row?.media_type === "audio"
        ? Music
        : FileText;

  return (
    <div className="space-y-2">
      {value == null ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-28 w-full items-center justify-center rounded-md border border-dashed border-border bg-surface/50 text-sm text-foreground-muted hover:border-ring"
        >
          <span className="flex flex-col items-center gap-2">
            <UploadCloud className="h-5 w-5 opacity-50" aria-hidden />
            <span>Drop image or click to upload</span>
          </span>
        </button>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5">
            {row?.media_type === "image" && row.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.url}
                alt={row.alt_text ?? ""}
                className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {row?.caption ?? row?.alt_text ?? "Selected image"}
              </p>
              <p className="text-xs text-foreground-muted">
                Set as the primary image when you save.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
            >
              Remove
            </Button>
          </div>
        </>
      )}
      <AttachMediaDialog
        open={open}
        onOpenChange={setOpen}
        client={client}
        onAttached={(mediaId) => onChange(mediaId)}
        onAttachExisting={(mediaIds) => {
          const first = mediaIds[0];
          if (first) onChange(first);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit-flow profile media (live MediaSection, ordering="primary")
// ---------------------------------------------------------------------------

function EditProfileMedia({
  client,
  characterId,
}: {
  client: ServiceClient;
  characterId: string;
}) {
  const queryClient = useQueryClient();
  const addMedia = useAddMediaToCharacter(client);
  const removeMedia = useRemoveMediaFromCharacter(client);
  const setPrimary = useSetPrimaryCharacterMedia(client);

  const {
    data: items = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["character-media", characterId],
    queryFn: async (): Promise<AttachedMedia[]> => {
      const { data: junctions, error: jErr } = await client
        .from("character_media")
        .select("media_id, is_primary")
        .eq("character_id", characterId);
      if (jErr) throw jErr;
      if (!junctions?.length) return [];
      const ids = junctions.map((j) => j.media_id);
      const { data, error } = await client
        .from("media")
        .select("id, alt_text, caption, media_type, url, source")
        .in("id", ids);
      if (error) throw error;
      const byId = new Map((data ?? []).map((m) => [m.id, m]));
      return junctions
        .map((j): AttachedMedia | null => {
          const m = byId.get(j.media_id);
          if (!m) return null;
          return {
            id: m.id,
            alt_text: m.alt_text ?? null,
            caption: m.caption ?? null,
            media_type: m.media_type ?? null,
            url: m.url ?? null,
            source: m.source ?? "upload",
            sort_order: null,
            is_primary: j.is_primary ?? false,
          };
        })
        .filter((m): m is AttachedMedia => m !== null)
        .sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
    },
    enabled: characterId.length > 0,
    staleTime: 30_000,
  });

  const refresh = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["character-media", characterId],
    });
  }, [queryClient, characterId]);

  const noPrimaryYet = !items.some((m) => m.is_primary);

  return (
    <MediaSection
      client={client}
      items={items}
      isLoading={isPending}
      isError={isError}
      onRetry={() => void refetch()}
      canEdit
      ordering="primary"
      onAttach={async (mediaId) => {
        await addMedia.mutateAsync({
          characterId,
          mediaId,
          isPrimary: noPrimaryYet,
        });
        await refresh();
      }}
      onAttachExisting={async (mediaIds) => {
        let makePrimary = noPrimaryYet;
        for (const mediaId of mediaIds) {
          await addMedia.mutateAsync({
            characterId,
            mediaId,
            isPrimary: makePrimary,
          });
          makePrimary = false;
        }
        await refresh();
      }}
      onDetach={async (mediaId) => {
        await removeMedia.mutateAsync({ characterId, mediaId });
        await refresh();
      }}
      onSetPrimary={async (mediaId) => {
        await setPrimary.mutateAsync({ characterId, mediaId });
        await refresh();
      }}
      onChanged={refresh}
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props =
  { mode: "create" } | { mode: "edit"; userId: string; slug: string };

interface PendingTypeChange {
  next: CharacterType;
  dropped: TypeField[];
}

export function CharacterFormClient(props: Props) {
  const router = useRouter();
  const addToast = useUiStore((s) => s.addToast);
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);

  const createCharacter = useCreateCharacter(client);
  const updateCharacter = useUpdateCharacter(client);
  const autosave = useAutosaveCharacter(client);
  const publish = usePublishCharacter(client);
  const unpublish = useUnpublishCharacter(client);
  const addMedia = useAddMediaToCharacter(client);

  const isEdit = props.mode === "edit";
  const editQuery = useCharacterBySlug(
    client,
    isEdit ? props.userId : "",
    isEdit ? props.slug : "",
    { enabled: isEdit },
  );

  const cancelHref =
    props.mode === "edit" ? `/characters/${props.slug}` : "/characters";

  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(characterFormSchema) as Resolver<CharacterFormValues>,
    defaultValues: BLANK_VALUES,
    mode: "onTouched",
  });

  // Hydrate once from the fetched row; a background refetch must not clobber
  // in-progress edits.
  const hydratedRef = React.useRef(false);
  const editRow = editQuery.data;
  React.useEffect(() => {
    if (!isEdit || hydratedRef.current || editRow === undefined) return;
    form.reset(mapRowToFormValues(editRow));
    hydratedRef.current = true;
  }, [isEdit, editRow, form]);

  const isDirty = form.formState.isDirty;
  const guard = useUnsavedChangesGuard(isDirty);

  const [pendingTypeChange, setPendingTypeChange] =
    React.useState<PendingTypeChange | null>(null);
  const [autosaveAt, setAutosaveAt] = React.useState<Date | null>(null);
  const [addAnotherNote, setAddAnotherNote] = React.useState(false);

  const addAnotherRef = React.useRef(false);
  // The target published state to reconcile to after the content save; defaults
  // to the rail toggle, overridden by the Save-as-draft / Save-and-publish
  // dropdown actions.
  const publishTargetRef = React.useRef(false);

  // -------------------------------------------------------------------------
  // Save flow
  // -------------------------------------------------------------------------

  const characterId = editRow?.id;

  const onValid = React.useCallback(
    async (values: CharacterFormValues) => {
      // TODO(#333): this is last-write-wins. Detect a concurrent edit from
      // another tab (newer stored updated_at than the hydrated baseline) and
      // prompt to refresh rather than silently overwriting.
      const addAnother = addAnotherRef.current;
      addAnotherRef.current = false;
      const publishTarget = publishTargetRef.current;

      try {
        let savedId: string;
        let savedSlug: string;
        let savedPublished: boolean;

        if (isEdit && editRow) {
          const row = await updateCharacter.mutateAsync({
            id: editRow.id,
            data: toUpdateData(values),
          });
          savedId = row.id;
          savedSlug = row.slug;
          savedPublished = row.published ?? false;
        } else {
          const row = await createCharacter.mutateAsync(toCreateInput(values));
          savedId = row.id;
          savedSlug = row.slug;
          savedPublished = row.published ?? false;
          // Attach the stashed profile media as primary. Never block the save
          // on it (wireframe edge case).
          if (values.pending_primary_media_id) {
            try {
              await addMedia.mutateAsync({
                characterId: savedId,
                mediaId: values.pending_primary_media_id,
                isPrimary: true,
              });
            } catch {
              addToast({
                id: `char-media-fail-${Date.now()}`,
                message: "Image attach failed — retry from the detail view.",
                variant: "warning",
              });
            }
          }
        }

        // Reconcile publication to the target state.
        if (publishTarget && !savedPublished) {
          await publish.mutateAsync(savedId);
          savedPublished = true;
        } else if (!publishTarget && savedPublished) {
          await unpublish.mutateAsync(savedId);
          savedPublished = false;
        }

        addToast({
          id: `character-saved-${Date.now()}`,
          message: isEdit ? "Character updated." : "Character created.",
          variant: "success",
        });

        if (addAnother && !isEdit) {
          form.reset(seedForAddAnother(values));
          setAutosaveAt(null);
          setAddAnotherNote(true);
          return;
        }

        // Reset to the saved state so isDirty clears before redirect.
        form.reset({
          ...values,
          slug: savedSlug,
          published: savedPublished,
          pending_primary_media_id: null,
        });
        router.push(`/characters/${savedSlug}`);
      } catch {
        // Surfaced via the form-level Alert below.
      }
    },
    [
      isEdit,
      editRow,
      updateCharacter,
      createCharacter,
      addMedia,
      publish,
      unpublish,
      form,
      addToast,
      router,
    ],
  );

  const submit = React.useCallback(
    (opts?: { addAnother?: boolean; publishTarget?: boolean }) => {
      // Flush the slug synchronously: SlugField debounces generation, so a fast
      // name→Save can fire before it lands and trip the schema's slug rule.
      const { slug, name } = form.getValues();
      if (slug.trim().length === 0 && name.trim().length > 0) {
        try {
          form.setValue("slug", generateSlug(name), { shouldValidate: false });
        } catch {
          // Non-sluggable name — let validation surface it.
        }
      }
      if (opts?.publishTarget !== undefined) {
        form.setValue("published", opts.publishTarget, { shouldDirty: true });
      }
      addAnotherRef.current = opts?.addAnother ?? false;
      publishTargetRef.current =
        opts?.publishTarget ?? form.getValues("published");
      setAddAnotherNote(false);
      void form.handleSubmit(onValid)();
    },
    [form, onValid],
  );

  // -------------------------------------------------------------------------
  // Auto-save (edit only): every 30s while dirty, never publishes.
  // -------------------------------------------------------------------------

  React.useEffect(() => {
    if (!isEdit || editRow === undefined) return;
    const id = editRow.id;
    const interval = window.setInterval(() => {
      if (!form.formState.isDirty) return;
      // TODO(#333): auto-save is also last-write-wins; same concurrent-edit
      // guard as the deliberate Save should apply here.
      const values = form.getValues();
      // Skip a tick rather than fail on half-typed JSON in the Advanced editors.
      if (
        jsonObjectError(values.profile_data_json) !== null ||
        jsonObjectError(values.metadata_json) !== null
      ) {
        return;
      }
      autosave.mutate(
        { id, data: toUpdateData(values) },
        { onSuccess: () => setAutosaveAt(new Date()) },
      );
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [isEdit, editRow, form, autosave]);

  // -------------------------------------------------------------------------
  // character_type change (confirm before clearing type-specific fields)
  // -------------------------------------------------------------------------

  const handleTypeChange = React.useCallback(
    (next: CharacterType) => {
      const current = form.getValues("character_type");
      if (next === current) return;
      const nextFields = TYPE_FIELDS[next];
      const dropped = TYPE_FIELDS[current].filter(
        (field) =>
          !nextFields.includes(field) &&
          form.getValues(field).trim().length > 0,
      );
      if (dropped.length > 0) {
        setPendingTypeChange({ next, dropped });
        return;
      }
      form.setValue("character_type", next, { shouldDirty: true });
    },
    [form],
  );

  const confirmTypeChange = React.useCallback(() => {
    if (pendingTypeChange === null) return;
    for (const field of pendingTypeChange.dropped) {
      form.setValue(field, "", { shouldDirty: true });
    }
    form.setValue("character_type", pendingTypeChange.next, {
      shouldDirty: true,
    });
    setPendingTypeChange(null);
  }, [pendingTypeChange, form]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedType = useWatch({
    control: form.control,
    name: "character_type",
  });
  const watchedPublished = useWatch({
    control: form.control,
    name: "published",
  });

  const slugMode = isEdit ? "edit" : "create";
  const isSaving =
    createCharacter.isPending ||
    updateCharacter.isPending ||
    publish.isPending ||
    unpublish.isPending;

  const mutationError =
    createCharacter.error ??
    updateCharacter.error ??
    publish.error ??
    unpublish.error ??
    null;
  const hasFieldErrors = Object.keys(form.formState.errors).length > 0;

  const labels = temporalLabels(watchedType);
  const showSpeciesBreed = watchedType === "animal";
  const showDomain = watchedType === "divine" || watchedType === "mythological";
  const biographyLabel =
    watchedType === "divine" ? "Mythological account" : "Biography";

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
          <AlertTitle>Couldn’t load this character</AlertTitle>
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
        { label: "Characters", href: "/characters" },
        { label: watchedName || "Edit character" },
      ]
    : [
        { label: "Characters", href: "/characters" },
        { label: "New character" },
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
              onSaveAsDraft={
                watchedPublished
                  ? () => submit({ publishTarget: false })
                  : undefined
              }
              onSaveAndPublish={
                watchedPublished
                  ? undefined
                  : () => submit({ publishTarget: true })
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
                    ? "Couldn’t save this character"
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
                  Cleared: name, biography, aliases, dates, media. Persisted:
                  type, significance, cultural context.
                </AlertDescription>
              </Alert>
            )}

            {/* Identity */}
            <section>
              <SectionHeading>Identity</SectionHeading>
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={LABEL_CLASS}>
                        Name <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <input
                          {...field}
                          className={INPUT_CLASS}
                          placeholder="Character name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className={LABEL_CLASS}>
                    Character type <RequiredMark />
                  </Label>
                  <div className="grid grid-cols-2 gap-0.5">
                    {CHARACTER_TYPES.map((t) => (
                      <label key={t.value} className={RADIO_LABEL_CLASS}>
                        <input
                          type="radio"
                          name="character-type"
                          value={t.value}
                          checked={watchedType === t.value}
                          onChange={() => handleTypeChange(t.value)}
                          className="h-3.5 w-3.5 shrink-0 accent-primary"
                        />
                        <span>{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {showSpeciesBreed && (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="species"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={LABEL_CLASS}>
                            Species <RequiredMark />
                          </FormLabel>
                          <FormControl>
                            <input
                              {...field}
                              className={INPUT_CLASS}
                              placeholder="e.g. Tyrannosaurus rex"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="breed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={LABEL_CLASS}>Breed</FormLabel>
                          <FormControl>
                            <input
                              {...field}
                              className={INPUT_CLASS}
                              placeholder="(n/a for non-domesticated)"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {showDomain && (
                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={LABEL_CLASS}>Domain</FormLabel>
                        <FormControl>
                          <input
                            {...field}
                            className={INPUT_CLASS}
                            placeholder="e.g. Sky, thunder, gods"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Controller
                  control={form.control}
                  name="aliases"
                  render={({ field }) => (
                    <ChipInput
                      label="Aliases"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add alias"
                      description="Press Enter or comma to add. Backspace removes the last alias."
                    />
                  )}
                />

                <Controller
                  control={form.control}
                  name="cultural_context"
                  render={({ field }) => (
                    <ChipInput
                      label="Cultural context"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add context"
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="biography"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={LABEL_CLASS}>
                        {biographyLabel}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Write a biography…"
                          className="min-h-30"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="physical_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={LABEL_CLASS}>
                        Physical description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe physical appearance…"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Temporal scope */}
            <section>
              <SectionHeading>Temporal scope</SectionHeading>
              <div className="space-y-4">
                <Controller
                  control={form.control}
                  name="birth_temporal"
                  render={({ field, fieldState }) => (
                    <TemporalInput
                      label={labels.birth}
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="death_temporal"
                  render={({ field, fieldState }) => (
                    <TemporalInput
                      label={labels.death}
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            </section>

            {/* Profile media */}
            <section>
              <SectionHeading>Profile media</SectionHeading>
              {isEdit && characterId ? (
                <EditProfileMedia client={client} characterId={characterId} />
              ) : (
                <Controller
                  control={form.control}
                  name="pending_primary_media_id"
                  render={({ field }) => (
                    <CreateProfileMediaSlot
                      client={client}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              )}
            </section>

            {/* Advanced */}
            <section>
              <details>
                <summary className="cursor-pointer select-none text-sm text-foreground-muted hover:text-foreground">
                  Advanced (profile_data, metadata)
                </summary>
                <div className="mt-3 space-y-4 rounded-md border border-border bg-surface/30 px-4 py-3">
                  <p className="text-xs text-foreground-muted">
                    Raw JSON escape hatch for power users. Each must be a JSON
                    object. Recurring keys should graduate to real fields.
                  </p>
                  <FormField
                    control={form.control}
                    name="profile_data_json"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={LABEL_CLASS}>
                          profile_data
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            spellCheck={false}
                            className="min-h-30 font-mono text-xs"
                            placeholder='{ "nationality": "Polish" }'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="metadata_json"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={LABEL_CLASS}>metadata</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            spellCheck={false}
                            className="min-h-30 font-mono text-xs"
                            placeholder="{ }"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  sourceValue={watchedName}
                  mode={slugMode}
                  warning={
                    isEdit
                      ? "Changing the slug will break existing links to this character."
                      : undefined
                  }
                  description="Auto-generated from name."
                />
              )}
            />

            <Controller
              control={form.control}
              name="significance"
              render={({ field }) => (
                <div>
                  <Label className={LABEL_CLASS}>Significance</Label>
                  <div className="grid grid-cols-2 gap-0.5">
                    {SIGNIFICANCE_OPTIONS.map((s) => (
                      <label key={s.value} className={RADIO_LABEL_CLASS}>
                        <input
                          type="radio"
                          name="significance"
                          value={s.value}
                          checked={field.value === s.value}
                          onChange={() => field.onChange(s.value)}
                          className="h-3.5 w-3.5 shrink-0 accent-primary"
                        />
                        <span>{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="published"
              render={({ field }) => (
                <div>
                  <Label className={LABEL_CLASS}>Published</Label>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span>
                      {field.value ? "Published" : "Draft — publish on save"}
                    </span>
                  </label>
                </div>
              )}
            />
          </aside>
        </div>
      </form>

      {/* ── Confirm: switching character type clears type-specific fields ── */}
      <Dialog
        open={pendingTypeChange !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTypeChange(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear type-specific fields?</DialogTitle>
            <DialogDescription>
              {pendingTypeChange
                ? `${joinAnd(
                    pendingTypeChange.dropped.map((f) => TYPE_FIELD_LABELS[f]),
                  )} will be cleared. Continue?`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingTypeChange(null)}
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
