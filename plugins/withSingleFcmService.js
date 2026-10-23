const { withAndroidManifest } = require('expo/config-plugins');

const EXPO_FCM_SERVICE = 'expo.modules.notifications.service.ExpoFirebaseMessagingService';

module.exports = function withSingleFcmService(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application?.[0];
    if (!application) return config;

    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools';

    const services = application.service || [];
    const alreadyRemoved = services.some(
      (service) =>
        service.$?.['android:name'] === EXPO_FCM_SERVICE &&
        service.$?.['tools:node'] === 'remove'
    );

    if (!alreadyRemoved) {
      services.push({
        $: {
          'android:name': EXPO_FCM_SERVICE,
          'tools:node': 'remove',
        },
      });
      application.service = services;
    }

    return config;
  });
};
