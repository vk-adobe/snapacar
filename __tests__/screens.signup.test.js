/**
 * Render tests for SignUpScreen (create account).
 */

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../src/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../src/hooks/useGoogleAuth', () => ({ useGoogleAuth: jest.fn() }));
jest.mock('../src/components/AppLogo', () => ({ AppLogo: () => null }));
jest.mock('../src/components/PasswordField', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return {
    PasswordField: (props) =>
      React.createElement(TextInput, { ...props, testID: 'password-field' }),
  };
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { useGoogleAuth } from '../src/hooks/useGoogleAuth';
import SignUpScreen from '../src/screens/SignUpScreen';

const navigation = { navigate: jest.fn(), goBack: jest.fn() };

const defaultAuth = {
  signUp: jest.fn(),
  signInWithGoogleIdToken: jest.fn(),
};

const defaultGoogle = {
  hasGoogle: false,
  request: null,
  busy: false,
  promptAsync: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue(defaultAuth);
  useGoogleAuth.mockReturnValue(defaultGoogle);
});

describe('SignUpScreen — renders', () => {
  it('shows the "Create account" title and button', () => {
    const { getAllByText } = render(<SignUpScreen navigation={navigation} />);
    // Both the page title and the submit button carry this text
    expect(getAllByText('Create account').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the display-name input', () => {
    const { getByPlaceholderText } = render(<SignUpScreen navigation={navigation} />);
    expect(getByPlaceholderText('Alex')).toBeTruthy();
  });

  it('shows the email input', () => {
    const { getByPlaceholderText } = render(<SignUpScreen navigation={navigation} />);
    expect(getByPlaceholderText('you@email.com')).toBeTruthy();
  });

  it('shows the password field', () => {
    const { getByTestId } = render(<SignUpScreen navigation={navigation} />);
    expect(getByTestId('password-field')).toBeTruthy();
  });

  it('renders both a heading and a submit button with the "Create account" label', () => {
    const { getAllByText } = render(<SignUpScreen navigation={navigation} />);
    // The title text and the PrimaryButton both render "Create account"
    expect(getAllByText('Create account').length).toBeGreaterThanOrEqual(2);
  });

  it('shows the sign-in link for existing users', () => {
    const { getByText } = render(<SignUpScreen navigation={navigation} />);
    expect(getByText(/Already have an account/i)).toBeTruthy();
  });

  it('shows the tagline mentioning credits leaderboard', () => {
    const { getByText } = render(<SignUpScreen navigation={navigation} />);
    expect(getByText(/credits leaderboard/i)).toBeTruthy();
  });
});

describe('SignUpScreen — interactions', () => {
  it('goes back when the sign-in link is pressed', () => {
    const { getByText } = render(<SignUpScreen navigation={navigation} />);
    fireEvent.press(getByText(/Already have an account/i));
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('calls signUp with name, email, and password on submit', async () => {
    const signUp = jest.fn().mockResolvedValue({ needsEmailConfirmation: false });
    useAuth.mockReturnValue({ ...defaultAuth, signUp });

    const { getByPlaceholderText, getByTestId, getAllByText } = render(
      <SignUpScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Alex'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('you@email.com'), 'new@test.com');
    fireEvent(getByTestId('password-field'), 'change', { nativeEvent: { text: 'pass123' } });
    // button text is "Create account" — pick the last occurrence (the button)
    fireEvent.press(getAllByText('Create account').slice(-1)[0]);

    await new Promise((r) => setTimeout(r, 0));
    expect(signUp).toHaveBeenCalledWith('new@test.com', 'pass123', 'Test User');
  });

  it('shows "Welcome" alert on successful registration', async () => {
    const signUp = jest.fn().mockResolvedValue({ needsEmailConfirmation: false });
    useAuth.mockReturnValue({ ...defaultAuth, signUp });

    const { getAllByText } = render(<SignUpScreen navigation={navigation} />);
    fireEvent.press(getAllByText('Create account').slice(-1)[0]);

    await new Promise((r) => setTimeout(r, 0));
    expect(Alert.alert).toHaveBeenCalledWith('Welcome', expect.stringContaining('Start spotting'));
  });

  it('shows an email-confirmation prompt when Supabase requires it', async () => {
    const signUp = jest.fn().mockResolvedValue({
      needsEmailConfirmation: true,
      email: 'confirm@test.com',
    });
    useAuth.mockReturnValue({ ...defaultAuth, signUp });

    const { getAllByText } = render(<SignUpScreen navigation={navigation} />);
    fireEvent.press(getAllByText('Create account').slice(-1)[0]);

    await new Promise((r) => setTimeout(r, 0));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Confirm your email',
      expect.stringContaining('confirm@test.com'),
      expect.any(Array)
    );
  });

  it('shows an error alert when signUp throws', async () => {
    const signUp = jest.fn().mockRejectedValue(new Error('already exists'));
    useAuth.mockReturnValue({ ...defaultAuth, signUp });

    const { getAllByText } = render(<SignUpScreen navigation={navigation} />);
    fireEvent.press(getAllByText('Create account').slice(-1)[0]);

    await new Promise((r) => setTimeout(r, 0));
    expect(Alert.alert).toHaveBeenCalledWith('Sign up failed', 'already exists');
  });
});
