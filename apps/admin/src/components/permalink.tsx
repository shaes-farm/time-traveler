'use client';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
} from '@mui/material';

interface PermalinkProps {
  url: URL | string;
}

export function Permalink({ url }: PermalinkProps): JSX.Element {
  return (
    <TextField
      InputProps={{
        endAdornment:
          <InputAdornment position="end" >
            <Tooltip placement="top" title="Visit site">
              <IconButton
                aria-label="visit site"
                edge="end"
                onClick={() => { window.open(url) }}
                size="small"
              >
                <OpenInNewIcon sx={{ height: '0.75em', width: '0.75em' }} />
              </IconButton>
            </Tooltip>
          </InputAdornment>
      }}
      disabled
      fullWidth
      id="url"
      label="Permalink"
      name="url"
      value={url.toString()}
      variant="standard"
    />
  );
}