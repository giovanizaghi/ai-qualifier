module.exports = {
  load: jest.fn(),
  html: jest.fn(() => '<html></html>'),
  text: jest.fn(() => 'text content'),
  '$': jest.fn(() => ({
    length: 0,
    text: jest.fn(() => ''),
    attr: jest.fn(() => ''),
    find: jest.fn(() => ({ length: 0 }))
  }))
};