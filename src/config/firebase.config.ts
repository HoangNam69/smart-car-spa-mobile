import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

// Firebase config - tách biệt giữa web và mobile
const webConfig = {
  apiKey: "AIzaSyC7_FziwkhkCMxGqzs8PNgexsG3qrsXvv4",
  authDomain: "scsms-106.firebaseapp.com",
  projectId: "scsms-106",
  storageBucket: "scsms-106.firebasestorage.app",
  messagingSenderId: "94039662872",
  appId: "1:94039662872:web:4f063e8e52560b7a053e6d",
};

const mobileConfig = {
  apiKey: "AIzaSyDvzCdj6cAdKXmIY7Ao_JdC-EtEBWJszSU",
  authDomain: "scsms-106.firebaseapp.com",
  projectId: "scsms-106",
  storageBucket: "scsms-106.firebasestorage.app",
  messagingSenderId: "94039662872",
  appId: "1:94039662872:android:d444a91a1f013d62053e6d",
};

// Sử dụng config phù hợp với platform
const firebaseConfig = Platform.OS === 'web' ? webConfig : mobileConfig;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;

