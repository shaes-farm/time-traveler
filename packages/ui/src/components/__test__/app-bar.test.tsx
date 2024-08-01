import {cleanup, render} from '@testing-library/react';
import {AppBar} from '../app-bar';

describe('AppBar component', () => {
  afterEach(cleanup);
  
  it('should render an AppBar', () => {
    const component = render(<AppBar />);

    expect(component).not.toBeNull();
  });
  
  it('should render an AppBar with an open drawer', () => {
    const component = render(<AppBar open />);

    expect(component).not.toBeNull();
  });
});
