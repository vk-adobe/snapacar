// Minimal React Native mock — only includes what our test files actually use.
const React = require('react');

const noop = () => {};
const noopComponent = ({ children }) => children || null;

const StyleSheet = {
  create: (styles) => styles,
  flatten: (style) => (Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style || {}),
  hairlineWidth: 1,
  absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
};

const Animated = {
  Value: class {
    constructor(val) { this._val = val; }
    setValue(v) { this._val = v; }
  },
  spring: (anim, config) => ({ start: (cb) => { if (cb) cb({ finished: true }); } }),
  timing: (anim, config) => ({ start: (cb) => { if (cb) cb({ finished: true }); } }),
  View: ({ style, children, ...rest }) =>
    React.createElement('View', { style, ...rest }, children),
  Text: ({ style, children, ...rest }) =>
    React.createElement('Text', { style, ...rest }, children),
};

const Text = ({ style, children, testID, ...rest }) =>
  React.createElement('Text', { style, testID, ...rest }, children);

const View = ({ style, children, testID, ...rest }) =>
  React.createElement('View', { style, testID, ...rest }, children);

const Image = ({ style, source, testID, ...rest }) =>
  React.createElement('Image', { style, source, testID, ...rest });

const Pressable = ({ onPress, onPressIn, onPressOut, children, disabled, style, ...rest }) => {
  const resolvedStyle = typeof style === 'function' ? style({ pressed: false }) : style;
  return React.createElement(
    'Pressable',
    { onPress: disabled ? undefined : onPress, onPressIn, onPressOut, style: resolvedStyle, disabled, ...rest },
    typeof children === 'function' ? children({ pressed: false }) : children
  );
};

const TextInput = ({ style, onChangeText, value, testID, ...rest }) =>
  React.createElement('TextInput', {
    style, value, testID,
    onChange: (e) => onChangeText && onChangeText(e.nativeEvent?.text ?? ''),
    ...rest,
  });

const ActivityIndicator = ({ color, size, testID }) =>
  React.createElement('ActivityIndicator', { color, size, testID });

const ScrollView = ({ children, contentContainerStyle, ...rest }) =>
  React.createElement('View', { style: contentContainerStyle, ...rest }, children);

const FlatList = ({ data = [], renderItem, ListHeaderComponent, ListEmptyComponent, keyExtractor, contentContainerStyle }) => {
  const header = ListHeaderComponent
    ? (typeof ListHeaderComponent === 'function' ? React.createElement(ListHeaderComponent) : ListHeaderComponent)
    : null;
  const items = data.length === 0
    ? (ListEmptyComponent ? (typeof ListEmptyComponent === 'function' ? React.createElement(ListEmptyComponent) : ListEmptyComponent) : null)
    : data.map((item, index) => renderItem({ item, index, separators: {} }));
  return React.createElement('FlatList', null, header, ...(Array.isArray(items) ? items : [items]));
};

const Alert = { alert: jest.fn() };
const Platform = { OS: 'ios', select: (obj) => obj.ios ?? obj.default };
const KeyboardAvoidingView = ({ children, ...rest }) =>
  React.createElement('View', rest, children);

module.exports = {
  StyleSheet,
  Animated,
  Text,
  View,
  Image,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Alert,
  Platform,
  KeyboardAvoidingView,
  RefreshControl: noopComponent,
  TouchableOpacity: Pressable,
};
