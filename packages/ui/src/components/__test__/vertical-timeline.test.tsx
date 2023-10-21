import React from 'react';
import {render, screen} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { timeline } from '../../stories/timeline';
import {VerticalTimeline, type TimelineMarker} from '../vertical-timeline';

describe('VerticalTimeline component', () => {
  let markers: TimelineMarker[];

  beforeEach(() => {
    markers = JSON.parse(JSON.stringify(timeline.events)) as TimelineMarker[];
  });

  it('should display a vertical timeline', () => {
    render(<VerticalTimeline markers={markers} />);
  
    expect(screen.getByRole('list')).toHaveClass('MuiTimeline-root');
  });

  it('should ensure each event has a link with a label', () => {
    render(<VerticalTimeline markers={markers} />);
  
    const links = screen.getAllByRole('link');
    links.forEach((link, index) => {
      expect(link).toHaveTextContent(markers[index].title);
    });
  });

  it('should display a vertical timeline in reverse order', () => {
    render(<VerticalTimeline markers={markers} reverse />);
  
    expect(screen.getByRole('list')).toHaveClass('MuiTimeline-root');
  });

  it('should display a vertical timeline in alternating order', () => {
    render(<VerticalTimeline alternate markers={markers} />);
  
    expect(screen.getByRole('list')).toHaveClass('MuiTimeline-root');
  });

  it('should display a vertical timeline in alternating reverse order', () => {
    render(<VerticalTimeline alternate markers={markers} reverse />);
  
    expect(screen.getByRole('list')).toHaveClass('MuiTimeline-root');
  });

  it('should display a vertical timeline without opposite text', () => {
    render(<VerticalTimeline markers={markers} opposite={false} />);
  
    expect(screen.getByRole('list')).toHaveClass('MuiTimeline-root');
  });

  it('should display a vertical timeline without summary text', () => {
    render(<VerticalTimeline markers={markers} summary={false} />);
  
    expect(screen.getByRole('list')).toHaveClass('MuiTimeline-root');
  });

  it('should display a vertical timeline with colored dots and text', () => {
    render(<VerticalTimeline colored markers={markers} />);
  
    expect(screen.getByRole('list')).toHaveClass('MuiTimeline-root');
  });

  it('should display a vertical timeline with outlined dots', () => {
    render(<VerticalTimeline markers={markers} outlined />);
  
    expect(screen.getByRole('list')).toHaveClass('MuiTimeline-root');
  });

  it('should display a vertical timeline and override the styles', () => {
    render(<VerticalTimeline markers={markers} sx={{ px: 1 }} />);
  
    expect(screen.getByRole('list')).toHaveClass('MuiTimeline-root');
  });

  it('should display an event without a date if begin date is empty', () => {
    markers[0].beginDate = '';
    render(<VerticalTimeline markers={markers} opposite />);
  
    expect(screen.getByRole('list')).toHaveClass('MuiTimeline-root');
  });

  it('should display an event without a date range if end date is null', () => {
    markers[0].endDate = null;
    render(<VerticalTimeline markers={markers} opposite />);
  
    expect(screen.getByRole('list')).toHaveClass('MuiTimeline-root');
  });

  it('should display an event without a date range if dates are the same', () => {
    markers[0].endDate = markers[0].beginDate;
    render(<VerticalTimeline markers={markers} opposite />);
  
    expect(screen.getByRole('list')).toHaveClass('MuiTimeline-root');
  });

  it('should ignore user click if onSelect handler is not configured', async () => {
    render(<VerticalTimeline markers={markers} />);
  
    expect(screen.getByRole('list')).toHaveClass('MuiTimeline-root');
  
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(3);

    await userEvent.click(links[0]); // Achieve 100% code coverage with default action
  });

  it('should allow user to click on an event to navigate', async () => {
    const onSelect = jest.fn();

    render(<VerticalTimeline markers={markers} onSelect={onSelect} />);
  
    const links = screen.getAllByRole('link');
    await userEvent.click(links[0]);
    expect(onSelect).toHaveBeenCalled();
  });
});
