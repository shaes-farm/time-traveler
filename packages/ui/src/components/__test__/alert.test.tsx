import {cleanup, render} from '@testing-library/react';
import {Alert} from '../alert';

describe('Alert component', () => {
  afterEach(cleanup);
  
  it('should render an info alert message', () => {
    const component = render(<Alert severity="info" />);

    const alert = component.getByRole('alert');
    expect(alert).toBeDefined();
    expect(alert.className).toContain('MuiAlert-filledInfo');
  });
  
  it('should render a success alert message', () => {
    const component = render(<Alert severity="success" />);

    const alert = component.getByRole('alert');
    expect(alert).toBeDefined();
    expect(alert.className).toContain('MuiAlert-filledSuccess');
  });
  
  it('should render a warning alert message', () => {
    const component = render(<Alert severity="warning" />);

    const alert = component.getByRole('alert');
    expect(alert).toBeDefined();
    expect(alert.className).toContain('MuiAlert-filledWarning');
  });
  
  it('should render an error alert message', () => {
    const component = render(<Alert severity="error" />);

    const alert = component.getByRole('alert');
    expect(alert).toBeDefined();
    expect(alert.className).toContain('MuiAlert-filledError');
  });
});
