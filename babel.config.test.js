// Minimal babel config for Jest — converts ESM → CJS and strips TypeScript/JSX.
// Does NOT load the full expo babel preset to avoid the winter-runtime import.meta issue.
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
};
