import React from 'react';
import {render, screen} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {ThemeProvider} from '@mui/material/styles';
import {darkTheme} from '../../stories/themes';
import {HorizontalStepper} from '../horizontal-stepper';

describe('HorizontalStepper component', () => {
  const dummy = jest.fn();
  const steps = [{
    label: 'Step 1',
    onClick: dummy,
  }, {
    label: 'Step 2',
    onClick: dummy,
  }, {
    label: 'Step 3',
    onClick: dummy,
  }, {
    label: 'Step 4',
    onClick: dummy,
  }, {
    label: 'Step 5',
    onClick: dummy,
  }, {
    label: 'Step 6',
    onClick: dummy,
  }];

  it('should display a series of horizontal steps', () => {
    render(<HorizontalStepper steps={steps} />);
    
    expect(screen.getByText('Step 1')).toBeVisible();
    expect(screen.getByText('Step 2')).toBeVisible();
    expect(screen.getByText('Step 3')).toBeVisible();
    expect(screen.getByText('Step 4')).toBeVisible();
    expect(screen.getByText('Step 5')).toBeVisible();
    expect(screen.getByText('Step 6')).toBeVisible();
  });

  it('should preselect the active step on render', () => {
    render(<HorizontalStepper activeStep={2} steps={steps} />);
    
    const step1 = screen.getByText('Step 1');
    expect(step1).toBeVisible();
    expect(step1.parentElement).toHaveClass('Mui-completed');

    const step2 = screen.getByText('Step 2');
    expect(step2).toBeVisible();
    expect(step2.parentElement).toHaveClass('Mui-active');

    const step3 = screen.getByText('Step 3');
    expect(step3).toBeVisible();
    expect(step3.parentElement).toHaveClass('Mui-disabled');
  });

  it('should allow a user to click on a step', async () => {
    render(<HorizontalStepper steps={steps} />);
    
    const step2 = screen.getByText('Step 2');
    expect(step2).toBeVisible();

    await userEvent.click(step2);
    expect(dummy).toHaveBeenCalledTimes(1);
  });

  it('should render in dark mode', () => {
    render(
      <ThemeProvider theme={darkTheme}>
        <HorizontalStepper steps={steps} />
      </ThemeProvider>
    );

    expect(screen.getByText('Step 1')).toBeVisible();
    expect(screen.getByText('Step 2')).toBeVisible();
    expect(screen.getByText('Step 3')).toBeVisible();
    expect(screen.getByText('Step 4')).toBeVisible();
    expect(screen.getByText('Step 5')).toBeVisible();
    expect(screen.getByText('Step 6')).toBeVisible();
  });
});
