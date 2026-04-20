module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss/nesting'),
    require('tailwindcss'),
    require('postcss-nested'),
    require('postcss-simple-vars'),
    require('postcss-preset-env')({
      stage: 1,
      features: {
        'nesting-rules': true,
      },
    }),
    require('autoprefixer'),
  ],
};
