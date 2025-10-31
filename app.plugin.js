const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Custom Expo config plugin to enable HTTP (cleartext) traffic for development
 */
const withNetworkSecurityConfig = (config) => {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];

    // Check if networkSecurityConfig already exists
    if (!application.$['android:networkSecurityConfig']) {
      // Add network security config to AndroidManifest.xml
      application.$['android:networkSecurityConfig'] = '@xml/network_security_config';

      // Create the network_security_config.xml file in the res/xml directory
      const resDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res');
      const xmlDir = path.join(resDir, 'xml');
      const xmlFile = path.join(xmlDir, 'network_security_config.xml');

      // Create directories if they don't exist
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      // Write the network security config file
      const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>`;

      fs.writeFileSync(xmlFile, xmlContent);
      console.log('✅ Created network_security_config.xml to allow HTTP traffic');
    }

    return config;
  });
};

module.exports = withNetworkSecurityConfig;

