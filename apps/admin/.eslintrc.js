module.exports = {
  extends: require.resolve('@umijs/max/eslint'),
  overrides: [
    {
      files: ['.umirc.ts'],
      rules: {
        'import/no-unresolved': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
