const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js v2.100+ includes @opentelemetry/api which uses
// dynamic import() expressions that Hermes cannot compile. Stub it out —
// Supabase still works, just without OTel tracing.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@opentelemetry/')) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
