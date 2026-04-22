const React = require('react');
const { Text } = require('react-native');

// Lightweight stub — renders the icon name as accessible text so tests can query it
const IconStub = ({ name, ...props }) =>
  React.createElement(Text, { ...props, testID: `icon-${name}` }, name || '');

module.exports = { Ionicons: IconStub };
