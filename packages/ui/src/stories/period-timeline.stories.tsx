import type { Meta, StoryObj } from '@storybook/react';
import { PeriodTimeline } from '../views';
import { periods } from './periods';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof PeriodTimeline> = {
  title: 'Views/PeriodTimeline',
  component: PeriodTimeline,
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
export const Basic: Story = {
  args: {
    period: periods[0],
    alternate: false,
    reverse: false,
  },
};

export const LeftPositioned: Story = {
  args: {
    period: periods[0],
    reverse: true,
  },
};

export const Alternating: Story = {
  args: {
    period: periods[0],
    alternate: true,
  },
};

export const ReverseAlternating: Story = {
  args: {
    period: periods[0],
    reverse: true,
    alternate: true,
  },
};
