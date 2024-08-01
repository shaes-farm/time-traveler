import React from 'react';
import {render, screen} from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {config} from '../../stories/config';
import {Header} from '../header';

const {app: {
  title,
  description,
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

describe('Header component', () => {
  test('displays the header', () => {
    render(
      <Header
        description={description}
        menu={menu}
        title={title}
      />
    );
  
    // await userEvent.click(screen.getByText('home'))
    // await screen.findByRole('heading')
  
    expect(screen.getByRole('heading')).toHaveTextContent('The Application Title')
    expect(screen.getByRole('navigation')).toHaveTextContent('home')
  });
});
