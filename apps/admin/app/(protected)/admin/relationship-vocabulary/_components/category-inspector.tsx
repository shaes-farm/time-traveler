"use client";

import * as React from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
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
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/sonner";
import {
  useCreateRelationshipCategory,
  useDeleteRelationshipCategory,
  useUpdateRelationshipCategory,
} from "@repo/ui/hooks/use-relationship-types";
import type { RelationshipCategoryMeta } from "@repo/services/schemas/relationship-vocabulary";

import { useReportEditorDirty } from "../../../../../lib/editor-guard-context";
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
import {
  blankCategory,
  categoryFormSchema,
  mapCategoryToFormValues,
  toCategoryCreateInput,
  toCategoryUpdateDataDirty,
  type CategoryFormValues,
} from "./vocabulary-form-mappers";

/**
 * Create/edit form for a relationship category — the top level of the
 * vocabulary, which is what groups the relationship type picker.
 */
export function CategoryInspector({
  client,
  category,
  defaultSortOrder,
  onSaved,
  onDeleted,
  onCancel,
}: {
  client: SupabaseClient;
  /** Undefined in create mode. */
  category?: RelationshipCategoryMeta;
  defaultSortOrder: number;
  onSaved: (key: string) => void;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const isEdit = category !== undefined;
  const createMut = useCreateRelationshipCategory(client);
  const updateMut = useUpdateRelationshipCategory(client);
  const deleteMut = useDeleteRelationshipCategory(client);

  const [formError, setFormError] = React.useState<string | null>(null);
  const [formErrorTitle, setFormErrorTitle] = React.useState("Couldn’t save");
  const [showDeactivate, setShowDeactivate] = React.useState(false);
  const [showDelete, setShowDelete] = React.useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema) as Resolver<CategoryFormValues>,
    mode: "onTouched",
    defaultValues: category
      ? mapCategoryToFormValues(category)
      : blankCategory(defaultSortOrder),
  });
  useReportEditorDirty(form.formState.isDirty);

  const onSubmit = async (values: CategoryFormValues) => {
    setFormError(null);
    try {
      if (category) {
        // Only the fields the user actually touched — the inspector stays
        // mounted (same `key`) across an out-of-band change like a ▲▼
        // reorder, so a full patch built from stale `defaultValues` would
        // silently write back whatever this form loaded with and undo it.
        const patch = toCategoryUpdateDataDirty(
          values,
          form.formState.dirtyFields,
        );
        if (Object.keys(patch).length > 0) {
          await updateMut.mutateAsync({ key: category.key, patch });
        }
        toast.success(`Saved “${values.label}”.`);
        form.reset(values);
        onSaved(category.key);
      } else {
        const row = await createMut.mutateAsync(toCategoryCreateInput(values));
        toast.success(`Created “${row.label}”.`);
        form.reset(values);
        onSaved(row.key);
      }
    } catch (error) {
      setFormErrorTitle("Couldn’t save");
      setFormError(
        error instanceof Error ? error.message : "Failed to save the group.",
      );
    }
  };

  // Deactivation is a single-field update, so it reuses the update mutation
  // rather than a bespoke endpoint. Only reachable through DeactivateDialog —
  // the is_active switch in the form below is disabled in edit mode, so this
  // is the one path that can flip it.
  const toggleActive = async () => {
    if (!category) return;
    try {
      await updateMut.mutateAsync({
        key: category.key,
        patch: { is_active: !category.is_active },
      });
      form.setValue("is_active", !category.is_active);
      toast.success(
        category.is_active
          ? `Deactivated “${category.label}”.`
          : `Reactivated “${category.label}”.`,
      );
      setShowDeactivate(false);
    } catch (error) {
      setShowDeactivate(false);
      setFormErrorTitle(
        category.is_active ? "Couldn’t deactivate" : "Couldn’t reactivate",
      );
      setFormError(
        error instanceof Error ? error.message : "Failed to update the group.",
      );
    }
  };

  const confirmDelete = async () => {
    if (!category) return;
    try {
      await deleteMut.mutateAsync(category.key);
      toast.success(`Deleted “${category.label}”.`);
      setShowDelete(false);
      onDeleted();
    } catch (error) {
      setShowDelete(false);
      setFormErrorTitle("Couldn’t delete");
      setFormError(
        error instanceof Error ? error.message : "Failed to delete the group.",
      );
    }
  };

  const pending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  return (
    <div className="flex h-full flex-col">
      <InspectorHeader
        title={isEdit ? "Edit group" : "New group"}
        isEdit={isEdit}
        isActive={category?.is_active ?? true}
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
            <InspectorError message={formError} title={formErrorTitle} />

            <Controller
              control={form.control}
              name="key"
              render={({ field, fieldState }) => (
                <KeyField
                  name="category-key"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isEdit={isEdit}
                  error={fieldState.error?.message}
                  placeholder="e.g. family"
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
                    <Input placeholder="e.g. Family" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="What kinds of relationship belong in this group?"
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
                  name="category-sort-order"
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
                  name="category-is-active"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isEdit}
                  description={
                    isEdit
                      ? "Use Deactivate in the overflow menu to change this — it explains what disappears first."
                      : "Inactive groups and everything in them are hidden from the relationship type picker."
                  }
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

      {category && (
        <>
          <DeactivateDialog
            open={showDeactivate}
            onOpenChange={setShowDeactivate}
            onConfirm={() => void toggleActive()}
            pending={updateMut.isPending}
            entryLabel={category.label}
            level="category"
            affectedTypeCount={category.types.length}
            affectedTypeLabels={category.types.map((type) => type.label)}
            reactivating={!category.is_active}
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
            entryLabel={category.label}
            level="category"
            // A category's blast radius is already in hand — the tree carries
            // its types — so no count query, loading state or error state is
            // needed here.
            blockingCount={category.types.length}
            blockingNoun="relationship type"
            isLoading={false}
            isError={false}
            onRetry={() => {}}
          />
        </>
      )}
    </div>
  );
}
