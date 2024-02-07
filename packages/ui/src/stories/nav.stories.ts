import type { Meta, StoryObj } from '@storybook/react';
import { Nav } from '../components/nav';
import type {NavRoute, NavRoutes, NavRouter} from '../components/nav';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta: Meta<typeof Nav> = {
  title: 'Nav',
  component: Nav,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Nav>;

const routes: NavRoutes = {
  primary: [{
    slug: 'primary-item-1',
    icon: 'icon',
    label: 'Primary Item 1',
    page: '/page-1',
  }],
  secondary: [{
    slug: 'secondary-item-1',
    icon: 'icon',
    label: 'Secondary Item 1',
    page: '/page-2',
  }],
  tertiary: [{
    slug: 'tertiary-item-1',
    icon: 'icon',
    label: 'Tertiary Item 1',
    page: '/page-3',
  }],
};

const {log} = console;

const router: NavRouter = (route: NavRoute) => {log({route})};

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Default: Story = {
  args: {
    routes,
    router,
  },
};

export const Dense: Story = {
  args: {
    routes,
    router,
    dense: true,
  },
};