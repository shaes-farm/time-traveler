'use client';
import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import DeleteIcon from '@mui/icons-material/Delete';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';

interface Item {
  slug: string;
  title: string;
  beginDate: string;
  endDate: string;
}

function not(a: readonly Item[], b: readonly Item[]): Item[] {
  return a.filter((item) => !b.includes(item));
}

// function intersection(a: readonly Item[], b: readonly Item[]): readonly Item[] {
//   return a.filter((item) => b.includes(item));
// }

// function union(a: readonly Item[], b: readonly Item[]): readonly Item[] {
//   return [...a, ...not(b, a)];
// }

function deduplicate(a: readonly Item[], b: readonly Item[]): Item[] {
  return a.filter((left) => !b.find((right) => left.slug === right.slug));
}

const compare = (a: Item, b: Item): number => {
  if (Number.isSafeInteger(a.beginDate) || Number.isSafeInteger(b.beginDate)) {
    const ab = Number.parseFloat(a.beginDate);
    const bb = Number.parseFloat(b.beginDate);
    const ae = Number.parseFloat(a.endDate);
    const be = Number.parseFloat(b.endDate);
    return (ab !== bb ? ab - bb : ae - be);
  }

  return a.beginDate !== b.beginDate ?
    a.beginDate.localeCompare(b.beginDate) :
    a.endDate.localeCompare(b.endDate);
};

interface ItemListProps {
  itemNames?: {
    singular: string;
    plural: string;
  };
  available: readonly Item[];
  items: readonly Item[];
  onChange: (items: readonly Item[]) => void;
  value: string;
}

export function ItemList({ itemNames, items, available, onChange, value }: ItemListProps): JSX.Element {
  const [left, setLeft] = useState<readonly Item[]>(deduplicate(available, items));
  const [right, setRight] = useState<readonly Item[]>(items);

  const handleSelectChange = (event: SelectChangeEvent): void => {
    const slug = event.target.value;
    console.log({ slug });
    const found = left.find((item) => item.slug === slug)
    console.log({ found });
    if (found) {
      setRight(right.concat([found]).sort(compare));
      setLeft(not(left, [found]).sort(compare));
    }
  };

  const handleDelete = (slug: string): void => {
    console.log({ slug });
    const found = right.find((item) => item.slug === slug);
    console.log({ found });
    if (found) {
      setLeft(left.concat([found]).sort(compare));
      setRight(not(right, [found]).sort(compare));
    }
  };

  useEffect(() => {
    onChange(right);
  }, [onChange, right]);

  return (
    <Card variant="outlined">
      <CardHeader
        sx={{ px: 2, py: 1 }}
        title={<FormControl fullWidth>
          <Select
            displayEmpty
            id="available-item-select"
            onChange={handleSelectChange}
            value={value}
          >
            <MenuItem value="">
              <em>{left.length > 0 ? `Select a ${itemNames?.singular ?? 'item'} to add` : `No ${itemNames?.plural} to add`}</em>
            </MenuItem>
            {left.map((item, index) => (
              <MenuItem key={Symbol(index).toString()} value={item.slug}>{item.title}</MenuItem>
            ))}
          </Select>
        </FormControl>
        }
      />
      <Divider />
      <CardContent>
        <List
          component="div"
          dense
          role="list"
          sx={{
            // width: '100%',
            maxHeight: '25em',
            overflow: 'auto',
          }}
        >
          {right.map((item) => {
            const labelId = `item-${item.slug}-label`;

            return (
              <ListItem
                key={item.slug}
                secondaryAction={
                  <IconButton aria-label="delete" edge="end" id={item.slug} onClick={() => { handleDelete(item.slug) }} size="small">
                    <DeleteIcon sx={{ width: '1em', height: '1em' }} />
                  </IconButton>
                }
              >
                <ListItemText id={labelId} primary={item.title} />
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}
