import type { Meta, StoryObj } from "@storybook/react-vite";
import { characterTypeEnum } from "@repo/services/schemas/character";
import { CharacterTypeBadge } from "./character-type-badge";

const meta = {
  title: "Components/CharacterTypeBadge",
  component: CharacterTypeBadge,
  parameters: { layout: "centered" },
  argTypes: {
    type: {
      control: "select",
      options: characterTypeEnum.options,
    },
  },
} satisfies Meta<typeof CharacterTypeBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Human: Story = { args: { type: "human" } };
export const Animal: Story = { args: { type: "animal" } };
export const Mythological: Story = { args: { type: "mythological" } };
export const Fictional: Story = { args: { type: "fictional" } };
export const Organization: Story = { args: { type: "organization" } };
export const Divine: Story = { args: { type: "divine" } };
export const Artifact: Story = { args: { type: "artifact" } };

/**
 * All seven type badges together — the Storybook pass that finalizes the icon
 * choices against the era palette (icon set is locked; this confirms each reads
 * distinctly at badge size).
 */
export const AllTypes: Story = {
  args: { type: "human" }, // required by the story type; the render ignores it
  render: () => (
    <div className="flex flex-wrap gap-3">
      {characterTypeEnum.options.map((type) => (
        <CharacterTypeBadge key={type} type={type} />
      ))}
    </div>
  ),
};

// ─── Batch J accessibility gate ───────────────────────────────────────────────
// The dense-row story below is where the type tints are verified co-occurring
// with the era accents and the importance gradient (they share a table row in
// the character/event lists). Two checks are eyeballed here:
//   1. red-green colorblind: era hues + the 7 type tints + importance stay
//      distinguishable together;
//   2. meaning survives with hue removed — the icon + literal label carry it,
//      so the badge is never icon-/color-alone.

// Each row pairs a type with a different era code + importance bracket to force
// maximum hue co-occurrence in a single dense scan.
const DENSE_ROWS = [
  { type: "human", era: "CE", year: "1961", importance: 9 },
  { type: "animal", era: "KYA", year: "12", importance: 4 },
  { type: "mythological", era: "BCE", year: "800", importance: 6 },
  { type: "fictional", era: "CE", year: "1851", importance: 2 },
  { type: "organization", era: "CE", year: "1969", importance: 8 },
  { type: "divine", era: "BCE", year: "1200", importance: 7 },
  { type: "artifact", era: "MYA", year: "3.3", importance: 5 },
] as const;

const ERA_CLASS: Record<string, string> = {
  CE: "text-era-ce",
  BCE: "text-era-bce",
  KYA: "text-era-kya",
  MYA: "text-era-mya",
  BYA: "text-era-bya",
};

function importanceCssVar(importance: number): string {
  if (importance <= 3) return "var(--color-importance-low)";
  if (importance <= 6) return "var(--color-importance-medium)";
  if (importance <= 8) return "var(--color-importance-high)";
  return "var(--color-importance-critical)";
}

export const DenseRow: Story = {
  args: { type: "human" }, // required by the story type; the render ignores it
  render: () => (
    <table className="w-[28rem] border-separate border-spacing-y-1 text-sm">
      <tbody>
        {DENSE_ROWS.map(({ type, era, year, importance }) => (
          <tr key={type} className="bg-surface-2">
            <td className="px-3 py-2">
              <CharacterTypeBadge type={type} />
            </td>
            <td className="px-3 py-2 font-mono tabular-nums">
              <span className={ERA_CLASS[era]}>
                {year} {era}
              </span>
            </td>
            <td className="px-3 py-2">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: importanceCssVar(importance) }}
                />
                <span className="text-foreground-muted">
                  Importance {importance}
                </span>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
