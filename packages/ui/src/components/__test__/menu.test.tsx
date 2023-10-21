import React from 'react';
import {render, screen} from '@testing-library/react';
// import {userEvent} from '@testing-library/user-event';
import {Menu, type LabeledRoute} from '../menu';

const menu: LabeledRoute[] = [{
  label: 'one',
  route: '#one',
},{
  label: 'two',
  route: '#two',
},{
  label: 'three',
  route: '#three',
}];

describe('Menu component', () => {
  test('displays a menu', () => {
    render(<Menu menu={menu} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeVisible();
  });

  test('has provided text labels', () => {
    render(<Menu menu={menu} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeVisible();

    expect(nav).toHaveTextContent('one');
    expect(nav).toHaveTextContent('two');
    expect(nav).toHaveTextContent('three');
  });

  test('has provided href links', () => {
    render(<Menu menu={menu} />);

    const links = screen.getAllByRole('link');
    links.forEach((link, index) => {
      expect(link).toBeVisible();
      expect(link).toHaveAttribute('href', menu[index].route)
    });
  });
});
