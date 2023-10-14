import type { Meta, StoryObj } from '@storybook/react';
import { HorizontalStepper } from '../components/horizontal-stepper';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof HorizontalStepper> = {
  title: 'Components/HorizontalStepper',
  component: HorizontalStepper,
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
    steps: [{
      label: 'Step 1',
      route: '#',
    }, {
      label: 'Step 2',
      route: '#',
    }, {
      label: 'Step 3',
      route: '#',
    }, {
      label: 'Step 4',
      route: '#',
    }, {
      label: 'Step 5',
      route: '#',
    }, {
      label: 'Step 6',
      route: '#',
    }],
  },
};
