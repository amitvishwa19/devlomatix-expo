module.exports = ({ config }) => {
  const isDev =
    process.env.APP_VARIANT === 'development' ||
    process.env.EAS_BUILD_PROFILE === 'development';

  const name = isDev ? 'Devlomatix (Dev)' : 'Devlomatix';
  const packageName = isDev
    ? 'com.devlomatixsolutions.devlomatix.dev'
    : 'com.devlomatixsolutions.devlomatix';
  const scheme = isDev ? 'devlomatix-dev' : 'devlomatix';

  return {
    ...config,
    name,
    scheme,
    ios: {
      ...config.ios,
      bundleIdentifier: packageName,
    },
    android: {
      ...config.android,
      package: packageName,
    },
  };
};
