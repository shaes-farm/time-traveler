import type { Meta, StoryObj } from '@storybook/react';
import {Notifications} from '../components/notifications';
import type {NavRoute, NavRouter} from '../components/nav';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta: Meta<typeof Notifications> = {
  title: 'Components/Notifications',
  component: Notifications,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Notifications>;

const {log} = console;

const router: NavRouter = (route: NavRoute) => {log({route})};

const route: NavRoute = {
  slug: 'foo',
  icon: 'icon',
  label: 'New Notifications Received',
  page: 'page',
};

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const NewItems: Story = {
  args: {
    count: 3,
    route,
    router,
  },
};

export const NoNewItems: Story = {
  args: {
    count: 0,
    route,
    router,
  }
};