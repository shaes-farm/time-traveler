import React from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountBoxOutlinedIcon from '@mui/icons-material/AccountBoxOutlined';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CategoryIcon from '@mui/icons-material/Category';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings';
import EventIcon from '@mui/icons-material/Event';
import HelpIcon from '@mui/icons-material/Help';
import PermMediaIcon from '@mui/icons-material/PermMedia';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SettingsIcon from '@mui/icons-material/Settings';
import TimelineIcon from '@mui/icons-material/Timeline';
import type {NavRoutes} from 'ui';

export const MAIN_ROUTES: NavRoutes = {
  primary: [{
    slug: 'dashboard',
    icon: <DashboardIcon />,
    label: 'Dashboard',
    page: '/dashboard',
  }],
  secondary: [{
    slug: 'stories',
    icon: <AutoStoriesIcon />,
    label: 'Stories',
    page: '/stories',
  },{
    slug: 'periods',
    icon: <AccessTimeIcon />,
    label: 'Periods',
    page: '/periods',
  },{
    slug: 'timelines',
    icon: <TimelineIcon />,
    label: 'Timelines',
    page: '/timelines',
  },{
    slug: 'events',
    icon: <EventIcon />,
    label: 'Events',
    page: '/events',
  },{
    slug: 'categories',
    icon: <CategoryIcon />,
    label: 'Categories',
    page: '/categories',
  },{
    slug: 'media',
    icon: <PermMediaIcon />,
    label: 'Media',
    page: '/media',
  }],
  tertiary: [{
    slug: 'settings',
    icon: <SettingsIcon />,
    label: 'Settings',
    page: '/settings',
  }],
};

export const TOOLBAR_ROUTES: NavRoutes = {
  primary: [],
  secondary: [{
    slug: 'profile',
    icon: <AccountBoxOutlinedIcon fontSize='small' />,
    label: 'Profile',
    page: '/profile',
  },{
    slug: 'preferences',
    icon: <DisplaySettingsIcon fontSize='small' />,
    label: 'Preferences',
    page: '/preferences',
  },{
    slug: 'help',
    icon: <HelpIcon fontSize='small' />,
    label: 'Help',
    page: '/help',
  },{
    slug: 'div',
    icon: null,
    label: '',
    page: '#',
  },{
    slug: 'signout',
    icon: <PowerSettingsNewIcon fontSize='small' />,
    label: 'Logout',
    page: '/signout',
  }],
};