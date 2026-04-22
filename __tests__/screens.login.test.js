/**
 * Render tests for LoginScreen.
 * Supabase and all native deps are mocked so the component tree renders in Node.
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
import LoginScreen from '../src/screens/LoginScreen';

const navigation = { navigate: jest.fn(), goBack: jest.fn() };

const defaultAuth = {
  login: jest.fn(),
  signInWithGoogleIdToken: jest.fn(),
  cloud: false,
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

describe('LoginScreen — renders', () => {
  it('shows the app name', () => {
    const { getByText } = render(<LoginScreen navigation={navigation} />);
    expect(getByText('SnapACar')).toBeTruthy();
  });

  it('shows the email input', () => {
    const { getByPlaceholderText } = render(<LoginScreen navigation={navigation} />);
    expect(getByPlaceholderText('you@email.com')).toBeTruthy();
  });

  it('shows the password field', () => {
    const { getByTestId } = render(<LoginScreen navigation={navigation} />);
    expect(getByTestId('password-field')).toBeTruthy();
  });

  it('shows the Sign in button', () => {
    const { getByText } = render(<LoginScreen navigation={navigation} />);
    expect(getByText('Sign in')).toBeTruthy();
  });

  it('shows the create-account link', () => {
    const { getByText } = render(<LoginScreen navigation={navigation} />);
    expect(getByText(/Create an account/i)).toBeTruthy();
  });

  it('shows the tagline', () => {
    const { getByText } = render(<LoginScreen navigation={navigation} />);
    expect(getByText(/Spot cool cars/i)).toBeTruthy();
  });
});

describe('LoginScreen — interactions', () => {
  it('navigates to SignUp when the create-account link is pressed', () => {
    const { getByText } = render(<LoginScreen navigation={navigation} />);
    fireEvent.press(getByText(/New here/i));
    expect(navigation.navigate).toHaveBeenCalledWith('SignUp');
  });

  it('calls login with entered email and password on submit', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ ...defaultAuth, login });

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <LoginScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('you@email.com'), 'user@test.com');
    fireEvent(getByTestId('password-field'), 'change', { nativeEvent: { text: 'secret123' } });
    fireEvent.press(getByText('Sign in'));

    await new Promise((r) => setTimeout(r, 0));
    expect(login).toHaveBeenCalledWith('user@test.com', 'secret123');
  });

  it('shows an Alert when login throws', async () => {
    const login = jest.fn().mockRejectedValue(new Error('No account found.'));
    useAuth.mockReturnValue({ ...defaultAuth, login });

    const { getByText } = render(<LoginScreen navigation={navigation} />);
    fireEvent.press(getByText('Sign in'));

    await new Promise((r) => setTimeout(r, 0));
    expect(Alert.alert).toHaveBeenCalledWith('Sign in failed', expect.stringContaining('No account found'));
  });

  it('shows the Google button when hasGoogle is true', () => {
    useGoogleAuth.mockReturnValue({ ...defaultGoogle, hasGoogle: true, request: {} });
    const { getByText } = render(<LoginScreen navigation={navigation} />);
    expect(getByText(/Continue with Google/i)).toBeTruthy();
  });

  it('does not show the Google button when hasGoogle is false', () => {
    const { queryByText } = render(<LoginScreen navigation={navigation} />);
    expect(queryByText(/Continue with Google/i)).toBeNull();
  });
});
