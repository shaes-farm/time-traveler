import type { Meta, StoryObj } from '@storybook/react';
import { NewItemsMenuButton } from '../components/new-items-menu-button';
import type {NavRoute, NavRouter} from '../components/nav';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta: Meta<typeof NewItemsMenuButton> = {
  title: 'NewItemsMenuButton',
  component: NewItemsMenuButton,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof NewItemsMenuButton>;

const routes: NavRoute[] = [{
  slug: 'item-1',
  icon: 'icon-1',
  label: 'Item 1',
  page: '/page-1',
},{
  slug: 'item-2',
  icon: 'icon-2',
  label: 'Item 2',
  page: '/page-2',
},{
  slug: 'item-3',
  icon: 'icon-3',
  label: 'Item 3',
  page: '/page-3',
}];

const {log} = console;

const router: NavRouter = (route: NavRoute) => {log({route})};

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Default: Story = {
  args: {
    routes,
    router,
  },
};
