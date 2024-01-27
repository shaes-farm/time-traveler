'use client';
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import type {MenuProps} from '@mui/material/Menu';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import MenuItem from '@mui/material/MenuItem';
import type { Profile } from '../providers';
import type { NavRoute, NavRouter } from './nav';

export interface ProfileButtonProps extends Partial<MenuProps> {
  routes: NavRoute[];
  router: NavRouter;
  profile: Profile;
}

export function ProfileButton({routes, router, profile, ...menuProps}: ProfileButtonProps): JSX.Element {
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const openUserMenu = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorElUser(event.currentTarget);
  };

  const closeUserMenu = (): void => {
    setAnchorElUser(null);
  };

  return (
    <Box sx={{ flexGrow: 0, ml: 2 }}>
      <Tooltip title={`${profile.firstName} ${profile.lastName}`}>
        <Button
          aria-label="user profile"
          color="inherit"
          endIcon={<ArrowDropDownOutlinedIcon />}
          onClick={openUserMenu}
          size="large"
          sx={{ p: 0 }}
          variant="text"
        >
          <Avatar
            alt={`${profile.firstName} ${profile.lastName}`}
            src={profile.avatarUrl ?? ''}
            sx={{ width: 32, height: 32 }}
          />
        </Button>
      </Tooltip>
      <Menu
        id="profile-routes"
        sx={{ mt: '45px' }}
        {...menuProps}
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        onClose={closeUserMenu}
        open={Boolean(anchorElUser)}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {routes.length ? (routes.map((route) => (route.slug === 'div' ?
          <Divider key={Symbol(route.slug).toString()} />
        :
          <MenuItem key={route.slug} onClick={() => {
            closeUserMenu();
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
};

export default ProfileButton;