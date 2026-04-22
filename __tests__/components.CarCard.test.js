/**
 * Component tests for CarCard.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CarCard } from '../src/components/CarCard';

const BASE = {
  make: 'Porsche',
  model: '911',
  year: '2022',
  avgRating: 4.5,
  reviewCount: 3,
  previewUrl: null,
  onPress: jest.fn(),
};

describe('CarCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders make text', () => {
    const { getByText } = render(<CarCard {...BASE} />);
    expect(getByText('Porsche')).toBeTruthy();
  });

  it('renders model text', () => {
    const { getByText } = render(<CarCard {...BASE} />);
    expect(getByText('911')).toBeTruthy();
  });

  it('renders the year', () => {
    const { getByText } = render(<CarCard {...BASE} />);
    expect(getByText('2022')).toBeTruthy();
  });

  it('renders the camera icon in the spot count badge when reviewCount > 0', () => {
    // The Ionicons mock renders <Text testID="icon-camera-outline">camera-outline</Text>
    const { getByTestId } = render(<CarCard {...BASE} />);
    expect(getByTestId('icon-camera-outline')).toBeTruthy();
  });

  it('renders rating badge when avgRating is provided', () => {
    const { getByText } = render(<CarCard {...BASE} />);
    expect(getByText('4.5')).toBeTruthy();
  });

  it('does not render rating badge when avgRating is null', () => {
    const { queryByText } = render(<CarCard {...BASE} avgRating={null} />);
    expect(queryByText('4.5')).toBeNull();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<CarCard {...BASE} onPress={onPress} />);
    fireEvent.press(getByText('911'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders an Image when previewUrl is provided', () => {
    const { UNSAFE_getByType } = render(
      <CarCard {...BASE} previewUrl="https://example.com/car.jpg" />
    );
    const { Image } = require('react-native');
    const img = UNSAFE_getByType(Image);
    expect(img.props.source.uri).toBe('https://example.com/car.jpg');
  });

  it('does not render the car-sport placeholder icon when previewUrl is set', () => {
    const { queryByTestId } = render(
      <CarCard {...BASE} previewUrl="https://example.com/car.jpg" />
    );
    // placeholder renders icon-car-sport-outline; should be absent when image provided
    expect(queryByTestId('icon-car-sport-outline')).toBeNull();
  });

  it('does not render spot badge icon when reviewCount is 0', () => {
    const { queryByTestId } = render(<CarCard {...BASE} reviewCount={0} />);
    expect(queryByTestId('icon-camera-outline')).toBeNull();
  });
});
