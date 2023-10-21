import React from 'react';
import {render, screen} from '@testing-library/react';
import {CustomError} from '../custom-error';

describe('CustomError component', () => {
  test('displays the custom error message', () => {
    render(<CustomError message="Error Message" status={404} />);
  
    expect(screen.getByText('404')).toBeVisible();
    expect(screen.getByText('Error Message')).toBeVisible();
  });

  test('displays the custom error message without status', () => {
    render(<CustomError message="Error Message" />);
  
    expect(screen.getByText('Error Message')).toBeVisible();
  });
});
