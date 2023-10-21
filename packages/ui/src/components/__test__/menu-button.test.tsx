import React from 'react';
import {render, screen} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {MenuButton} from '../menu-button';

const dummy = jest.fn();

describe('MenuButton component', () => {
  it('should display a button to print, download, or share', () => {
    render(<MenuButton onDownload={dummy} onPrint={dummy} onShare={dummy} />);

    const menu = screen.getByLabelText('options');
    expect(menu).toBeVisible();
    expect(dummy).not.toHaveBeenCalled();
  });

  it('should click on the menu, then click on print', async () => {
    const onPrint = jest.fn();

    render(<MenuButton onDownload={dummy} onPrint={onPrint} onShare={dummy} />);

    const beforeClickPrint = screen.queryByText('Print');
    expect(beforeClickPrint).toBeNull();
    
    const menu = screen.getByLabelText('options');
    expect(menu).toBeVisible();
    await userEvent.click(menu);

    const print = screen.getByText('Print');
    expect(print).toBeVisible();
    await userEvent.click(print);

    expect(onPrint).toHaveBeenCalled();
    expect(dummy).not.toHaveBeenCalled();

    const afterClickPrint = screen.queryByText('Print');
    expect(afterClickPrint).toBeNull();
  });

  it('should click on the menu, then click on download', async () => {
    const onDownload = jest.fn();

    render(<MenuButton onDownload={onDownload} onPrint={dummy} onShare={dummy} />);

    const beforeClickDownload = screen.queryByText('Download');
    expect(beforeClickDownload).toBeNull();
    
    const menu = screen.getByLabelText('options');
    expect(menu).toBeVisible();
    await userEvent.click(menu);

    const download = screen.getByText('Download');
    expect(download).toBeVisible();
    await userEvent.click(download);

    expect(onDownload).toHaveBeenCalled();
    expect(dummy).not.toHaveBeenCalled();

    const afterClickDownload = screen.queryByText('Download');
    expect(afterClickDownload).toBeNull();
  });

  it('should click on the menu, then click on share', async () => {
    const onShare = jest.fn();

    render(<MenuButton onDownload={dummy} onPrint={dummy} onShare={onShare} />);

    const beforeClickShare = screen.queryByText('Share');
    expect(beforeClickShare).toBeNull();
    
    const menu = screen.getByLabelText('options');
    expect(menu).toBeVisible();
    await userEvent.click(menu);

    const share = screen.getByText('Share');
    expect(share).toBeVisible();
    await userEvent.click(share);

    expect(onShare).toHaveBeenCalled();
    expect(dummy).not.toHaveBeenCalled();

    const afterClickShare = screen.queryByText('Share');
    expect(afterClickShare).toBeNull();
  });
});
