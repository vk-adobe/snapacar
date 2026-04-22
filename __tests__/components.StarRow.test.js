/**
 * Component tests for StarRow and StarText.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StarRow, StarText } from '../src/components/StarRow';

describe('StarRow (interactive)', () => {
  it('renders 5 stars', () => {
    const { getAllByRole } = render(<StarRow value={3} onChange={() => {}} />);
    // Each star is a Pressable — getAllByRole for 'button' in RNTL
    // Stars are rendered as Pressable elements; use getAllByText instead
    const { getAllByText } = render(<StarRow value={3} onChange={() => {}} />);
    expect(getAllByText('★')).toHaveLength(5);
  });

  it('calls onChange with the tapped star index', () => {
    const onChange = jest.fn();
    const { getAllByText } = render(<StarRow value={1} onChange={onChange} />);
    const stars = getAllByText('★');
    fireEvent.press(stars[3]); // tap 4th star
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('does not call onChange in readonly mode', () => {
    const onChange = jest.fn();
    const { getAllByText } = render(<StarRow value={3} onChange={onChange} readonly />);
    const stars = getAllByText('★');
    fireEvent.press(stars[0]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies full opacity to selected stars and dimmed opacity to unselected', () => {
    const { getAllByText } = render(<StarRow value={3} onChange={() => {}} />);
    const stars = getAllByText('★');
    // First 3 selected (opacity 1), last 2 unselected (opacity 0.28)
    const flatten = (style) =>
      Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : (style || {});
    expect(flatten(stars[0].props.style)).toEqual(expect.objectContaining({ opacity: 1 }));
    expect(flatten(stars[4].props.style)).toEqual(expect.objectContaining({ opacity: 0.28 }));
  });
});

describe('StarText', () => {
  it('displays the correct number of filled stars', () => {
    const { getByText } = render(<StarText rating={4} />);
    // Should show 4 stars followed by (4.0)
    expect(getByText(/★{4}/)).toBeTruthy();
  });

  it('renders rating to 1 decimal place', () => {
    const { getByText } = render(<StarText rating={3.666} />);
    expect(getByText(/3\.7/)).toBeTruthy();
  });

  it('handles zero rating', () => {
    const { queryByText } = render(<StarText rating={0} />);
    // 0 stars — should not crash
    expect(queryByText(/0\.0/)).toBeTruthy();
  });

  it('caps display at 5 stars for rating > 5', () => {
    const { getByText } = render(<StarText rating={10} />);
    const text = getByText(/★+/);
    // children is ['★★★★★', <Text>...</Text>] — grab the star string
    const starStr = Array.isArray(text.props.children)
      ? text.props.children[0]
      : text.props.children;
    expect((starStr || '').match(/★/g)?.length).toBeLessThanOrEqual(5);
  });
});
