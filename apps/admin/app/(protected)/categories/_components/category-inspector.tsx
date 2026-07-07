"use client";

import * as React from "react";
import { useForm, Controller, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
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
import { SlugField } from "@repo/ui/components/slug-field";
import { Textarea } from "@repo/ui/components/textarea";
import { useUiStore } from "@repo/ui/stores";
import { generateSlug } from "@repo/services/utils/slug";
import {
  useCreateCategory,
  useUpdateCategory,
} from "@repo/ui/hooks/use-categories";
import type { CategoryNode } from "@repo/services/category-service";

import {
  categoryFormSchema,
  mapNodeToFormValues,
  blankForParent,
  toCreateInput,
  toUpdateData,
  type CategoryFormValues,
} from "./category-form-mappers";
import { CategoryColorField } from "./category-color-field";
import { CategoryIconField } from "./category-icon-field";
import { CategoryParentPicker } from "./category-parent-picker";
import { DeleteCategoryDialog } from "./delete-category-dialog";

export type InspectorSelection =
  | { mode: "create"; parentId: string | null }
  | { mode: "edit"; node: CategoryNode };

/**
 * The category inspector — a create/edit form for the selected (or new) node.
 * The manager remounts it (via a `key` on the selection) so form state resets
 * cleanly between selections rather than hand-managing hydration.
 */
export function CategoryInspector({
  client,
  tree,
  usage,
  selection,
  onSaved,
  onDeleted,
  onCancel,
}: {
  client: SupabaseClient;
  tree: CategoryNode[];
  usage: Record<string, number> | undefined;
  selection: InspectorSelection;
  onSaved: (node: CategoryNode) => void;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const isEdit = selection.mode === "edit";
  const addToast = useUiStore((s) => s.addToast);
  const createMut = useCreateCategory(client);
  const updateMut = useUpdateCategory(client);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [showDelete, setShowDelete] = React.useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema) as Resolver<CategoryFormValues>,
    mode: "onTouched",
    defaultValues: isEdit
      ? mapNodeToFormValues(selection.node)
      : blankForParent(selection.parentId),
  });

  const watchedTitle = useWatch({ control: form.control, name: "title" });

  const onSubmit = React.useCallback(
    async (values: CategoryFormValues) => {
      setFormError(null);
      try {
        if (selection.mode === "edit") {
          const row = await updateMut.mutateAsync({
            id: selection.node.id,
            data: toUpdateData(values),
          });
          addToast({
            id: `category-saved-${Date.now()}`,
            message: `Saved “${row.title}”.`,
            variant: "success",
          });
          form.reset(mapNodeToFormValues(row));
          onSaved(row);
        } else {
          const row = await createMut.mutateAsync(toCreateInput(values));
          addToast({
            id: `category-created-${Date.now()}`,
            message: `Created “${row.title}”.`,
            variant: "success",
          });
          onSaved(row);
        }
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : "Failed to save the category.",
        );
      }
    },
    [selection, updateMut, createMut, addToast, form, onSaved],
  );

  // Flush the slug synchronously before validating: SlugField debounces
  // generation, so a fast title→Save can fire before it lands and trip the
  // schema's required-slug rule.
  const submit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const { slug, title } = form.getValues();
      if (slug.trim().length === 0 && title.trim().length > 0) {
        try {
          form.setValue("slug", generateSlug(title), { shouldValidate: false });
        } catch {
          // Non-sluggable title — let validation surface it.
        }
      }
      void form.handleSubmit(onSubmit)();
    },
    [form, onSubmit],
  );

  const pending = createMut.isPending || updateMut.isPending;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-display text-sm font-medium text-foreground">
          {isEdit ? "Edit category" : "New category"}
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={submit} className="flex flex-1 flex-col overflow-auto">
          <div className="flex-1 space-y-4 p-4">
            {formError && (
              <Alert variant="destructive">
                <AlertTitle>Couldn’t save</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Quantum Mechanics" {...field} />
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
                      placeholder="What does this category group?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="color"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="category-color">Color</Label>
                  <CategoryColorField
                    id="category-color"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="icon"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="category-icon">Icon</Label>
                  <CategoryIconField
                    id="category-icon"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="parent_category_id"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="category-parent">Parent</Label>
                  <CategoryParentPicker
                    id="category-parent"
                    tree={tree}
                    currentId={isEdit ? selection.node.id : undefined}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                </div>
              )}
            />

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
                      ? "Changing the slug will break existing links to this category."
                      : undefined
                  }
                  description="Auto-generated from the title."
                />
              )}
            />
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border p-4">
            {isEdit ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" aria-hidden />
                Delete
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Form>

      {isEdit && (
        <DeleteCategoryDialog
          client={client}
          node={selection.node}
          tree={tree}
          usage={usage}
          open={showDelete}
          onOpenChange={setShowDelete}
          onDeleted={onDeleted}
        />
      )}
    </div>
  );
}
