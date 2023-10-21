import type { Meta, StoryObj } from '@storybook/react';
import { Menu, type LabeledRoute } from '../components/menu';

const menu: LabeledRoute[] = [{
  label: 'one',
  route: '#',
},{
  label: 'two',
  route: '#',
},{
  label: 'three',
  route: '#',
}];

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof Menu> = {
  title: 'Components/Menu',
  component: Menu,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Default: Story = {
  args: {
    menu,
  },
};
