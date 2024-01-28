import React from 'react';
import {render, screen} from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {config} from '../../stories/config';
import {Footer} from '../footer';

const {app: {
  copyright: {
    year,
    url,
    holder,
  }
}} = config;

const menu = [{
  label: 'home',
  route: '/',
},{
  label: 'about',
  route: '/about',
},{
  label: 'contact',
  route: '/contact',
}];

describe('Footer component', () => {
  test('displays the footer', () => {
    render(
      <Footer
        holder={holder}
        menu={menu}
        url={url}
        year={year}
      />
    );
  
    // await userEvent.click(screen.getByText('home'))
    // await screen.findByRole('heading')
  
    expect(screen.getByRole('contentinfo')).toHaveTextContent('jimbo pickins')
    expect(screen.getByRole('navigation')).toHaveTextContent('home')
  });
});
