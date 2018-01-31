'use strict';

module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'yandex-personal/es6',
        'yandex-personal/jsdoc'
    ],
    env: {
        node: true
    },
    rules: {
        'prefer-spread': 'off' // node.js 4
    },
    overrides: [
        {
            files: '**/*.spec.js',
            env: {
                mocha: true
            },
            globals: {
                expect: true
            },
            rules: {
                'no-unused-expressions': 'off'
            }
        }
    ]
};
