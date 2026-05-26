import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert.js";

const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert className="w-96">
      <CircleAlert className="h-4 w-4" />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>
        This temporal scope spans an era boundary — review the range bar.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive" className="w-96">
      <CircleAlert className="h-4 w-4" />
      <AlertTitle>Validation error</AlertTitle>
      <AlertDescription>
        Start date must precede end date for ranged events.
      </AlertDescription>
    </Alert>
  ),
};
