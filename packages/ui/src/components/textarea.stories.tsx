import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./textarea";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Write a short biography...",
  },
  render: (args) => <Textarea className="w-[28rem]" {...args} />,
};

export const WithValue: Story = {
  args: {
    defaultValue:
      "Marie Curie was a Polish and naturalized-French physicist and chemist.",
  },
  render: (args) => <Textarea className="w-[28rem]" {...args} />,
};

export const Disabled: Story = {
  args: {
    defaultValue: "Read-only text area",
    disabled: true,
  },
  render: (args) => <Textarea className="w-[28rem]" {...args} />,
};
