import type { Meta, StoryObj } from '@storybook/react';
import { WorldMap } from '../components/world-map';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof WorldMap> = {
  title: 'UI/WorldMap',
  component: WorldMap,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'fullscreen',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Default: Story = {
  args: {
    annotations: [
      {coordinates: [-74.006, 40.7128], label: 'New York', labelY: -8, dx: -10, dy: -20, anchor: 'end'},
      {coordinates: [12.51133, 41.89193], label: 'Rome', labelY: -8, dx: -10, dy: -20, anchor: 'end'},
      {coordinates: [28.94966, 41.01384], label: 'Istanbul', labelY: -8, dx: 10, dy: -20, anchor: 'start'},
    ],
    center: [0,0],
    graticule: true,
    markers: [
      {coordinates: [-74.006, 40.7128], style: 'dot', radius: 2},
      {coordinates: [12.51133, 41.89193], style: 'dot', radius: 2},
      {coordinates: [28.94966, 41.01384], style: 'dot', radius: 2},
      {coordinates: [-101, 53], style: 'text', text: 'Canada'},
      {coordinates: [-102, 38], style: 'text', text: 'USA'},
      {coordinates: [-103, 25], style: 'text', text: 'Mexico'},
    ],
    zoom: 1,
  },
};
