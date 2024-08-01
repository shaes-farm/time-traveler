'use client';

import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

interface LinkIconButtonProps {
  /**
   * The icon to link.
   */
  icon: React.ReactNode;
  /**
   * Route to navigate to when icons is clicked.
   */
  resource: URL | string;
  /**
   * The link target.
   */
  target?: string;
  /**
   * The button tooltip.
   */
  tooltip?: string;
  /**
   * The link features
   */
  features?: string;
}

/**
 * Messages component that combines a Mail icon with a tooltip and a badge showing a count of messages. Calls the router with the route when clicked.
 */
export function LinkIconButton({ icon, resource, target, tooltip, features }: LinkIconButtonProps): JSX.Element {
  return (
    <Tooltip title={tooltip}>
      <IconButton onClick={() => { window.open(resource, target, features) }}>
        {icon}
      </IconButton>
    </Tooltip>
  );
}
