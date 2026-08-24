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
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/sonner";
import {
  useCreateRelationshipRole,
  useDeleteRelationshipRole,
  useRelationshipRoleInverseReferences,
  useRelationshipRoleUsage,
  useUpdateRelationshipRole,
} from "@repo/ui/hooks/use-relationship-types";
import type {
  RelationshipRoleMeta,
  RelationshipTypeMeta,
} from "@repo/services/schemas/relationship-vocabulary";

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
  blankRole,
  mapRoleToFormValues,
  roleFormSchema,
  toRoleCreateInput,
  toRoleUpdateDataDirty,
  type RoleFormValues,
} from "./vocabulary-form-mappers";

/**
 * Create/edit form for a sub-role — the ADR-0009 taxonomy hanging off one type
 * (parent/child under `family`, and so on).
 *
 * A type accepts a role only when it has at least one; `(relationship_type,
 * relationship_role)` is a composite FK whose `MATCH SIMPLE` NULL-skip is what
 * makes the sub-role optional. Adding the first role to a type therefore
 * changes that type's behaviour in the relationship editor.
 */
export function RoleInspector({
  client,
  parentType,
  role,
  defaultSortOrder,
  onSaved,
  onDeleted,
  onCancel,
}: {
  client: SupabaseClient;
  parentType: RelationshipTypeMeta;
  /** Undefined in create mode. */
  role?: RelationshipRoleMeta;
  defaultSortOrder: number;
  onSaved: (key: string) => void;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const isEdit = role !== undefined;
  const createMut = useCreateRelationshipRole(client);
  const updateMut = useUpdateRelationshipRole(client);
  const deleteMut = useDeleteRelationshipRole(client);

  const [formError, setFormError] = React.useState<string | null>(null);
  const [formErrorTitle, setFormErrorTitle] = React.useState("Couldn’t save");
  const [showDeactivate, setShowDeactivate] = React.useState(false);
  const [showDelete, setShowDelete] = React.useState(false);

  const usageQuery = useRelationshipRoleUsage(
    client,
    parentType.key,
    role?.key ?? "",
    { enabled: isEdit && showDelete },
  );
  // Only relevant to permanent delete — deactivating doesn't touch inverse_key.
  const inverseRefsQuery = useRelationshipRoleInverseReferences(
    client,
    parentType.key,
    role?.key ?? "",
    { enabled: isEdit && showDelete },
  );

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema) as Resolver<RoleFormValues>,
    mode: "onTouched",
    defaultValues: role
      ? mapRoleToFormValues(role)
      : blankRole(parentType.key, defaultSortOrder),
  });
  useReportEditorDirty(form.formState.isDirty);

  // A role's inverse names a sibling role of the same type (parent ↔ child).
  // Since 00031/ADR-0042 it's a composite FK, and the update/create RPCs keep
  // the pairing two-sided — offering a picker rather than a text box just
  // keeps the *input* resolvable, the same reasoning as before that migration.
  const siblingRoles = parentType.roles.filter(
    (candidate) => candidate.key !== role?.key,
  );

  const onSubmit = async (values: RoleFormValues) => {
    setFormError(null);
    try {
      if (role) {
        // Only the fields the user actually touched — the inspector stays
        // mounted (same `key`) across an out-of-band change like a ▲▼
        // reorder, so a full patch built from stale `defaultValues` would
        // silently write back whatever this form loaded with and undo it.
        // (It also matches set_relationship_role's own partial-patch
        // contract — see ADR-0042 — so an untouched inverse_key correctly
        // stays untouched rather than being resent as unchanged.)
        const patch = toRoleUpdateDataDirty(values, form.formState.dirtyFields);
        if (Object.keys(patch).length > 0) {
          await updateMut.mutateAsync({
            typeKey: parentType.key,
            key: role.key,
            patch,
          });
        }
        toast.success(`Saved “${values.label}”.`);
        form.reset(values);
        onSaved(role.key);
      } else {
        const row = await createMut.mutateAsync(toRoleCreateInput(values));
        toast.success(`Created “${row.label}”.`);
        form.reset(values);
        onSaved(row.key);
      }
    } catch (error) {
      setFormErrorTitle("Couldn’t save");
      setFormError(
        error instanceof Error ? error.message : "Failed to save the sub-role.",
      );
    }
  };

  // Only reachable through DeactivateDialog — the is_active switch below is
  // disabled in edit mode, so this is the one path that can flip it.
  const toggleActive = async () => {
    if (!role) return;
    try {
      await updateMut.mutateAsync({
        typeKey: parentType.key,
        key: role.key,
        patch: { is_active: !role.is_active },
      });
      form.setValue("is_active", !role.is_active);
      toast.success(
        role.is_active
          ? `Deactivated “${role.label}”.`
          : `Reactivated “${role.label}”.`,
      );
      setShowDeactivate(false);
    } catch (error) {
      setShowDeactivate(false);
      setFormErrorTitle(
        role.is_active ? "Couldn’t deactivate" : "Couldn’t reactivate",
      );
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to update the sub-role.",
      );
    }
  };

  const confirmDelete = async () => {
    if (!role) return;
    try {
      await deleteMut.mutateAsync({ typeKey: parentType.key, key: role.key });
      toast.success(`Deleted “${role.label}”.`);
      setShowDelete(false);
      onDeleted();
    } catch (error) {
      setShowDelete(false);
      setFormErrorTitle("Couldn’t delete");
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to delete the sub-role.",
      );
    }
  };

  const pending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  return (
    <div className="flex h-full flex-col">
      <InspectorHeader
        title={isEdit ? "Edit sub-role" : "New sub-role"}
        isEdit={isEdit}
        isActive={role?.is_active ?? true}
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

            <p className="text-xs text-foreground-muted">
              Sub-role of <strong>{parentType.label}</strong>.
            </p>

            <Controller
              control={form.control}
              name="key"
              render={({ field, fieldState }) => (
                <KeyField
                  name="role-key"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isEdit={isEdit}
                  error={fieldState.error?.message}
                  placeholder="e.g. parent"
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
                    <Input placeholder="e.g. Parent" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="inverse_key"
              render={({ field }) => (
                // Plain Label rather than FormLabel: the Form* primitives read
                // FormFieldContext, which only `<FormField>` provides.
                <div className="space-y-2">
                  <Label htmlFor="role-inverse">Inverse sub-role</Label>
                  <Select
                    value={field.value === "" ? NO_INVERSE : field.value}
                    onValueChange={(value) =>
                      field.onChange(value === NO_INVERSE ? "" : value)
                    }
                  >
                    <SelectTrigger id="role-inverse">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_INVERSE}>None</SelectItem>
                      {siblingRoles.map((candidate) => (
                        <SelectItem key={candidate.key} value={candidate.key}>
                          {candidate.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-foreground-muted">
                    The sub-role the reciprocal relationship carries — Parent ↔
                    Child. Leave as None for a role that is its own inverse.
                    Saving also points the chosen sub-role back at this one —
                    pairing is always kept two-sided.
                  </p>
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="sort_order"
              render={({ field, fieldState }) => (
                <SortOrderField
                  name="role-sort-order"
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
                  name="role-is-active"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isEdit}
                  description={
                    isEdit
                      ? "Use Deactivate in the overflow menu to change this."
                      : "Inactive sub-roles stop being offered when editors pick this type."
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

      {role && (
        <>
          <DeactivateDialog
            open={showDeactivate}
            onOpenChange={setShowDeactivate}
            onConfirm={() => void toggleActive()}
            pending={updateMut.isPending}
            entryLabel={role.label}
            level="role"
            reactivating={!role.is_active}
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
            entryLabel={role.label}
            level="role"
            blockingCount={usageQuery.data}
            blockingNoun="relationship"
            // Combines both queries: gating on the usage query alone would let
            // deletion enable the moment it resolves even while the inverse
            // -reference check is still pending (or has failed), letting an
            // admin delete before ever seeing the un-pairing warning.
            isLoading={usageQuery.isFetching || inverseRefsQuery.isFetching}
            isError={usageQuery.isError || inverseRefsQuery.isError}
            onRetry={() => {
              void usageQuery.refetch();
              void inverseRefsQuery.refetch();
            }}
            inverseReferenceCount={inverseRefsQuery.data}
            inverseReferenceNoun="sub-role"
          />
        </>
      )}
    </div>
  );
}

/**
 * Radix Select forbids an empty string as an item value (it reserves `""` for
 * "no selection"), so "no inverse" needs a sentinel that is not a legal
 * vocabulary key — keys match `^[a-z][a-z0-9_]*$`, so this cannot collide.
 */
const NO_INVERSE = "__none__";
