const EncodingType = { Base64: 'base64', UTF8: 'utf8' };
const readAsStringAsync = jest.fn().mockResolvedValue('');
const writeAsStringAsync = jest.fn().mockResolvedValue(undefined);
const copyAsync = jest.fn().mockResolvedValue(undefined);
const makeDirectoryAsync = jest.fn().mockResolvedValue(undefined);
const deleteAsync = jest.fn().mockResolvedValue(undefined);
const getInfoAsync = jest.fn().mockResolvedValue({ exists: true, isDirectory: false });
const documentDirectory = 'file:///documents/';
const cacheDirectory = 'file:///cache/';

module.exports = {
  EncodingType,
  readAsStringAsync,
  writeAsStringAsync,
  copyAsync,
  makeDirectoryAsync,
  deleteAsync,
  getInfoAsync,
  documentDirectory,
  cacheDirectory,
};
