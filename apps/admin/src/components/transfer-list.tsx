'use client';
import {useEffect, useState} from 'react';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface TransferListItem {
    slug: string;
    title: string;
}

function not(a: readonly TransferListItem[], b: readonly TransferListItem[]): readonly TransferListItem[] {
  return a.filter((item) => !b.includes(item));
}

function intersection(a: readonly TransferListItem[], b: readonly TransferListItem[]): readonly TransferListItem[] {
  return a.filter((item) => b.includes(item));
}

function union(a: readonly TransferListItem[], b: readonly TransferListItem[]): readonly TransferListItem[] {
  return [...a, ...not(b, a)];
}

function deduplicate(a: readonly TransferListItem[], b: readonly TransferListItem[]): readonly TransferListItem[] {
  return a.filter((left) => !b.find((right) => left.slug === right.slug));
}

interface TransferListProps {
  items: readonly TransferListItem[];
  available: readonly TransferListItem[];
  onChange: (items: readonly TransferListItem[]) => void;
}

export function TransferList({items, available, onChange}: TransferListProps): JSX.Element {
  const [checked, setChecked] = useState<readonly TransferListItem[]>([]);
  const [left, setLeft] = useState<readonly TransferListItem[]>(deduplicate(available, items));
  const [right, setRight] = useState<readonly TransferListItem[]>(items);

  const leftChecked = intersection(checked, left);
  const rightChecked = intersection(checked, right);

  const handleToggle = (t: TransferListItem) => () => {
    const currentIndex = checked.indexOf(t);
    const newChecked = [...checked];
    if (currentIndex === -1) {
      newChecked.push(t);
    } else {
      newChecked.splice(currentIndex, 1);
    }
    setChecked(newChecked);
  };

  const numberOfChecked = (t: readonly TransferListItem[]): number =>
    intersection(checked, t).length;

  const handleToggleAll = (t: readonly TransferListItem[]) => () => {
    if (numberOfChecked(t) === t.length) {
      setChecked(not(checked, t));
    } else {
      setChecked(union(checked, t));
    }
  };

  const handleCheckedRight = (): void => {
    setRight(right.concat(leftChecked));
    setLeft(not(left, leftChecked));
    setChecked(not(checked, leftChecked));
  };

  const handleCheckedLeft = (): void => {
    setLeft(left.concat(rightChecked));
    setRight(not(right, rightChecked));
    setChecked(not(checked, rightChecked));
  };

  useEffect(() => {
    onChange(right);
  }, [onChange, right]);

  const customList = (title: React.ReactNode, list: readonly TransferListItem[]): JSX.Element => (
    <Card>
      <CardHeader
        avatar={
          <Checkbox
            checked={numberOfChecked(list) === list.length && list.length !== 0}
            disabled={list.length === 0}
            indeterminate={
              numberOfChecked(list) !== list.length && numberOfChecked(list) !== 0
            }
            inputProps={{
              'aria-label': 'all list selected',
            }}
            onClick={handleToggleAll(list)}
          />
        }
        subheader={`${numberOfChecked(list)}/${list.length} selected`}
        sx={{ px: 2, py: 1 }}
        title={title}
      />
      <Divider />
      <List
        component="div"
        dense
        role="list"
        sx={{
          width: 350,
          height: '25em',
          bgcolor: 'background.paper',
          overflow: 'auto',
        }}
      >
        {list.map((item: TransferListItem) => {
          const labelId = `transfer-list-all-item-${item.slug}-label`;

          return (
            <ListItemButton
              key={item.slug}
              onClick={handleToggle(item)}
              role="listitem"
            >
              <ListItemIcon>
                <Checkbox
                  checked={checked.includes(item)}
                  disableRipple
                  inputProps={{
                    'aria-labelledby': labelId,
                  }}
                  tabIndex={-1}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={item.title} />
            </ListItemButton>
          );
        })}
      </List>
    </Card>
  );

  return (
    <Grid alignItems="center" container justifyContent="center" spacing={2}>
      <Grid item>{customList('Available', left)}</Grid>
      <Grid item>
        <Grid alignItems="center" container direction="column">
          <Button
            aria-label="move selected right"
            disabled={leftChecked.length === 0}
            onClick={handleCheckedRight}
            size="small"
            sx={{ my: 0.5, py: 0.5 }}
            variant="outlined"
          >
            <ArrowForwardIcon />
          </Button>
          <Button
            aria-label="move selected left"
            disabled={rightChecked.length === 0}
            onClick={handleCheckedLeft}
            size="small"
            sx={{ my: 0.5, py: 0.5 }}
            variant="outlined"
          >
            <ArrowBackIcon />
          </Button>
        </Grid>
      </Grid>
      <Grid item>{customList('Assigned', right)}</Grid>
    </Grid>
  );
}
