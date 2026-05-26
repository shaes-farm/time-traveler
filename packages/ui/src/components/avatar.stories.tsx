import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>MC</AvatarFallback>
    </Avatar>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/96?img=12" alt="Marie Curie" />
      <AvatarFallback>MC</AvatarFallback>
    </Avatar>
  ),
};

export const BrokenImageFallsBack: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="/nonexistent.png" alt="Broken" />
      <AvatarFallback>??</AvatarFallback>
    </Avatar>
  ),
};
