"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { TemporalData } from "@repo/services/schemas/temporal";
import { getCharacters } from "@repo/services/character-service";
import {
  RelationshipTypeSelector,
  type RelationshipType,
} from "@repo/ui/components/relationship-type-selector";
import { Button } from "@repo/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
import { Label } from "@repo/ui/components/label";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useRelationshipVocabulary } from "@repo/ui/hooks/use-relationship-types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/sheet";
import { TemporalInput } from "@repo/ui/components/temporal-input";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "@repo/ui/lib/utils";
import {
  useCreateRelationship,
  useUpdateRelationship,
} from "@repo/ui/hooks/use-character-relationships";

type ServiceClient = Parameters<typeof getCharacters>[0];

/** An existing relationship (focal → other), for excluding duplicates by type. */
export interface ExistingLink {
  otherId: string;
  type: string;
}

/** When set, the sheet edits an existing relationship instead of creating one. */
export interface RelationshipEditTarget {
  id: string;
  otherId: string;
  otherName: string;
  type: RelationshipType;
  role: string | null;
  description: string | null;
  startTemporal: TemporalData | null;
  endTemporal: TemporalData | null;
}

interface AddRelationshipSheetProps {
  open: boolean;
  onClose: () => void;
  client: ServiceClient;
  focalCharacterId: string;
  focalCharacterName: string;
  /** Relationships that already exist, to exclude duplicates by chosen type. */
  existingLinks: ExistingLink[];
  editing?: RelationshipEditTarget | null;
  /** Pre-select the other character in create mode (e.g. "Duplicate as type"). */
  initialOther?: OtherCharacter | null;
  onSaved: () => void;
}

interface OtherCharacter {
  id: string;
  name: string;
  characterType: string;
}

export function AddRelationshipSheet({
  open,
  onClose,
  client,
  focalCharacterId,
  focalCharacterName,
  existingLinks,
  editing,
  initialOther,
  onSaved,
}: AddRelationshipSheetProps) {
  const isEdit = !!editing;
  const createRel = useCreateRelationship(client);
  const updateRel = useUpdateRelationship(client);

  // The vocabulary is reference data fetched at runtime (#419), so the default
  // type is the first one the data offers rather than a hard-coded "family".
  const {
    vocabulary,
    categories,
    isPending: vocabularyPending,
    isError: vocabularyError,
  } = useRelationshipVocabulary(client);
  const defaultType = categories[0]?.types[0]?.key ?? "";

  const [other, setOther] = React.useState<OtherCharacter | null>(null);
  const [type, setType] = React.useState<RelationshipType>("");
  const [role, setRole] = React.useState<string | null>(null);
  const [description, setDescription] = React.useState("");
  const [start, setStart] = React.useState<TemporalData | null>(null);
  const [end, setEnd] = React.useState<TemporalData | null>(null);

  // Seed / reset form state when the sheet opens (derived-state pattern).
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      if (editing) {
        setOther({
          id: editing.otherId,
          name: editing.otherName,
          characterType: "",
        });
        setType(editing.type);
        setRole(editing.role);
        setDescription(editing.description ?? "");
        setStart(editing.startTemporal);
        setEnd(editing.endTemporal);
      } else {
        setOther(initialOther ?? null);
        setType(defaultType);
        setRole(null);
        setDescription("");
        setStart(null);
        setEnd(null);
      }
    }
  }

  // The vocabulary may still be loading when the sheet opens, so the reset above
  // may have stored "". Derive the effective value rather than patching state
  // during render: `type` holds an explicit choice once the user makes one, and
  // `defaultType` fills in until then. Everything below reads `selectedType`.
  const selectedType = type === "" ? defaultType : type;

  // Other-character ids already linked by the *currently chosen* type — exclude
  // them from the picker so we never trip the (chars, type) unique index.
  const excludedIds = React.useMemo(() => {
    const ids = new Set<string>([focalCharacterId]);
    for (const link of existingLinks) {
      if (link.type === selectedType) ids.add(link.otherId);
    }
    return ids;
  }, [existingLinks, selectedType, focalCharacterId]);

  const isPending = createRel.isPending || updateRel.isPending;

  function handleSave() {
    if (!isEdit && !other) {
      toast.error("Choose a character first.");
      return;
    }
    if (isEdit && editing) {
      updateRel.mutate(
        {
          id: editing.id,
          data: {
            relationship_type: selectedType,
            relationship_role: role,
            description: description.trim() || undefined,
            start_temporal: start ?? undefined,
            end_temporal: end ?? undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success("Relationship updated.");
            onSaved();
            onClose();
          },
          onError: (err) => toast.error(errMsg(err)),
        },
      );
      return;
    }

    createRel.mutate(
      {
        character_id: focalCharacterId,
        related_character_id: other!.id,
        relationship_type: selectedType,
        relationship_role: role,
        description: description.trim() || undefined,
        start_temporal: start ?? undefined,
        end_temporal: end ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success("Relationship added.");
          onSaved();
          onClose();
        },
        onError: (err) => toast.error(errMsg(err)),
      },
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Edit relationship" : "Add relationship"}
          </SheetTitle>
          <SheetDescription>
            From {focalCharacterName}&apos;s perspective. A reverse entry is
            created automatically where the relationship type calls for one.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Other character */}
          <div className="space-y-1.5">
            <Label>Other character</Label>
            {isEdit ? (
              <p className="rounded-md border border-border px-3 py-2 text-sm">
                {other?.name}
              </p>
            ) : (
              <OtherCharacterCombobox
                client={client}
                excludedIds={excludedIds}
                value={other}
                onChange={setOther}
              />
            )}
          </div>

          {/* Type + sub-role */}
          {/* DECISION NEEDED (#335): wireframe 06 specifies a paired
              directional sub-role control ("Marie is the [parent ▾] of X" +
              inverse-pair hint). Per #57 we reuse the shipped flat-radio
              RelationshipTypeSelector; the service still stores the correct
              inverse. The directional-control fidelity is deferred to #335. */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            {vocabularyPending ? (
              <Skeleton className="h-24 w-full" />
            ) : vocabularyError ? (
              <p className="text-sm text-destructive">
                Could not load relationship types. Try again.
              </p>
            ) : (
              <RelationshipTypeSelector
                type={selectedType}
                role={role}
                categories={categories}
                vocabulary={vocabulary}
                onChange={(next) => {
                  setType(next.type);
                  setRole(next.role);
                }}
              />
            )}
          </div>

          {/* Temporal range */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TemporalInput label="Start" value={start} onChange={setStart} />
            <TemporalInput label="End" value={end} onChange={setEnd} />
          </div>
          <p className="-mt-3 text-xs text-muted-foreground">
            Leave end empty for ongoing or unknown.
          </p>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="rel-description">Description</Label>
            <Textarea
              id="rel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`From ${focalCharacterName}'s perspective (optional)`}
            />
            <p className="text-xs text-muted-foreground">
              The reverse entry is created with its description blank —
              descriptions don&apos;t sync.
            </p>
          </div>
        </div>

        <SheetFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : "Failed to save relationship";
}

// ---------------------------------------------------------------------------
// Other-character combobox (Command inside a Popover).
// ---------------------------------------------------------------------------

function OtherCharacterCombobox({
  client,
  excludedIds,
  value,
  onChange,
}: {
  client: ServiceClient;
  excludedIds: Set<string>;
  value: OtherCharacter | null;
  onChange: (next: OtherCharacter) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  function handleSearchChange(v: string) {
    setSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(v), 300);
  }

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["character-search-relationship", debounced],
    queryFn: () =>
      getCharacters(client, {
        search: debounced.length > 1 ? debounced : undefined,
        pageSize: 20,
      }),
    enabled: open,
    staleTime: 10_000,
  });

  const available = results.filter((c) => !excludedIds.has(c.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? value.name : "Select a character…"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search characters…"
            value={search}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {isFetching && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Searching…
              </div>
            )}
            {!isFetching && (
              <CommandEmpty>
                {debounced.length > 1
                  ? "No characters found."
                  : "Type to search."}
              </CommandEmpty>
            )}
            <CommandGroup>
              {available.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    onChange({
                      id: c.id,
                      name: c.name,
                      characterType: c.character_type,
                    });
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.id === c.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="ml-2 text-xs capitalize text-muted-foreground">
                    {c.character_type}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
