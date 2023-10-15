import type { Meta, StoryObj } from '@storybook/react';
import { EventTimeline } from '../views/event-timeline';
import { timeline } from './timeline';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof EventTimeline> = {
  title: 'Views/EventTimeline',
  component: EventTimeline,
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
    events: timeline.events,
    alternate: false,
    reverse: false,
  },
};

export const LeftPositioned: Story = {
  args: {
    events: timeline.events,
    reverse: true,
  },
};

export const Alternating: Story = {
  args: {
    events: timeline.events,
    alternate: true,
  },
};

export const ReverseAlternating: Story = {
  args: {
    events: timeline.events,
    reverse: true,
    alternate: true,
  },
};
