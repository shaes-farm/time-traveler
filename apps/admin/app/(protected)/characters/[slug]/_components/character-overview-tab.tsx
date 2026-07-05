"use client";

import * as React from "react";
import Link from "next/link";
import type { CharacterWithRelations } from "@repo/services/character-service";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { TemporalDisplay } from "@repo/ui/components/temporal-display";
import { livedYears } from "../../_components/character-detail-helpers";

/** Birth/Death labels adapt to the character type (mirrors the editor form). */
function temporalLabels(type: string): { birth: string; death: string } {
  if (type === "organization") return { birth: "Founded", death: "Dissolved" };
  if (type === "artifact") return { birth: "Created", death: "Destroyed" };
  return { birth: "Birth", death: "Death" };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground border-b border-border pb-1">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A label/value row; renders a muted "Add …" edit link when the value is empty. */
function Field({
  label,
  value,
  addHref,
  addLabel,
}: {
  label: string;
  value?: React.ReactNode;
  addHref?: string;
  addLabel?: string;
}) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      {value != null && value !== "" ? (
        <span className="min-w-0 flex-1">{value}</span>
      ) : addHref ? (
        <Link href={addHref} className="text-primary hover:underline text-sm">
          {addLabel ?? `Add ${label.toLowerCase()}`}
        </Link>
      ) : (
        <span className="min-w-0 flex-1 text-muted-foreground">—</span>
      )}
    </div>
  );
}

function profileString(
  profile: Record<string, unknown> | null,
  key: string,
): string | undefined {
  const v = profile?.[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** Type-specific detail rows, driven by the character_type. */
function TypeDetails({ character }: { character: CharacterWithRelations }) {
  const profile = (character.profile_data as Record<string, unknown>) ?? null;
  const rows: Array<{ label: string; value?: string }> = [];

  switch (character.character_type) {
    case "animal":
      rows.push(
        { label: "Species", value: character.species ?? undefined },
        { label: "Breed", value: character.breed ?? undefined },
        {
          label: "Conservation",
          value: profileString(profile, "conservation_status")?.replace(
            /_/g,
            " ",
          ),
        },
      );
      break;
    case "divine":
      rows.push(
        { label: "Domain", value: character.domain ?? undefined },
        { label: "Pantheon", value: profileString(profile, "pantheon") },
        {
          label: "Worship period",
          value: profileString(profile, "worship_period"),
        },
      );
      break;
    case "mythological":
      rows.push(
        { label: "Domain", value: character.domain ?? undefined },
        { label: "Mythology", value: profileString(profile, "mythology") },
      );
      break;
    case "human":
      rows.push(
        { label: "Nationality", value: profileString(profile, "nationality") },
        { label: "Occupation", value: profileString(profile, "occupation") },
      );
      break;
    case "fictional":
      rows.push(
        { label: "Source work", value: profileString(profile, "source_work") },
        { label: "Author", value: profileString(profile, "author") },
        { label: "Genre", value: profileString(profile, "genre") },
      );
      break;
    case "organization":
      rows.push(
        { label: "Type", value: profileString(profile, "org_type") },
        {
          label: "Headquarters",
          value: profileString(profile, "headquarters"),
        },
      );
      break;
    case "artifact":
      rows.push(
        { label: "Type", value: profileString(profile, "artifact_type") },
        { label: "Material", value: profileString(profile, "material") },
        {
          label: "Location",
          value: profileString(profile, "current_location"),
        },
      );
      break;
  }

  if (rows.every((r) => !r.value)) return null;

  return (
    <Section title="Details">
      <div className="space-y-1.5">
        {rows
          .filter((r) => r.value)
          .map((r) => (
            <Field key={r.label} label={r.label} value={r.value} />
          ))}
      </div>
    </Section>
  );
}

export function CharacterOverviewTab({
  character,
  editHref,
}: {
  character: CharacterWithRelations;
  editHref: string;
}) {
  const birth = (character.birth_temporal as TemporalData | null) ?? null;
  const death = (character.death_temporal as TemporalData | null) ?? null;
  const labels = temporalLabels(character.character_type);
  const lived = livedYears(birth, death);

  function formatDate(value: string | null): string {
    if (!value) return "—";
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <Section title="Biography">
        {character.biography ? (
          <p className="text-sm whitespace-pre-wrap text-foreground">
            {character.biography}
          </p>
        ) : (
          <Link
            href={editHref}
            className="text-sm text-primary hover:underline"
          >
            Add biography
          </Link>
        )}
      </Section>

      <Section title="Physical description">
        {character.physical_description ? (
          <p className="text-sm whitespace-pre-wrap text-foreground">
            {character.physical_description}
          </p>
        ) : (
          <Link
            href={editHref}
            className="text-sm text-primary hover:underline"
          >
            Add physical description
          </Link>
        )}
      </Section>

      <Section title="Temporal scope">
        <div className="space-y-1.5">
          <Field
            label={labels.birth}
            value={
              birth ? (
                <TemporalDisplay value={birth} format="inline" />
              ) : undefined
            }
            addHref={editHref}
            addLabel={`Add ${labels.birth.toLowerCase()} date`}
          />
          <Field
            label={labels.death}
            value={
              death ? (
                <TemporalDisplay value={death} format="inline" />
              ) : (
                "ongoing"
              )
            }
          />
          {lived != null && (
            <p className="text-sm text-muted-foreground pt-1">
              Lived {lived} year{lived === 1 ? "" : "s"}.
            </p>
          )}
        </div>
      </Section>

      <TypeDetails character={character} />

      <Section title="Metadata">
        <div className="space-y-1.5">
          <Field label="Created" value={formatDate(character.created_at)} />
          <Field label="Updated" value={formatDate(character.updated_at)} />
          <Field label="Slug" value={character.slug} />
        </div>
      </Section>
    </div>
  );
}
