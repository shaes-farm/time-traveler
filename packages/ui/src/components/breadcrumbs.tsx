'use client';
import React from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography
} from '@mui/material';

export interface Crumb {
  label: string;
  link?: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
}

export function Breadcrumbs(props: BreadcrumbsProps): JSX.Element {
  const {crumbs} = props;
  return (
    <MuiBreadcrumbs aria-label="breadcrumb">
      {crumbs.map((crumb) => crumb.link ? (
        <Link
          color="inherit"
          href={crumb.link}
          key={Symbol(crumb.label).toString()}
          underline="hover"
        >
          {crumb.label}
        </Link>
      ) : (
        <Typography
          color="text.primary"
          key={Symbol(crumb.label).toString()}
        >
          {crumb.label}
        </Typography>
      ))}
    </MuiBreadcrumbs>        
  );
}
