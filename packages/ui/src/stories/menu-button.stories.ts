import type { Meta, StoryObj } from '@storybook/react';
import { MenuButton } from '../components/menu-button';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof MenuButton> = {
  title: 'UI/MenuButton',
  component: MenuButton,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    onPrint: () => {console.log('onPrint')},
    onDownload: () => {console.log('onDownload')},
    onShare: () => {console.log('onShare')},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Primary: Story = {
  args: {

  },
};
