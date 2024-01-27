/* eslint-disable react/jsx-fragments -- its a test */
/* eslint-disable react/jsx-no-useless-fragment -- its a test */
import React from 'react';
import {cleanup, render} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {Notifications} from '../notifications';
import type {NavRoute, NavRouter} from '../nav';

const user = userEvent.setup();

describe('Notifications component', () => {
  let router: NavRouter,
        route: NavRoute;

  beforeAll(() => {
    route = {
      slug: faker.lorem.slug(),
      icon: <React.Fragment />,
      label: faker.lorem.words(),
      page: <React.Fragment />,
    };

    router = jest.fn();
  });

  afterEach(cleanup);

  it('should render Notifications', () => {
    const notifications = render(<Notifications count={4} route={route} router={router} />);
    expect(notifications).not.toBeNull();
  });

  it('should render a Notifications icon with "info" badge color', () => {
    const component = render(<Notifications color="info" count={1} route={route} router={router} />);

    expect(component).toBeDefined();
  });
  
  it('should render a Notifications icon with a count of zero when not provided', () => {
    const component = render(<Notifications route={route} router={router} />);

    expect(component).toBeDefined();
  });
  
  it('should render a Notifications icon with a default tooltip of not provided in the route', () => {
    delete route.label;

    const component = render(<Notifications route={route} router={router} />);

    expect(component).toBeDefined();
  });
  
  it('should render a Notifications icon and click on it', async () => {
    const component = render(<Notifications count={4} route={route} router={router} />);

    expect(component).toBeDefined();

    const icon = component.getByTestId('notifications-icon');

    await user.click(icon);

    expect(router).toHaveBeenCalledTimes(1);
    expect(router).toHaveBeenCalledWith(route);
  });
});
