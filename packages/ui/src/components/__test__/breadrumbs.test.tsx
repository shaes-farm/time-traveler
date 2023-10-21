import React from 'react';
import {render, screen} from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import {Breadcrumbs} from '../breadcrumbs';

const crumbs = [{
  label: 'one',
  link: '#',
},{
  label: 'two',
  link: '#',
},{
  label: 'three',
}];

describe('Breadcrumbs component', () => {
  test('displays the breadcrumb trail', () => {
    render(<Breadcrumbs crumbs={crumbs} />);
  
    // await userEvent.click(screen.getByText('Load Greeting'))
    // await screen.findByRole('heading')
  
    expect(screen.getByRole('navigation')).toHaveTextContent('one/two/three')
  });
});
