import type { Meta, StoryObj } from '@storybook/react';
import { VerticalTimeline } from '../components/vertical-timeline';
import { timeline } from './timeline';

const {events} = timeline;

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof VerticalTimeline> = {
  title: 'Components/VerticalTimeline',
  component: VerticalTimeline,
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
    markers: events,
  },
};

export const Reverse: Story = {
  args: {
    markers: events,
    reverse: true,
  },
};

export const Alternating: Story = {
  args: {
    markers: events,
    alternate: true,
  },
};

export const ReverseAlternating: Story = {
  args: {
    markers: events,
    reverse: true,
    alternate: true,
  },
};
