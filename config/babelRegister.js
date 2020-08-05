const path = require('path');

require('@babel/register')({
  presets: ['@babel/preset-env'],
  extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts', '.tsx'],
  cwd: path.join(__dirname, '..'),
});
