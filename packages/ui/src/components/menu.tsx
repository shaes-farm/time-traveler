import {Link} from '@mui/material';
import type {LabeledRoute} from '../models';

interface MenuProps {
  menu: LabeledRoute[];
}

export function Menu(props: MenuProps): JSX.Element {
  const {
    menu,
  } = props;

  return (
    <nav>
      {menu.map((item, index) => (
        <>
          <Link
            color="inherit"
            href={item.route}
            key={Symbol(index).toString()}
            underline="hover"
          >
            {item.label}
          </Link>
          {index < (menu.length-1) ? <>&nbsp;|&nbsp;</> : null}
        </>
      ))}
    </nav>
  );
}

export type {LabeledRoute} from '../models';
