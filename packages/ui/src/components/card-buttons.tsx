import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import SubscribeIcon from '@mui/icons-material/AlternateEmail';

export interface CardButtonsProps {
  onLike: () => void;
  onShare: () => void;
  onSubscribe: () => void;
}

export function CardButtons(props: CardButtonsProps): JSX.Element {
  const {onLike, onShare, onSubscribe} = props;
  return (
    <Box>
      <Tooltip title="Like">
        <IconButton aria-label="like" onClick={onLike}>
          <FavoriteIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Share">
        <IconButton aria-label="share" onClick={onShare}>
          <ShareIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Subscribe">
        <IconButton aria-label="subscribe" onClick={onSubscribe}>
          <SubscribeIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
