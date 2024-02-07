import type { Meta, StoryObj } from '@storybook/react';
import {SearchInput} from '../components/search-input';
import type {NavRoute, NavRouter} from '../components/nav';

const meta: Meta<typeof SearchInput> = {
  title: 'SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

const {log} = console;

const router: NavRouter = (route: NavRoute) => {log({route})};

const route: NavRoute = {
  slug: 'foo',
  icon: 'icon',
  label: 'Search for Things!',
  page: 'page',
};

export const Search: Story = {
  args: {
    route,
    router,
  }
};
