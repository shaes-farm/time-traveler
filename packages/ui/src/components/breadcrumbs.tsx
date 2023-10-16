import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography
} from '@mui/material';

export interface BreadCrumb {
  link?: string;
  label: string;
}

export interface BreadcrumbsProps {
  crumbs: BreadCrumb[];
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
