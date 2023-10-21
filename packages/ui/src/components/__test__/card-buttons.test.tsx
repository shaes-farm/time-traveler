import React from 'react';
import {render, screen} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {CardButtons} from '../card-buttons';

describe('CardButtons component', () => {
  const dummy = jest.fn();

  test('displays buttons to like, share, and subscribe', async () => {
    render(<CardButtons onLike={dummy} onShare={dummy} onSubscribe={dummy} />);
    
    const like = screen.getByLabelText('like');
    expect(like).toBeVisible();
    await userEvent.click(like);
    expect(dummy).toHaveBeenCalledTimes(1);

    const share = screen.getByLabelText('share');
    expect(share).toBeVisible();
    await userEvent.click(share);
    expect(dummy).toHaveBeenCalledTimes(2);

    const subscribe = screen.getByLabelText('subscribe');
    expect(subscribe).toBeVisible();
    await userEvent.click(subscribe);
    expect(dummy).toHaveBeenCalledTimes(3);
  });
});
