module.exports = {
  maybeCompleteAuthSession: jest.fn(() => ({ type: 'dismissed' })),
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
  openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
  dismissBrowser: jest.fn(),
  WebBrowserResultType: { CANCEL: 'cancel', DISMISS: 'dismiss', OPENED: 'opened' },
};
