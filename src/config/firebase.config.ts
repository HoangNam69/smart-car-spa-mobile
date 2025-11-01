import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';

// Export auth directly from @react-native-firebase/auth
// It automatically reads google-services.json for Android and GoogleService-Info.plist for iOS
export { auth };

// For backward compatibility with existing imports
export default auth;

