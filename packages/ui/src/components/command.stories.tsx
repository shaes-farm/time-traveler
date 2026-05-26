import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command";

const meta = {
  title: "Components/Command",
  component: Command,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Command className="w-80 rounded-lg border border-border">
      <CommandInput placeholder="Search characters, events…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Characters">
          <CommandItem>Marie Curie</CommandItem>
          <CommandItem>Albert Einstein</CommandItem>
          <CommandItem>Ada Lovelace</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Events">
          <CommandItem>Discovery of polonium</CommandItem>
          <CommandItem>Annus Mirabilis papers</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
