import type { Meta, StoryObj } from '@storybook/react';
import { Footer } from '../components/footer';
import { config } from './config';

const {app} = config;

const menu = [{
  label: 'disclaimer',
  route: '/disclaimer',
},{
  label: 'privacy policy',
  route: '/privacy',
},{
  label: 'terms of use',
  route: '/terms',
}];

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof Footer> = {
  title: 'Components/Footer',
  component: Footer,
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
    app,
    menu,
  },
};
