import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card.js";
import { Button } from "./button.js";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Marie Curie</CardTitle>
        <CardDescription>1867 CE — 1934 CE · Human</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-foreground-muted">
        Pioneering research on radioactivity; first person to win Nobel Prizes
        in two scientific fields.
      </CardContent>
      <CardFooter>
        <Button variant="secondary" size="sm">
          Open
        </Button>
      </CardFooter>
    </Card>
  ),
};
