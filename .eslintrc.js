module.exports = {
    extends: 'erb',
    plugins: ['@typescript-eslint'],
    rules: {
        'prettier/prettier': 'off',
        // A temporary hack related to IDE not resolving correct package.json
        'import/no-extraneous-dependencies': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/jsx-filename-extension': 'off',
        'import/extensions': 'off',
        'import/no-unresolved': 'off',
        'import/no-import-module-exports': 'off',
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'react/jsx-no-bind': 'off',
        'react/jsx-props-no-spreading': 'off',
        'import/prefer-default-export': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'react/destructuring-assignment': 'off',
        'promise/catch-or-return': 'off',
        'no-useless-constructor': 'off',
        'no-empty-function': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'promise/always-return': 'off',
        'camelcase': 'off',
        'no-restricted-syntax': 'off',
        'no-continue': 'off',
        'no-plusplus': 'off',
        'react/require-default-props': 'off',
        semi: 'error',
        'no-await-in-loop': 'off',
        // 操作符前后需要空格
        'no-nested-ternary': 'off',
        'space-infix-ops': 'error',
        'jsx-a11y/click-events-have-key-events': 'off',
        'import/no-cycle': 'off',
        indent: ['error', 4],
        'import/no-mutable-exports': 'off',
        'class-methods-use-this': 'off',
        // 关键词前后需要空格
        'keyword-spacing': [
            'error',
            {
                before: true,
                after: true,
                overrides: {
                    if: { after: false }, // if () 的括号前不需要空格
                    for: { after: false }, // for () 的括号前不需要空格
                    while: { after: false }, // while () 的括号前不需要空格
                    switch: { after: false }, // switch () 的括号前不需要空格
                    catch: { after: false }, // catch () 的括号前不需要空格
                },
            },
        ],

        'consistent-return': 'off',
        'no-console': 'off',

        quotes: ['error', 'single'],

        // 箭头函数箭头前后需要空格
        'arrow-spacing': ['error', { before: true, after: true }],

        // 块语句的花括号前需要空格
        'space-before-blocks': 'error',
        // 函数声明的函数名和参数列表之间不需要空格
        'space-before-function-paren': [
            'error',
            {
                anonymous: 'always', // 匿名函数：function () 需要空格
                named: 'never', // 命名函数：function foo() 不需要空格
                asyncArrow: 'always', // 异步箭头函数：async () => 需要空格
            },
        ],
        'prefer-destructuring': 'off',
        'no-underscore-dangle': 'off',
        'no-use-before-define': ['error', { 'functions': false }],

        // 模板字符串中大括号内部不需要空格
        'template-curly-spacing': ['error', 'never'],

        // 对象字面量花括号内部前后空格
        'object-curly-spacing': ['error', 'always'],

        // 数组方括号内部前后不需要空格
        'array-bracket-spacing': ['error', 'never'],

        // 代码块花括号内部前后空格
        'block-spacing': 'error',
        // 逗号前面不要空格，后面需要空格
        'comma-spacing': ['error', { before: false, after: true }],

        // 计算属性内部不需要空格
        'computed-property-spacing': ['error', 'never'],

        // 函数调用时，函数名和括号之间不需要空格
        'func-call-spacing': ['error', 'never'],
    },
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
    settings: {
        'import/resolver': {
            // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
                moduleDirectory: ['node_modules', 'src/'],
            },
            webpack: {
                config: require.resolve(
                    './.erb/configs/webpack.config.eslint.ts',
                ),
            },
            typescript: {},
        },
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
    },
};
