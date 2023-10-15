import type { Meta, StoryObj } from '@storybook/react';
import { PeriodTimeline } from '../views/period-timeline';
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
export const Default: Story = {
  args: {
    period: periods[0],
  },
};
