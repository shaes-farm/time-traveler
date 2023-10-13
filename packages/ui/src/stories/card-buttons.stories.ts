import type { Meta, StoryObj } from '@storybook/react';
import { CardButtons } from '../components/card-buttons';

const {debug} = console;

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof CardButtons> = {
  title: 'Components/CardButtons',
  component: CardButtons,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    onLike: (e: object) => {debug({e})},
    onShare: (e: object) => {debug({e})},
    onSubscribe: (e: object) => {debug({e})},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Primary: Story = {
  args: {},
};
