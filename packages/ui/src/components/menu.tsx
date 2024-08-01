'use client';
import {Link} from '@mui/material';
import type {LabeledRoute} from '../models';

interface MenuProps {
  menu: LabeledRoute[];
}

export function Menu({menu}: MenuProps): JSX.Element {
  return (
    <nav>
      {menu.map((item, index) => (
        <span key={Symbol(index).toString()}>
          <Link
            color="inherit"
            href={item.route}
            underline="hover"
          >
            {item.label}
          </Link>
          {index < (menu.length-1) ? <>&nbsp;|&nbsp;</> : null}
        </span>
      ))}
    </nav>
  );
}

export type {LabeledRoute} from '../models';
