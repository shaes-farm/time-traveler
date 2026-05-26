import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs.js";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-96">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="events">Events</TabsTrigger>
        <TabsTrigger value="relationships">Relationships</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="text-sm text-foreground-muted">
        Character biography, temporal scope, type identity.
      </TabsContent>
      <TabsContent value="events" className="text-sm text-foreground-muted">
        Events this character participated in.
      </TabsContent>
      <TabsContent
        value="relationships"
        className="text-sm text-foreground-muted"
      >
        Connections to other characters.
      </TabsContent>
    </Tabs>
  ),
};
