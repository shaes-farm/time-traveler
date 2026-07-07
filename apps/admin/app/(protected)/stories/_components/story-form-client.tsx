"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { generateSlug } from "@repo/services/utils/slug";

import {
  useStoryBySlug,
  useCreateStory,
  useUpdateStory,
} from "@repo/ui/hooks/use-stories";
import { useCharacters } from "@repo/ui/hooks/use-characters";
import { useUiStore } from "@repo/ui/stores";

import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { AutosaveIndicator } from "@repo/ui/components/autosave-indicator";
import { Button } from "@repo/ui/components/button";
import { ChipInput } from "@repo/ui/components/chip-input";
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
import { Input } from "@repo/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { SaveDropdown } from "@repo/ui/components/save-dropdown";
import { SlugField } from "@repo/ui/components/slug-field";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Textarea } from "@repo/ui/components/textarea";
import {
  CharacterTypeBadge,
  type CharacterType,
} from "@repo/ui/components/character-type-badge";
import { cn } from "@repo/ui/lib/utils";

import { getBrowserSupabaseClient } from "../../../../lib/auth/browser-client";
import { useUnsavedChangesGuard } from "./use-unsaved-changes-guard";
import {
  storyFormSchema,
  BLANK_VALUES,
  mapRowToFormValues,
  toCreateInput,
  toUpdateData,
  seedForAddAnother,
  type StoryFormValues,
  type NarratorType,
} from "./story-form-mappers";

const NARRATOR_OPTIONS: { value: NarratorType; label: string }[] = [
  { value: "first_person", label: "First-person" },
  { value: "third_person", label: "Third-person" },
  { value: "omniscient", label: "Omniscient" },
];

type CharacterOption = {
  id: string;
  name: string;
  character_type: CharacterType;
};

/** Searchable single-select over the user's characters, rendering type identity. */
function PerspectivePicker({
  options,
  value,
  onChange,
  isPending,
}: {
  options: CharacterOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.id === value) ?? null;

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
            !selected && "text-foreground-muted",
          )}
        >
          {selected ? (
            <CharacterTypeBadge
              type={selected.character_type}
              label={selected.name}
            />
          ) : (
            "Choose a character"
          )}
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
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === null ? "opacity-100" : "opacity-0",
                  )}
                />
                — none —
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => {
                    onChange(option.id === value ? null : option.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <CharacterTypeBadge
                    type={option.character_type}
                    label={option.name}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props =
  { mode: "create" } | { mode: "edit"; userId: string; slug: string };

export function StoryFormClient(props: Props) {
  const router = useRouter();
  const addToast = useUiStore((s) => s.addToast);
  const client = React.useMemo(() => getBrowserSupabaseClient(), []);

  const createStory = useCreateStory(client);
  const updateStory = useUpdateStory(client);
  // A separate observer for the 30s auto-save so its pending state doesn't
  // flicker the deliberate Save button.
  const autosave = useUpdateStory(client);

  const isEdit = props.mode === "edit";
  const editQuery = useStoryBySlug(
    client,
    isEdit ? props.userId : "",
    isEdit ? props.slug : "",
    { enabled: isEdit },
  );
  const editRow = editQuery.data;

  const cancelHref = isEdit ? `/stories/${props.slug}` : "/stories";

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema) as Resolver<StoryFormValues>,
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

  // Perspective options: the user's characters. Fetched via the auth user id
  // (works for both create and edit).
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
  const { data: characters = [], isPending: charactersPending } = useCharacters(
    client,
    { userId, pageSize: 100, sortBy: "name" },
    { enabled: userId !== "" },
  );
  const characterOptions = React.useMemo<CharacterOption[]>(
    () =>
      characters.map((c) => ({
        id: c.id,
        name: c.name,
        character_type: c.character_type as CharacterType,
      })),
    [characters],
  );

  // -------------------------------------------------------------------------
  // Save flow (draft-only — publish lives on the detail page)
  // -------------------------------------------------------------------------

  const onValid = React.useCallback(
    async (values: StoryFormValues) => {
      const addAnother = addAnotherRef.current;
      addAnotherRef.current = false;

      try {
        let savedSlug: string;
        if (isEdit && editRow) {
          const row = await updateStory.mutateAsync({
            id: editRow.id,
            data: toUpdateData(values),
          });
          savedSlug = row.slug;
        } else {
          const row = await createStory.mutateAsync(toCreateInput(values));
          savedSlug = row.slug;
        }

        addToast({
          id: `story-saved-${Date.now()}`,
          message: isEdit ? "Story updated." : "Story created.",
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
        router.push(`/stories/${savedSlug}`);
      } catch {
        // Surfaced via the form-level Alert below.
      }
    },
    [isEdit, editRow, updateStory, createStory, form, addToast, router],
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

  const isSaving = createStory.isPending || updateStory.isPending;
  const mutationError = createStory.error ?? updateStory.error;
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
          This story could not be found.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/stories")}
        >
          Back to stories
        </Button>
      </div>
    );
  }

  const crumbLabel = isEdit ? (editRow?.title ?? "Story") : "New story";

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
              onClick={() => guard.requestNavigate("/stories")}
            >
              Stories
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
          {/* Left column — narrative content */}
          <div className="flex-1 space-y-6 overflow-auto px-6 py-6">
            {(hasFieldErrors || mutationError) && (
              <Alert variant="destructive" role="alert">
                <AlertTitle>
                  {mutationError
                    ? "Couldn’t save this story"
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
                  Saved. The narrator voice carried into this new story;
                  everything else was cleared.
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
                    <Input placeholder="The story's title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sub_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub-title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="An optional secondary line"
                      {...field}
                    />
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
                    <Textarea rows={3} placeholder="A short hook" {...field} />
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
                      rows={16}
                      placeholder="The long-form narrative"
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <ChipInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add tag"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right column — narrative voice + slug */}
          <div className="w-80 shrink-0 space-y-6 overflow-auto border-l border-border px-6 py-6">
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Narrative voice
              </h2>

              <FormField
                control={form.control}
                name="narrator_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Narrator</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={field.onChange}
                        className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {NARRATOR_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="perspective_character_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perspective character</FormLabel>
                    <FormControl>
                      <PerspectivePicker
                        options={characterOptions}
                        value={field.value}
                        onChange={field.onChange}
                        isPending={charactersPending}
                      />
                    </FormControl>
                    <p className="text-xs text-foreground-muted">
                      Whose eyes we see through (required for first-person).
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      ? "Changing the slug will break existing links to this story."
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
              You have unsaved changes to this story. Leaving now will lose
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
