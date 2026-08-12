"use client";

import * as React from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/sonner";
import {
  useCreateRelationshipType,
  useDeleteRelationshipType,
  useRelationshipTypeUsage,
  useUpdateRelationshipType,
} from "@repo/ui/hooks/use-relationship-types";
import type {
  RelationshipCategoryMeta,
  RelationshipTypeMeta,
} from "@repo/services/schemas/relationship-vocabulary";

import { DeactivateDialog } from "./deactivate-dialog";
import { DeleteVocabularyDialog } from "./delete-vocabulary-dialog";
import {
  ActiveField,
  InspectorError,
  InspectorFooter,
  InspectorHeader,
  KeyField,
  SortOrderField,
} from "./inspector-chrome";
import { allTypes } from "./vocabulary-tree-utils";
import {
  blankType,
  mapTypeToFormValues,
  toTypeCreateInput,
  toTypeUpdateData,
  typeFormSchema,
  type TypeFormValues,
} from "./vocabulary-form-mappers";

/**
 * Create/edit form for a relationship type — the row `character_relationships`
 * actually points at.
 */
export function TypeInspector({
  client,
  categories,
  type,
  defaultCategoryKey,
  defaultSortOrder,
  onSaved,
  onDeleted,
  onCancel,
}: {
  client: SupabaseClient;
  categories: RelationshipCategoryMeta[];
  /** Undefined in create mode. */
  type?: RelationshipTypeMeta;
  defaultCategoryKey: string;
  defaultSortOrder: number;
  onSaved: (key: string) => void;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const isEdit = type !== undefined;
  const createMut = useCreateRelationshipType(client);
  const updateMut = useUpdateRelationshipType(client);
  const deleteMut = useDeleteRelationshipType(client);

  const [formError, setFormError] = React.useState<string | null>(null);
  const [showDeactivate, setShowDeactivate] = React.useState(false);
  const [showDelete, setShowDelete] = React.useState(false);

  // Only fetched while a dialog that displays it is open — see the hook's note
  // on why the tree does not count eagerly.
  const usageQuery = useRelationshipTypeUsage(client, type?.key ?? "", {
    enabled: isEdit && (showDelete || showDeactivate),
  });

  const form = useForm<TypeFormValues>({
    resolver: zodResolver(typeFormSchema) as Resolver<TypeFormValues>,
    mode: "onTouched",
    defaultValues: type
      ? mapTypeToFormValues(type)
      : blankType(defaultCategoryKey, defaultSortOrder),
  });

  const symmetry = useWatch({ control: form.control, name: "symmetry" });

  // Candidates for `inverse_key`: any other type. A type may not be its own
  // inverse — that is what `is_symmetric` expresses.
  const inverseCandidates = React.useMemo(
    () =>
      allTypes(categories).filter((candidate) => candidate.key !== type?.key),
    [categories, type?.key],
  );

  const onSubmit = async (values: TypeFormValues) => {
    setFormError(null);
    try {
      if (type) {
        await updateMut.mutateAsync({
          key: type.key,
          patch: toTypeUpdateData(values),
        });
        toast.success(`Saved “${values.label}”.`);
        form.reset(values);
        onSaved(type.key);
      } else {
        const row = await createMut.mutateAsync(toTypeCreateInput(values));
        toast.success(`Created “${row.label}”.`);
        form.reset(values);
        onSaved(row.key);
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save the type.",
      );
    }
  };

  const toggleActive = async () => {
    if (!type) return;
    try {
      await updateMut.mutateAsync({
        key: type.key,
        patch: { is_active: !type.is_active },
      });
      form.setValue("is_active", !type.is_active);
      toast.success(
        type.is_active
          ? `Deactivated “${type.label}”.`
          : `Reactivated “${type.label}”.`,
      );
      setShowDeactivate(false);
    } catch (error) {
      setShowDeactivate(false);
      setFormError(
        error instanceof Error ? error.message : "Failed to update the type.",
      );
    }
  };

  const confirmDelete = async () => {
    if (!type) return;
    try {
      await deleteMut.mutateAsync(type.key);
      toast.success(`Deleted “${type.label}”.`);
      setShowDelete(false);
      onDeleted();
    } catch (error) {
      setShowDelete(false);
      setFormError(
        error instanceof Error ? error.message : "Failed to delete the type.",
      );
    }
  };

  const pending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  return (
    <div className="flex h-full flex-col">
      <InspectorHeader
        title={isEdit ? "Edit type" : "New type"}
        isEdit={isEdit}
        isActive={type?.is_active ?? true}
        onDeactivate={() => setShowDeactivate(true)}
        onDelete={() => setShowDelete(true)}
      />

      <Form {...form}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit(onSubmit)();
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-4 overflow-auto p-4">
            <InspectorError message={formError} />

            <Controller
              control={form.control}
              name="key"
              render={({ field, fieldState }) => (
                <KeyField
                  name="type-key"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isEdit={isEdit}
                  error={fieldState.error?.message}
                  placeholder="e.g. mentor_student"
                />
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mentor / Student" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="category_key"
              render={({ field, fieldState }) => (
                // Plain Label rather than FormLabel: the Form* primitives read
                // FormFieldContext, which only `<FormField>` provides.
                <div className="space-y-2">
                  <Label htmlFor="type-category">Group</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type-category">
                      <SelectValue placeholder="Pick a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.key} value={category.key}>
                          {category.label}
                          {category.is_active ? "" : " (inactive)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <p className="text-sm text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/*
              The symmetry control.

              `is_symmetric` and `inverse_key` have four combinations and the
              database rejects one of them
              (`relationship_types_symmetric_has_no_inverse`). Exposing the two
              columns directly would make that state reachable and turn a
              routine edit into a raw 23514. Exposing the three legal states as
              one choice makes it unreachable instead — the mappers derive both
              columns from the mode and drop whatever the mode does not use.
            */}
            <Controller
              control={form.control}
              name="symmetry"
              render={({ field }) => (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-foreground">
                    Reciprocal behaviour
                  </legend>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <RadioGroupItem
                        value="symmetric"
                        id="symmetry-symmetric"
                      />
                      <div className="space-y-0.5">
                        <Label htmlFor="symmetry-symmetric">Symmetric</Label>
                        <p className="text-xs text-foreground-muted">
                          Both sides carry the same type — “A and B are
                          friends”.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <RadioGroupItem value="inverse" id="symmetry-inverse" />
                      <div className="space-y-0.5">
                        <Label htmlFor="symmetry-inverse">
                          Directed, with an inverse
                        </Label>
                        <p className="text-xs text-foreground-muted">
                          The reciprocal carries a different type — “A mentors
                          B”, “B is mentored by A”.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <RadioGroupItem value="directed" id="symmetry-directed" />
                      <div className="space-y-0.5">
                        <Label htmlFor="symmetry-directed">
                          Directed, no reciprocal
                        </Label>
                        <p className="text-xs text-foreground-muted">
                          A one-way assertion; no reciprocal row is created.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </fieldset>
              )}
            />

            {symmetry === "inverse" && (
              <Controller
                control={form.control}
                name="inverse_key"
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="type-inverse">Inverse type</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type-inverse">
                        <SelectValue placeholder="Pick the reciprocal type" />
                      </SelectTrigger>
                      <SelectContent>
                        {inverseCandidates.map((candidate) => (
                          <SelectItem key={candidate.key} value={candidate.key}>
                            {candidate.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && (
                      <p className="text-sm text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            )}

            {symmetry === "symmetric" ? (
              <FormField
                control={form.control}
                name="symmetric_noun"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Noun</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. friends" {...field} />
                    </FormControl>
                    <p className="text-xs text-foreground-muted">
                      Reads as “A and B are <em>friends</em>” on the
                      relationship card.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="direction_verb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verb</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. mentors" {...field} />
                    </FormControl>
                    <p className="text-xs text-foreground-muted">
                      Reads as “A <em>mentors</em> B” on the relationship card.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="When should an editor reach for this type?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="sort_order"
              render={({ field, fieldState }) => (
                <SortOrderField
                  name="type-sort-order"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <ActiveField
                  name="type-is-active"
                  checked={field.value}
                  onChange={field.onChange}
                  description="Inactive types stop being offered for new relationships. Existing ones keep working."
                />
              )}
            />
          </div>

          <InspectorFooter
            pending={pending}
            isEdit={isEdit}
            onCancel={onCancel}
          />
        </form>
      </Form>

      {type && (
        <>
          <DeactivateDialog
            open={showDeactivate}
            onOpenChange={setShowDeactivate}
            onConfirm={() => void toggleActive()}
            pending={updateMut.isPending}
            entryLabel={type.label}
            level="type"
            usageCount={usageQuery.data}
            reactivating={!type.is_active}
          />
          <DeleteVocabularyDialog
            open={showDelete}
            onOpenChange={setShowDelete}
            onConfirm={() => void confirmDelete()}
            onDeactivateInstead={() => {
              setShowDelete(false);
              setShowDeactivate(true);
            }}
            pending={deleteMut.isPending}
            entryLabel={type.label}
            level="type"
            blockingCount={usageQuery.data}
            blockingNoun="relationship"
          />
        </>
      )}
    </div>
  );
}
