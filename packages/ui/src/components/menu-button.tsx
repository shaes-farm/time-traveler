'use client'
import React, {useState} from 'react';
import {IconButton, Menu, MenuItem, Tooltip} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface MenuButtonProps {
  onPrint: () => void;
  onDownload: () => void;
  onShare: () => void;
}

export function MenuButton(props: MenuButtonProps): JSX.Element {
  const {onPrint, onDownload, onShare} = props;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseAnd = (op: string): void => {
    setAnchorEl(null);
    switch (op) {
      case 'print': onPrint(); break;
      case 'download': onDownload(); break;
      case 'share': onShare(); break;
    }
  };
  return (
    <>
      <Tooltip title="Menu">
        <IconButton
          aria-controls={open ? 'timeline-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
          aria-label="options"
          id="timeline-menu-button"
          onClick={handleClick}
        >
          <MoreVertIcon />
        </IconButton>
      </Tooltip>
      <Menu
        MenuListProps={{
          'aria-labelledby': 'timeline-menu-button',
        }}
        anchorEl={anchorEl}
        id="timeline-menu"
        onClose={handleCloseAnd}
        open={open}
      >
        <MenuItem onClick={() => {handleCloseAnd('print')}}>Print</MenuItem>
        <MenuItem onClick={() => {handleCloseAnd('download')}}>Download</MenuItem>
        <MenuItem onClick={() => {handleCloseAnd('share')}}>Share</MenuItem>
      </Menu>
    </>
  );
}
