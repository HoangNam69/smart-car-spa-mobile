const { withAndroidManifest, withAppBuildGradle, withDangerousMod } = require('@expo/config-plugins');
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
      console.log(' Created network_security_config.xml to allow HTTP traffic');
    }

    return config;
  });
};

/**
 * Plugin to ensure Firebase Google Services plugin is applied correctly
 */
const withFirebaseGoogleServices = (config) => {
  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    // Check if Google Services plugin is already applied
    if (!buildGradle.includes("apply plugin: 'com.google.gms.google-services'")) {
      // Add Google Services plugin at the end of the file
      config.modResults.contents = buildGradle + "\n\napply plugin: 'com.google.gms.google-services'";
      console.log(' Added Google Services plugin to app/build.gradle');
    }
    
    return config;
  });
};

/**
 * Plugin to ensure google-services.json is copied to the correct location
 */
const withGoogleServicesJson = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const googleServicesSource = path.join(projectRoot, 'google-services.json');
      const googleServicesDest = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'google-services.json'
      );

      // Check if source file exists
      if (fs.existsSync(googleServicesSource)) {
        // Ensure destination directory exists
        const destDir = path.dirname(googleServicesDest);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }

        // Copy google-services.json to app directory
        fs.copyFileSync(googleServicesSource, googleServicesDest);
        console.log(' Copied google-services.json to android/app/');
      } else {
        console.warn(' Warning: google-services.json not found in project root');
      }

      return config;
    },
  ]);
};

/**
 * Combined plugin that applies network security, Firebase config, and Google Services JSON
 */
const withCustomConfig = (config) => {
  config = withNetworkSecurityConfig(config);
  config = withFirebaseGoogleServices(config);
  config = withGoogleServicesJson(config);
  return config;
};

module.exports = withCustomConfig;

