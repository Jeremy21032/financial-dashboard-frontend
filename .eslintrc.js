module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // Permitir warnings en CI sin que fallen el build
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': 'warn',
    'no-use-before-define': 'warn'
  },
  overrides: [
    {
      files: ['**/*.js', '**/*.jsx'],
      rules: {
        // Configuraciones específicas para archivos JS/JSX
      }
    }
  ]
};
