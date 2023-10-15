import type { Meta, StoryObj } from '@storybook/react';
import { CustomError } from '../components';

const meta: Meta<typeof CustomError> = {
  title: 'Components/CustomError',
  component: CustomError,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'fullscreen',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'This page could not be found.'
  }
};

export const WithStatus: Story = {
  args: {
    status: 500,
    message: 'Something very bad happened.'
  }
};
