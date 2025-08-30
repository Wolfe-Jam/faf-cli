// Mock chalk for Jest testing

const mockChalk = {
  red: (text) => text,
  green: (text) => text,
  yellow: (text) => text,
  blue: (text) => text,
  cyan: (text) => text,
  magenta: (text) => text,
  white: (text) => text,
  gray: (text) => text,
  grey: (text) => text,
  bold: (text) => text,
  dim: (text) => text,
  italic: (text) => text,
  underline: (text) => text,
  strikethrough: (text) => text
};

// Chain support for methods like chalk.red.bold()
Object.keys(mockChalk).forEach(key => {
  mockChalk[key].red = mockChalk.red;
  mockChalk[key].green = mockChalk.green;
  mockChalk[key].yellow = mockChalk.yellow;
  mockChalk[key].blue = mockChalk.blue;
  mockChalk[key].cyan = mockChalk.cyan;
  mockChalk[key].magenta = mockChalk.magenta;
  mockChalk[key].white = mockChalk.white;
  mockChalk[key].gray = mockChalk.gray;
  mockChalk[key].grey = mockChalk.grey;
  mockChalk[key].bold = mockChalk.bold;
  mockChalk[key].dim = mockChalk.dim;
  mockChalk[key].italic = mockChalk.italic;
  mockChalk[key].underline = mockChalk.underline;
  mockChalk[key].strikethrough = mockChalk.strikethrough;
});

module.exports = mockChalk;