import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    singleQuote: true, // 使用单引号
    semi: true, // 句尾加分号
    trailingComma: 'all', // 尾逗号：all = 所有位置都加
    printWidth: 100, // 每行最大宽度（字符数）
    indentWidth: 2, // 缩进空格数
    useTabs: false, // 用空格缩进，不用 Tab
    endOfLine: 'lf', // 换行符：lf = Unix 风格
    bracketSpacing: true, // 花括号内加空格 { foo }
    arrowParens: 'always', // 箭头函数参数始终加括号
    ignorePatterns: [
      '.astro',
      '.claude',
      '.trellis',
      'dist',
      'pnpm-lock.yaml',
      'LICENSE.md',
      'tsconfig.json',
      'tsconfig.*.json',
      'scripts',
    ],
  },
  lint: {
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
    options: { typeAware: true, typeCheck: true },
  },
});
