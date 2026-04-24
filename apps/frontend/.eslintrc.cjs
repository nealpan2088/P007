module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.js'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'import'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    
    // 导入相关规则 - 防止重复导入问题
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'off', // TypeScript会处理这个
    
    // 代码质量规则
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // 通用规则
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'no-alert': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { 'avoidEscape': true }],
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', {
      'anonymous': 'always',
      'named': 'never',
      'asyncArrow': 'always'
    }],
    
    // 🔒 硬编码检查规则
    // 禁止直接 navigate('字符串')
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name="navigate"] > Literal',
        message: '禁止硬编码导航路径，请使用路由常量（如 ADMIN_ROUTES.TENANTS.LIST）',
      },
      {
        selector: 'CallExpression[callee.name="navigate"] > TemplateLiteral',
        message: '禁止硬编码导航路径，请使用路由常量',
      },
      {
        selector: 'CallExpression[callee.name="fetch"] > Literal[value=/^\\/api/]',
        message: '禁止硬编码 API 路径，请使用 api-client.ts 的 apiGet/apiPost 等方法',
      },
      {
        selector: 'CallExpression[callee.name="fetch"] > TemplateLiteral[quasis.0.value.raw=/^\\/api/]',
        message: '禁止硬编码 API 路径，请使用 api-client.ts 的 apiGet/apiPost 等方法',
      },
      {
        selector: 'MemberExpression > Identifier[name="localStorage"] ~ CallExpression[callee.property.name="getItem"][arguments.0.value=/token|Token/]',
        message: '禁止手动读取 token，api-client.ts 会自动处理 Authorization header',
      },
      {
        selector: 'TemplateLiteral[quasis.0.value.raw=/Bearer/]',
        message: '禁止手动拼接 Authorization header，api-client.ts 会自动处理',
      },
    ],
    
    // React规则
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};