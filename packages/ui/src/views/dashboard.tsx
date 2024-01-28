'use client';
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import {AppBar} from '../components/app-bar';
import {Drawer} from '../components/drawer';
import type { NavRoute, NavRouter, NavRoutes} from '../components/nav';
import {Nav} from '../components/nav';
import {SearchInput} from '../components/search-input';
import {useProfile} from '../providers/profile';
import {ProfileButton} from '../components/profile-button';

export interface DashboardProps {
  /**
   * Toolbar routes. The primary routes render as horizontal menu items, secondary
   * routes as user profile menu, and tertiary routes as an add items menu.
   */
  toolbar: NavRoutes;
  /**
   * Main navigation routes render in the sidebar as primary, secondary, and tertiary
   * menu items separated by dividers.
   */
  routes: NavRoutes;
  /**
   * The router used to perform the navigation.
   */
  router: NavRouter;
  /**
   * Determines if the drawer is open or closed by default.
   */
  drawerOpen?: boolean;
  /**
   * A React node (an element, a string, a number, a portal, an empty node like null, undefined and booleans, or an array of other React nodes). Specifies the content inside the component. When you use JSX, you will usually specify the children prop implicitly by nesting tags like <div><span /></div>.
   * @see https://react.dev/reference/react-dom/components/common#common-props
   */
  children?: React.ReactNode;
}

/**
 * The Dashboard component provides an AppBar containing a Toolbar across the
 * top of the window, and a collapsible drawer containing a navigation sidebar.
 */
export function Dashboard({toolbar, routes, router, drawerOpen = true, children}: DashboardProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(drawerOpen);
  const {profile} = useProfile();

  const toggleDrawer = (): void => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar open={open} position="absolute">
        <Toolbar
          sx={{
            pr: '24px', // keep right padding when drawer closed
          }}
        >
          <IconButton
            aria-label="open drawer"
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          {/* Search Input Form */}
          {toolbar.tertiary && toolbar.tertiary[0].slug === 'search-input' ? <SearchInput route={toolbar.tertiary[0]} router={router} /> : null}
          <Box sx={{ flexGrow: 1 }} />
          {/* Toolbar Icons / Routes */}
          {toolbar.primary.map((route: NavRoute) =>
            <IconButton color="inherit" data-testid={`${route.slug}-icon`} key={route.slug} onClick={() => {router(route)}}>
              {route.icon}
            </IconButton>
          )}
          <ProfileButton profile={profile} router={router} routes={toolbar.secondary ?? []} />
        </Toolbar>
      </AppBar>
      <Drawer open={open} variant="permanent">
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <IconButton aria-label="close drawer" onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <Nav router={router} routes={routes} />
      </Drawer>
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Dashboard;
