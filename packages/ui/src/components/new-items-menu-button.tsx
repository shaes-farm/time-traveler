'use client';
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import type {MenuProps} from '@mui/material/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import type { NavRoute, NavRouter } from './nav';

interface NewItemsMenuButtonProps extends Partial<MenuProps> {
  /**
   * An array of routes rendered as a Menu component.
   * @see https://mui.com/material-ui/react-menu/
   */
  routes: NavRoute[];
  /**
   * The router used to perform the navigation.
   */
  router: NavRouter;
}

/**
 * Renders an Add icon button that displays a Menu of routes when clicked.
 */
export function NewItemsMenuButton({routes, router, ...menuProps}: NewItemsMenuButtonProps): JSX.Element {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const openNewMenu = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const closeNewMenu = (): void => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ flexGrow: 0, ml: 2 }}>
      <Tooltip title="New Items">
        <Button
          aria-label="new items"
          color="inherit"
          endIcon={<ArrowDropDownOutlinedIcon/>}
          onClick={openNewMenu}
          size="large"
          sx={{ p: 0 }}
          >
            <AddOutlinedIcon />
        </Button>
      </Tooltip>
      <Menu
        id="new-items-menu"
        sx={{ mt: '45px' }}
        {...menuProps}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        onClose={closeNewMenu}
        open={Boolean(anchorEl)}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {routes.length ? (routes.map((route) => (route.slug === 'div' ?
          <Divider key={Symbol(route.slug).toString()} />
        :
          <MenuItem key={route.slug} onClick={() => {
            closeNewMenu();
            router(route);
          }}>
            <ListItemIcon>
              {route.icon}
            </ListItemIcon>
            <ListItemText>
              {route.label}
            </ListItemText>
            {route.hotkey ? <Typography color="text.secondary" variant="body2">
              {route.hotkey}
            </Typography> : null}
          </MenuItem>
        ))) : null}
      </Menu>
    </Box>
  );
}

export default NewItemsMenuButton;
