import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { Button } from "./button";
import { Toaster } from "./sonner";

const meta = {
  title: "Components/Toaster",
  component: Toaster,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <Toaster />
      <div className="flex gap-3">
        <Button onClick={() => toast.success("Character saved")}>
          Success
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.info("Draft auto-saved at 2:14 PM")}
        >
          Info
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            toast.error("Validation failed", {
              description: "Start date must precede end date.",
            })
          }
        >
          Error
        </Button>
      </div>
    </>
  ),
};
