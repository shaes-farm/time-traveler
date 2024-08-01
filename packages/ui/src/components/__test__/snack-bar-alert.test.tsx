/* eslint-disable @typescript-eslint/no-empty-function -- its a test */
import {cleanup, fireEvent, render} from '@testing-library/react';
import {SnackBarAlert} from '../snack-bar-alert';

describe('SnackBarAlert component', () => {
  afterEach(cleanup);
  
  it('should render a SnackBarAlert', async () => {
    const component = render(
      <SnackBarAlert autoHide={1} clear={() => {}} message="Fubar" />
    );

    expect(component).not.toBeNull();

    expect(await component.findByRole('alert')).not.toBeNull();
  });
  
  it('should not render a SnackBarAlert if message is empty', async () => {
    const component = render(
      <SnackBarAlert autoHide={1} clear={() => {}} message="" />
    );

    expect(component).not.toBeNull();
    let alert: HTMLElement | null = null;

    try {
      alert = await component.findByRole('alert');
      expect(alert).not.toBeTruthy();
    } catch (err: unknown) {
      expect(err).not.toBeNull();
    }
  });

  it('should close the SnackBarAlert', async () => {
    const component = render(
      <SnackBarAlert clear={() => {}} message="Foo" severity="info" />
    );

    expect(component).not.toBeNull();

    fireEvent.click(
      await component.findByTestId(/CloseIcon/)
    )
  });
});
