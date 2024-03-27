import debugLogger from 'debug';
import React from 'react';
// import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import type { NavRoute } from './nav';
import {Form} from './form';

const debug = debugLogger('admin:ui:search-input');

interface SearchInputProps {
  /**
   * The route to navigate to when search icon is clicked or enter is pressed.
   */
  route: NavRoute
  /**
   * The router used to perform the navigation.
   */
   router: (route: NavRoute) => void
}

/**
 * An input component with search and properties icons.
 */
export function SearchInput({router, route}: SearchInputProps): JSX.Element {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    // debug('Submit event handler called!');
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    debug({data: data.get('search')});
    const query = route;
    query.page = `${route.page as string}?q=${data.get('search')?.toString() ?? ''}`;
    debug({query: query.page});
    // TODO: Get search string and pass thru router
    router(query);
  };

  return (
    <Form // component={Paper}
      onSubmit={handleSubmit}
      sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 350 }}
    >
      <Tooltip title={route.label ?? 'Search'}>
        <IconButton aria-label="search button" sx={{ p: '10px' }} type="submit">
          <SearchIcon />
        </IconButton>
      </Tooltip>
      <InputBase
        inputProps={{ 'aria-label': 'search keywords' }}
        name="search"
        placeholder="Search"
        sx={{ ml: 1, flex: 1 }}
      />
      <Tooltip title="Refined Search">
        <IconButton aria-label="search menu" sx={{ p: '10px' }}>
          <TuneIcon />
        </IconButton>
      </Tooltip>
    </Form>
  );
};

export default SearchInput;
