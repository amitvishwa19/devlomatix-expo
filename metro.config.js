const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Large apps can exhaust RAM when Metro spawns one worker per CPU core.
// Override with METRO_MAX_WORKERS when building on a machine with more headroom.
config.maxWorkers = Number(process.env.METRO_MAX_WORKERS) || 2;

module.exports = withNativeWind(config, { input: './global.css' });
