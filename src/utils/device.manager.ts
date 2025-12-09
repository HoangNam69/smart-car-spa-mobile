/**
 * Device Manager for Expo
 * Manages device identification for multi-device login support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'device_id';
const DEVICE_NAME_KEY = 'device_name';

/**
 * Get or generate device ID
 * Device ID is persistent across sessions for the same device
 */
export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Try to get device ID from expo-device
      if (Device.isDevice) {
        // Use device's unique ID if available
        const deviceName = Device.deviceName || Device.modelName || 'Unknown Device';
        // Generate a stable ID based on device info
        deviceId = await generateDeviceId(deviceName);
      } else {
        // For simulator/emulator, generate a stable ID
        deviceId = await generateDeviceId(Platform.OS);
      }
      
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback: generate a temporary ID
    return generateRandomId();
  }
}

/**
 * Get device name (human-readable)
 */
export async function getDeviceName(): Promise<string> {
  try {
    let deviceName = await AsyncStorage.getItem(DEVICE_NAME_KEY);
    
    if (!deviceName) {
      deviceName = await detectDeviceName();
      await AsyncStorage.setItem(DEVICE_NAME_KEY, deviceName);
    }
    
    return deviceName;
  } catch (error) {
    console.error('Error getting device name:', error);
    return 'Unknown Device';
  }
}

/**
 * Generate a stable device ID based on device info
 */
async function generateDeviceId(deviceName: string): Promise<string> {
  try {
    // Try to use a combination of device info for a stable ID
    const osName = Platform.OS;
    const osVersion = Platform.Version;
    const deviceModel = Device.modelName || Device.deviceName || 'Unknown';
    
    // Create a hash-like string from device info
    const deviceInfo = `${osName}-${osVersion}-${deviceModel}-${deviceName}`;
    
    // Simple hash function (not cryptographically secure, but good enough for device ID)
    let hash = 0;
    for (let i = 0; i < deviceInfo.length; i++) {
      const char = deviceInfo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `mobile-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
  } catch (error) {
    console.error('Error generating device ID:', error);
    return generateRandomId();
  }
}

/**
 * Generate a random device ID
 */
function generateRandomId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `mobile-${timestamp}-${random}`;
}

/**
 * Detect device name from device info
 */
async function detectDeviceName(): Promise<string> {
  try {
    const osName = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS;
    const osVersion = Platform.Version;
    
    let deviceInfo = '';
    
    if (Device.isDevice) {
      const brand = Device.brand || 'Unknown';
      const modelName = Device.modelName || Device.deviceName || 'Device';
      deviceInfo = `${brand} ${modelName}`;
    } else {
      // Simulator/Emulator
      deviceInfo = `${osName} Simulator`;
    }
    
    return `${deviceInfo} (${osName} ${osVersion})`;
  } catch (error) {
    console.error('Error detecting device name:', error);
    return `${Platform.OS} Device`;
  }
}

/**
 * Clear device info (useful for logout or device reset)
 */
export async function clearDeviceInfo(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(DEVICE_ID_KEY),
      AsyncStorage.removeItem(DEVICE_NAME_KEY),
    ]);
  } catch (error) {
    console.error('Error clearing device info:', error);
  }
}

