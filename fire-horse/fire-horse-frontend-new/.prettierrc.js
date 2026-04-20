module.exports = {
  // Use single quotes instead of double quotes
  singleQuote: true,
  
  // Print trailing commas wherever possible when multi-line
  trailingComma: 'es5',
  
  // Use 2 spaces for indentation
  tabWidth: 2,
  
  // Use spaces instead of tabs
  useTabs: false,
  
  // Print semicolons at the ends of statements
  semi: true,
  
  // Line width before wrapping
  printWidth: 100,
  
  // JSX: Use double quotes in JSX
  jsxSingleQuote: false,
  
  // JSX: Put > on a new line
  jsxBracketSameLine: false,
  
  // Include parentheses around a sole arrow function parameter
  arrowParens: 'always',
  
  // Respect .gitignore
  requirePragma: false,
  
  // Format the entire contents of the file
  insertPragma: false,
  
  // How to handle whitespace in HTML
  htmlWhitespaceSensitivity: 'css',
  
  // Line endings (lf for Linux/Mac, crlf for Windows)
  endOfLine: 'auto',
  
  // Control how Prettier formats quoted code embedded in the file
  embeddedLanguageFormatting: 'auto',
  
  // Override settings for specific files
  overrides: [
    {
      files: '*.json',
      options: {
        parser: 'json',
        tabWidth: 2,
      },
    },
    {
      files: '*.{css,scss,less,styl}',
      options: {
        parser: 'css',
        tabWidth: 2,
      },
    },
    {
      files: '*.{yaml,yml}',
      options: {
        parser: 'yaml',
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        proseWrap: 'preserve',
      },
    },
    {
      files: '*.mdx',
      options: {
        parser: 'mdx',
        proseWrap: 'preserve',
      },
    },
  ],
};
