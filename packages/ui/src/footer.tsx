import {Box, Divider, Link, Typography} from '@mui/material';

interface FooterProps {
  app: {
    copyright: {
      year: number;
      url: string;
      holder: string;
    }
  }
  baseUrl?: string;
  disclaimerPath?: string;
  privacyPath?: string;
  termsPath?: string;
}

export function Footer(props: FooterProps): JSX.Element {
  const {
    app: {
      copyright: {
        year,
        url,
        holder,
      },
    },
    baseUrl = 'http://locahost:3000',
    disclaimerPath = '/disclaimer',
    privacyPath = '/privacy',
    termsPath = '/terms',
  } = props;

  return (
    <footer>
      <Box sx={{ textAlign: 'center', py: '1em' }}>
        <Typography component="div" variant="body2">
          <Link
            color="inherit"
            href={new URL(disclaimerPath, baseUrl).toString()}
            underline="hover"
          >
            disclaimer
          </Link>
          &nbsp;|&nbsp;
          <Link
            color="inherit"
            href={new URL(privacyPath, baseUrl).toString()}
            underline="hover"
          >
            privacy&nbsp;policy
          </Link>
          &nbsp;|&nbsp;
          <Link
            color="inherit"
            href={new URL(termsPath, baseUrl).toString()}
            underline="hover"
          >
            terms&nbsp;of&nbsp;use
          </Link>
        </Typography>
        <Divider sx={{ my: '1em' }} />
        <Typography component="div" variant="body2">
          copyright &copy; {year}&nbsp;
          <Link
            color="inherit"
            href={url}
            underline="hover"
          >
            {holder.toLowerCase()}
          </Link>. all rights reserved.
        </Typography>
      </Box>
    </footer>      
  );
}
