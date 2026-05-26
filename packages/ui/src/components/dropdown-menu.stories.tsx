import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const meta = {
  title: "Components/DropdownMenu",
  component: DropdownMenu,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Save</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Save options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Save</DropdownMenuItem>
        <DropdownMenuItem>Save and add another</DropdownMenuItem>
        <DropdownMenuItem>Save and close</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
