module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      'nativewind/babel',
      [
        'module-resolver',
        {
          alias: {
            '@': './src',
            '@civicsense/types': '../../packages/types/src',
            '@civicsense/business-logic': '../../packages/business-logic/src',
            '@civicsense/design-tokens': '../../packages/design-tokens/src',
          },
          extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.json', '.ts', '.tsx'],
        },
      ],
    ],
  };
};