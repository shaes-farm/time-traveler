import React from 'react';
import {render, screen} from '@testing-library/react';
import {ErrorCard} from '../error-card';

describe('ErrorCard component', () => {
  test('displays the error card', () => {
    render(<ErrorCard message="Error Message" title="Error" />);
  
    expect(screen.getByText('Something Unexpected Happened')).toBeVisible();
  });
});
