import type { Meta, StoryObj } from '@storybook/react';
import { Copyright } from '../components/copyright';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta: Meta<typeof Copyright> = {
  title: 'Components/Copyright',
  component: Copyright,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Copyright>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Primary: Story = {
  args: {
    holder: 'IP Holder',
    year: 2019,
    url: 'http://example.com',
  },
};
