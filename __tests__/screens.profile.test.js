/**
 * Render tests for ProfileScreen — user info, credits display, ledger, profile fields.
 */

jest.mock('@react-navigation/bottom-tabs', () => ({ useBottomTabBarHeight: () => 0 }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../src/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../src/context/AppContext', () => ({ useApp: jest.fn() }));
jest.mock('../src/services/social', () => ({ fetchCreditLedger: jest.fn() }));
jest.mock('../src/utils/share', () => ({ shareCarSummary: jest.fn() }));

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { useApp } from '../src/context/AppContext';
import { fetchCreditLedger } from '../src/services/social';
import ProfileScreen from '../src/screens/ProfileScreen';

const navigation = { navigate: jest.fn(), goBack: jest.fn() };

const makeAuth = (overrides = {}) => ({
  session: {
    mode: 'cloud',
    userId: 'user-123',
    email: 'test@example.com',
    name: 'Jane Doe',
    profile: { credits: 42, lifetime_posts: 7, phone: '', city: '', bio: '' },
  },
  cloud: true,
  logout: jest.fn(),
  updateProfileFields: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeApp = () => ({
  getMyReviews: jest.fn(() => []),
  ready: true,
});

/** Flush pending effects/microtasks (e.g. fetchCreditLedger useEffect). */
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

beforeEach(async () => {
  jest.clearAllMocks();
  fetchCreditLedger.mockResolvedValue([]);
  useAuth.mockReturnValue(makeAuth());
  useApp.mockReturnValue(makeApp());
});

// ─── User info ───────────────────────────────────────────────────────────────

describe('ProfileScreen — user info', () => {
  it('shows the user display name', async () => {
    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();
    expect(getByText('Jane Doe')).toBeTruthy();
  });

  it('shows the user email', async () => {
    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('shows initials derived from the display name', async () => {
    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();
    expect(getByText('JD')).toBeTruthy();
  });

  it('shows a single initial when the name has no space', async () => {
    useAuth.mockReturnValue(makeAuth({
      session: { ...makeAuth().session, name: 'Alice' },
    }));
    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();
    expect(getByText('A')).toBeTruthy();
  });

  it('shows the Sign out button', async () => {
    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();
    expect(getByText('Sign out')).toBeTruthy();
  });

  it('calls logout when Sign out is pressed', async () => {
    const logout = jest.fn();
    useAuth.mockReturnValue(makeAuth({ logout }));

    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();

    fireEvent.press(getByText('Sign out'));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});

// ─── Credits display ─────────────────────────────────────────────────────────

describe('ProfileScreen — credits', () => {
  it('shows the "Spot credits" label in cloud mode', async () => {
    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();
    expect(getByText(/Spot credits/i)).toBeTruthy();
  });

  it('displays the current credit balance', async () => {
    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();
    expect(getByText('42')).toBeTruthy();
  });

  it('shows the lifetime posts count', async () => {
    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();
    expect(getByText(/Lifetime spots: 7/i)).toBeTruthy();
  });

  it('shows 0 credits when the profile credits field is null', async () => {
    useAuth.mockReturnValue(makeAuth({
      session: {
        mode: 'cloud', userId: 'u1', email: 'a@b.com', name: 'A',
        profile: { credits: null, lifetime_posts: 0 },
      },
    }));
    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();
    expect(getByText('0')).toBeTruthy();
  });

  it('hides the credits card in local (offline) mode', async () => {
    useAuth.mockReturnValue(makeAuth({
      cloud: false,
      session: { mode: 'local', userId: 'u1', email: 'a@b.com', name: 'A', profile: null },
    }));
    const { queryByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();
    expect(queryByText(/Spot credits/i)).toBeNull();
  });

  it('shows a Supabase hint in local mode', async () => {
    useAuth.mockReturnValue(makeAuth({
      cloud: false,
      session: { mode: 'local', userId: 'u1', email: 'a@b.com', name: 'A', profile: null },
    }));
    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();
    expect(getByText(/Local account/i)).toBeTruthy();
  });
});

// ─── Credit ledger ───────────────────────────────────────────────────────────

describe('ProfileScreen — credit ledger', () => {
  it('renders credit history entries', async () => {
    fetchCreditLedger.mockResolvedValue([
      { id: '1', delta: 10, reason: 'post_created', balance_after: 10, created_at: '2025-06-01T10:00:00Z' },
      { id: '2', delta: -2, reason: 'penalty',      balance_after: 8,  created_at: '2025-06-02T10:00:00Z' },
    ]);

    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();

    expect(getByText(/\+10 · post_created/)).toBeTruthy();
    expect(getByText(/-2 · penalty/)).toBeTruthy();
  });

  it('shows balance_after for each ledger row', async () => {
    fetchCreditLedger.mockResolvedValue([
      { id: '1', delta: 10, reason: 'post_created', balance_after: 10, created_at: '2025-06-01T00:00:00Z' },
    ]);

    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();

    expect(getByText(/Balance 10/)).toBeTruthy();
  });

  it('shows the Credit history section label when entries exist', async () => {
    fetchCreditLedger.mockResolvedValue([
      { id: '1', delta: 5, reason: 'like', balance_after: 5, created_at: '2025-01-01T00:00:00Z' },
    ]);

    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();

    expect(getByText(/Credit history/i)).toBeTruthy();
  });

  it('calls fetchCreditLedger with the user id and limit 30', async () => {
    render(<ProfileScreen navigation={navigation} />);
    await settle();
    expect(fetchCreditLedger).toHaveBeenCalledWith('user-123', 30);
  });
});

// ─── Profile update form ─────────────────────────────────────────────────────

describe('ProfileScreen — profile update', () => {
  it('shows the phone, city, and bio fields in cloud mode', async () => {
    const { getByPlaceholderText } = render(<ProfileScreen navigation={navigation} />);
    await settle();
    expect(getByPlaceholderText('+1…')).toBeTruthy();
    expect(getByPlaceholderText('Where you usually drive')).toBeTruthy();
    expect(getByPlaceholderText('A line about you & cars')).toBeTruthy();
  });

  it('shows the Save profile button', async () => {
    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();
    expect(getByText('Save profile')).toBeTruthy();
  });

  it('calls updateProfileFields with entered phone, city, and bio', async () => {
    const updateProfileFields = jest.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue(makeAuth({ updateProfileFields }));

    const { getByPlaceholderText, getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();

    fireEvent.changeText(getByPlaceholderText('+1…'), '+15551234567');
    fireEvent.changeText(getByPlaceholderText('Where you usually drive'), 'San Francisco');
    fireEvent.changeText(getByPlaceholderText('A line about you & cars'), 'Car enthusiast.');

    await act(async () => {
      fireEvent.press(getByText('Save profile'));
    });

    expect(updateProfileFields).toHaveBeenCalledWith({
      phone: '+15551234567',
      city: 'San Francisco',
      bio: 'Car enthusiast.',
    });
  });

  it('shows a "Saved" alert after a successful profile update', async () => {
    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();

    await act(async () => {
      fireEvent.press(getByText('Save profile'));
    });

    expect(Alert.alert).toHaveBeenCalledWith('Saved', 'Profile updated.');
  });

  it('shows an error alert when updateProfileFields throws', async () => {
    const updateProfileFields = jest.fn().mockRejectedValue(new Error('Network error'));
    useAuth.mockReturnValue(makeAuth({ updateProfileFields }));

    const { getByText } = render(<ProfileScreen navigation={navigation} />);
    await settle();

    await act(async () => {
      fireEvent.press(getByText('Save profile'));
    });

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network error');
  });

  it('retains field values across multiple keystrokes (no remount / keyboard dismiss)', async () => {
    const { getByPlaceholderText } = render(<ProfileScreen navigation={navigation} />);
    await settle();

    const phoneInput = getByPlaceholderText('+1…');
    const cityInput  = getByPlaceholderText('Where you usually drive');

    // Simulate typing char-by-char — if the screen remounts between events the value resets
    fireEvent.changeText(phoneInput, '+');
    fireEvent.changeText(phoneInput, '+1');
    fireEvent.changeText(phoneInput, '+15');
    fireEvent.changeText(phoneInput, '+155');

    fireEvent.changeText(cityInput, 'S');
    fireEvent.changeText(cityInput, 'SF');

    // Both fields should hold the latest value, not reset to initial
    expect(getByPlaceholderText('+1…').props.value).toBe('+155');
    expect(getByPlaceholderText('Where you usually drive').props.value).toBe('SF');
  });
});
