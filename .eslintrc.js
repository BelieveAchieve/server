module.exports = {
  env: {
    jest: true
  },
  extends: ['prettier-standard'],
  rules: {
    'handle-callback-err': ['error', '^(err|error)$'],
    'no-debugger': 'warn'
  },
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser', // Specifies the ESLint parser
      extends: [
        'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
        'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
        'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
        'plugin:import/errors',
        'plugin:import/typescript'
      ],
      rules: {
        'prettier/prettier': [
          'error',
          {
            semi: true,
            singleQuote: true
          }
        ],
        semi: 'off',
        '@typescript-eslint/semi': ['error', 'always'],
        quotes: ['error', 'single'],
        'import/order': 'error'
      },
      parserOptions: {
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module' // Allows for the use of imports
      }
    }
  ]
}
