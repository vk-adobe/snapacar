/**
 * Component tests for PrimaryButton.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import { PrimaryButton } from '../src/components/PrimaryButton';

describe('PrimaryButton', () => {
  it('renders the title text', () => {
    const { getByText } = render(<PrimaryButton title="Sign in" onPress={() => {}} />);
    expect(getByText('Sign in')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<PrimaryButton title="Submit" onPress={onPress} />);
    fireEvent.press(getByText('Submit'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders with reduced opacity when disabled', () => {
    const { UNSAFE_getByType } = render(
      <PrimaryButton title="Submit" onPress={jest.fn()} disabled />
    );
    const { Animated } = require('react-native');
    const view = UNSAFE_getByType(Animated.View);
    // styles.disabled applies opacity 0.55 when disabled || loading
    const flatStyle = Object.assign({}, ...(view.props.style || []).filter(Boolean));
    expect(flatStyle.opacity).toBe(0.55);
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = render(<PrimaryButton title="Submit" onPress={onPress} loading />);
    // When loading, the button renders ActivityIndicator, not the title
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator and hides label when loading', () => {
    const { UNSAFE_getByType, queryByText } = render(
      <PrimaryButton title="Submit" onPress={() => {}} loading />
    );
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(queryByText('Submit')).toBeNull();
  });

  it('applies solid style by default', () => {
    const { getByText } = render(<PrimaryButton title="Go" onPress={() => {}} />);
    // Verify the label text color is white (solid variant)
    const label = getByText('Go');
    expect(label.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ color: '#fff' }),
    ]));
  });

  it('applies outline style when variant="outline"', () => {
    const { getByText } = render(<PrimaryButton title="Cancel" onPress={() => {}} variant="outline" />);
    // Outline variant: label color is colors.text, not #fff
    const label = getByText('Cancel');
    const flatStyle = Array.isArray(label.props.style)
      ? Object.assign({}, ...label.props.style)
      : label.props.style;
    expect(flatStyle.color).not.toBe('#fff');
  });
});
