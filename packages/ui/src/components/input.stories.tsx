import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Marie Curie" },
  render: (args) => <Input className="w-72" {...args} />,
};

export const Disabled: Story = {
  args: { placeholder: "Disabled", disabled: true },
  render: (args) => <Input className="w-72" {...args} />,
};

export const WithValue: Story = {
  args: { defaultValue: "1867 CE", readOnly: true },
  render: (args) => <Input className="w-72" {...args} />,
};
