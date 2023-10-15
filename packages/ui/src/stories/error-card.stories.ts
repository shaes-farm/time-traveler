import type { Meta, StoryObj } from '@storybook/react';
import { ErrorCard } from '../components';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof ErrorCard> = {
  title: 'Components/ErrorCard',
  component: ErrorCard,
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
    title: 'Something Horrible Transpired!',
    message: 'Check the logs! Something has crept under the carpet!'
  },
};
