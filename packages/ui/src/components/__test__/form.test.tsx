import {cleanup, render} from '@testing-library/react';
import {Form} from '../form';

describe('Form component', () => {
  afterEach(cleanup);
  
  it('should render a Form', () => {
    const component = render(<Form />);

    expect(component).not.toBeNull();
  });
});
