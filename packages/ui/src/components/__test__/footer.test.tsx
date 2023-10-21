import React from 'react';
import {render, screen} from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {config} from '../../stories/config';
import {Footer} from '../footer';

const {app} = config;

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
    render(<Footer app={app} menu={menu} />);
  
    // await userEvent.click(screen.getByText('home'))
    // await screen.findByRole('heading')
  
    expect(screen.getByRole('contentinfo')).toHaveTextContent('jimbo pickins')
    expect(screen.getByRole('navigation')).toHaveTextContent('home')
  });
});
