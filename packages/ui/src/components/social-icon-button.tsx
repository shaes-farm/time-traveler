'use client';

import XIcon from '@mui/icons-material/X';
import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import PinterestIcon from '@mui/icons-material/Pinterest';
import PublicIcon from '@mui/icons-material/Public';
import {
  IconButton,
  Tooltip,
} from '@mui/material';

const ICONS = {
  x: <XIcon />,
  twitter: <XIcon />,
  facebook: <FacebookIcon />,
  instagram: <InstagramIcon />,
  pinterest: <PinterestIcon />,
  youtube: <YouTubeIcon />,
  website: <PublicIcon />,
};

export interface SocialIconButtonProps {
  /**
   * The type of link.
   */
  type: 'x' | 'twitter' | 'facebook' | 'instagram' | 'pinterest' | 'youtube' | 'website';
  /**
   * Social account name, or site to navigate to when icon is clicked.
   */
  resource: string;
}

/**
 * Social media icon that opens in a new window / tab.
 */
export function SocialIconButton({ resource, type }: SocialIconButtonProps): JSX.Element {
  return (
    <Tooltip title={resource}>
      <IconButton onClick={() => { window.open(resource, "_blank", "noopener,noreferrer") }}>
        {ICONS[type]}
      </IconButton>
    </Tooltip>
  );
}
