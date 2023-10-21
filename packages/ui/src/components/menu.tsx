'use client';
import React from 'react';
import {Link} from '@mui/material';
import type {LabeledRoute} from '../models';

export interface MenuProps {
  menu: LabeledRoute[];
}

export function Menu(props: MenuProps): JSX.Element {
  const {
    menu,
  } = props;

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
