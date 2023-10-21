import React from 'react';
import {render, screen} from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import {ErrorCard} from '../error-card';

describe('ErrorCard component', () => {
  test('displays the error card', () => {
    render(<ErrorCard message="Error Message" title="Error" />);
  
    // await userEvent.click(screen.getByText('Load Greeting'))
    // await screen.findByRole('heading')
  
    expect(screen.getByText('Something Unexpected Happened')).toBeDefined();
  });
});
