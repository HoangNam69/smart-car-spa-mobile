import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

class TokenStorage {
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken),
        AsyncStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken),
      ]);
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw new Error('Không thể lưu token');
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  async setUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw new Error('Không thể lưu thông tin người dùng');
    }
  }

  async getUserData(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(TOKEN_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(TOKEN_KEYS.USER_DATA),
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw new Error('Không thể xóa token');
    }
  }

  async hasValidTokens(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const refreshToken = await this.getRefreshToken();
      return !!(accessToken && refreshToken);
    } catch (error) {
      console.error('Error checking tokens:', error);
      return false;
    }
  }
}

export const tokenStorage = new TokenStorage();
export default tokenStorage;
