import React from 'react';
import {cleanup, render} from '@testing-library/react';
import {Copyright} from '../copyright';

const year = new Date().getFullYear();

describe('Copyright component', () => {

  afterEach(cleanup);
  
  it('should render a Copyright with year', () => {
    const component = render(
      <Copyright
        holder="site owner"
        url="http://localhost"
        year={year}
      />
    );

    expect(component.getByText(`Copyright © ${year} by`)).not.toBeNull();
  });

  it('should render a Copyright with a year range', () => {
    const component = render(
      <Copyright
        holder="Protected Works Holder"
        url="http://localhost"
        year={year - 1}
      />
    );

    expect(component.getByText(`Copyright © ${year-1}-${year} by`)).not.toBeNull();
  });
});
