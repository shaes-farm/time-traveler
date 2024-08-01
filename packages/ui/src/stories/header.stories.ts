import type { Meta, StoryObj } from '@storybook/react';
import { Header } from '../components/header';
import { config } from './config';

const {app: {
  title,
  description,
}} = config;

const menu = [{
  label: 'home',
  route: '/',
},{
  label: 'about',
  route: '/about',
},{
  label: 'contact',
  route: '/contact',
}];

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof Header> = {
  title: 'Components/Header',
  component: Header,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'fullscreen',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Default: Story = {
  args: {
    description,
    menu,
    title,
  },
};
