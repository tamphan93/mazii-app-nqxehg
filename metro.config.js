const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use turborepo to restore the cache when possible
config.cacheStores = [
    new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
  ];

// Add resolver configuration to handle platform-specific imports
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'sql'],
  assetExts: [...(config.resolver?.assetExts || []).filter(ext => ext !== 'sql'), 'db', 'wasm'],
};

module.exports = config;
