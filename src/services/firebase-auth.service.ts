import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Lazy load Firebase để tránh lỗi khi chạy trong Expo Go
let firebaseAuth: typeof import('@react-native-firebase/auth').default | null = null;

async function getFirebaseAuth() {
  if (!firebaseAuth) {
    try {
      const authModule = await import('@react-native-firebase/auth');
      // @react-native-firebase/auth exports default directly
      firebaseAuth = authModule.default || authModule;
      
      // Kiểm tra xem module có hợp lệ không
      if (!firebaseAuth || typeof firebaseAuth.signInWithPhoneNumber !== 'function') {
        throw new Error(
          'Firebase Auth module không hợp lệ. Vui lòng sử dụng development build.\n' +
          'Native module RNFBAppModule not found. Re-check module install, linking, configuration, build and install steps.'
        );
      }
      
      return firebaseAuth;
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      throw new Error(
        `Firebase Auth không khả dụng. Vui lòng sử dụng development build hoặc build native app.\n` +
        `Lỗi: ${errorMessage}\n` +
        `Hướng dẫn: Chạy lệnh "npx expo run:android" hoặc "npx expo run:ios" để build development build.`
      );
    }
  }
  return firebaseAuth;
}

// Types
export interface SignupData {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface FirebaseAuthError {
  code: string;
  message: string;
}

export interface PhoneAuthData {
  phoneNumber: string;
  verificationCode?: string;
}

// Type aliases for compatibility with existing code
// Định nghĩa types tương thích với Firebase để tránh phụ thuộc vào import ở top-level
// Sử dụng any cho ConfirmationResult vì type từ Firebase phức tạp và phụ thuộc vào native module
export type ConfirmationResult = any;

export interface User {
  uid: string;
  phoneNumber?: string | null;
  email?: string | null;
  displayName?: string | null;
  updateProfile: (profile: { displayName?: string }) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
}

export class FirebaseAuthService {
  /**
   * Gửi OTP đến số điện thoại
   * @react-native-firebase/auth tự động xử lý reCAPTCHA, không cần RecaptchaVerifier
   */
  static async sendOTPToPhone(
    phoneNumber: string
  ): Promise<ConfirmationResult> {
    try {
      // Lazy load Firebase
      const authInstance = await getFirebaseAuth();
      
      // Ensure phone number has country code
      let formattedPhone = phoneNumber.trim();
      
      // If phone doesn't start with +, add +84 and remove leading 0
      if (!formattedPhone.startsWith('+')) {
        // Remove leading 0 if present
        if (formattedPhone.startsWith('0')) {
          formattedPhone = formattedPhone.substring(1);
        }
        // Add Vietnam country code
        formattedPhone = `+84${formattedPhone}`;
      }
      
      console.log('Original phone:', phoneNumber);
      console.log('Formatted phone:', formattedPhone);
      console.log('Platform:', Platform.OS);
      
      // @react-native-firebase/auth automatically handles reCAPTCHA/Play Integrity
      const confirmationResult = await authInstance.signInWithPhoneNumber(formattedPhone);
      
      console.log('OTP sent successfully to:', formattedPhone);
      return confirmationResult;
    } catch (error) {
      console.error('Error sending OTP to phone:', error);
      console.error('Error code:', (error as any)?.code);
      console.error('Error message:', (error as any)?.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      const firebaseError = this.handleAuthError(error as any);
      const errorToThrow = new Error(firebaseError.message);
      (errorToThrow as any).code = firebaseError.code;
      throw errorToThrow;
    }
  }

  /**
   * Verify OTP code cho Phone Auth
   */
  static async verifyPhoneOTP(
    confirmationResult: ConfirmationResult,
    otpCode: string
  ): Promise<User> {
    try {
      const result = await confirmationResult.confirm(otpCode);
      if (!result || !result.user) {
        throw new Error('Xác thực OTP không thành công');
      }
      return result.user;
    } catch (error) {
      console.log('Error verifying phone OTP:', error);
      const firebaseError = this.handleAuthError(error as any);
      const errorToThrow = new Error(firebaseError.message);
      (errorToThrow as any).code = firebaseError.code;
      throw errorToThrow;
    }
  }

  /**
   * Gửi OTP link qua email
   */
  static async sendOTPToEmail(email: string): Promise<void> {
    try {
      const authInstance = await getFirebaseAuth();
      const actionCodeSettings = {
        url: 'smartcarspamobile://auth/verify-email',
        handleCodeInApp: true,
      };
      
      await authInstance.sendSignInLinkToEmail(email, actionCodeSettings);
      
      // Lưu email vào AsyncStorage để verify sau
      await AsyncStorage.setItem('emailForSignIn', email);
    } catch (error) {
      console.log('Error sending OTP to email:', error);
      const firebaseError = this.handleAuthError(error as any);
      const errorToThrow = new Error(firebaseError.message);
      (errorToThrow as any).code = firebaseError.code;
      throw errorToThrow;
    }
  }

  /**
   * Verify OTP link từ email
   */
  static async verifyEmailLink(): Promise<User | null> {
    try {
      const authInstance = await getFirebaseAuth();
      const email = await AsyncStorage.getItem('emailForSignIn');
      
      if (email && await authInstance.isSignInWithEmailLink('')) {
        const result = await authInstance.signInWithEmailLink(email, '');
        await AsyncStorage.removeItem('emailForSignIn');
        return result.user;
      }
      return null;
    } catch (error) {
      console.log('Error verifying email link:', error);
      const firebaseError = this.handleAuthError(error as any);
      const errorToThrow = new Error(firebaseError.message);
      (errorToThrow as any).code = firebaseError.code;
      throw errorToThrow;
    }
  }

  /**
   * Tạo tài khoản với email/password
   */
  static async createAccount(email: string, password: string, displayName: string): Promise<User> {
    try {
      const authInstance = await getFirebaseAuth();
      const result = await authInstance.createUserWithEmailAndPassword(email, password);
      
      // Cập nhật display name
      await result.user.updateProfile({ displayName });
      
      // Gửi email xác thực (optional)
      await result.user.sendEmailVerification();
      
      return result.user;
    } catch (error) {
      console.log('Error creating account:', error);
      const firebaseError = this.handleAuthError(error as any);
      const errorToThrow = new Error(firebaseError.message);
      (errorToThrow as any).code = firebaseError.code;
      throw errorToThrow;
    }
  }

  /**
   * Đăng xuất khỏi Firebase
   */
  static async signOutFromFirebase(): Promise<void> {
    try {
      const authInstance = await getFirebaseAuth();
      await authInstance.signOut();
    } catch (error) {
      console.log('Error signing out:', error);
      const firebaseError = this.handleAuthError(error as any);
      const errorToThrow = new Error(firebaseError.message);
      (errorToThrow as any).code = firebaseError.code;
      throw errorToThrow;
    }
  }

  /**
   * Kiểm tra xem có phải email link không
   */
  static async isEmailLink(): Promise<boolean> {
    try {
      const authInstance = await getFirebaseAuth();
      return await authInstance.isSignInWithEmailLink('');
    } catch (error) {
      console.log('Error checking email link:', error);
      return false;
    }
  }

  /**
   * Lấy email từ AsyncStorage
   */
  static async getEmailForSignIn(): Promise<string | null> {
    return await AsyncStorage.getItem('emailForSignIn');
  }

  /**
   * Xóa email từ AsyncStorage
   */
  static async clearEmailForSignIn(): Promise<void> {
    await AsyncStorage.removeItem('emailForSignIn');
  }

  /**
   * Xử lý lỗi Firebase Auth
   */
  private static handleAuthError(error: any): FirebaseAuthError {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Email này đã được sử dụng',
      'auth/invalid-email': 'Email không hợp lệ',
      'auth/operation-not-allowed': 'Thao tác không được phép',
      'auth/weak-password': 'Mật khẩu quá yếu',
      'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa',
      'auth/user-not-found': 'Không tìm thấy tài khoản',
      'auth/wrong-password': 'Mật khẩu không đúng',
      'auth/invalid-credential': 'Thông tin đăng nhập không hợp lệ',
      'auth/too-many-requests': 'Quá nhiều yêu cầu, vui lòng thử lại sau',
      'auth/network-request-failed': 'Lỗi kết nối mạng',
      'auth/requires-recent-login': 'Vui lòng đăng nhập lại để thực hiện thao tác này',
      'auth/invalid-phone-number': 'Số điện thoại không hợp lệ',
      'auth/invalid-verification-code': 'Mã OTP không đúng',
      'auth/missing-verification-code': 'Vui lòng nhập mã OTP',
      'auth/code-expired': 'Mã OTP đã hết hạn',
      'auth/quota-exceeded': 'Đã vượt quá giới hạn gửi OTP',
      'auth/captcha-check-failed': 'Xác thực reCAPTCHA thất bại',
      'auth/session-expired': 'Phiên đăng nhập đã hết hạn',
      'auth/invalid-verification-id': 'Mã xác thực không hợp lệ',
      'auth/missing-phone-number': 'Vui lòng nhập số điện thoại',
      // @react-native-firebase specific error codes
      'auth/app-not-authorized': 'Ứng dụng chưa được ủy quyền',
    };

    // Luôn hiển thị code và message đầy đủ để debug
    const message = errorMessages[error.code] || error.message || 'Có lỗi xảy ra';
    return {
      code: error.code,
      message: `${message} (Code: ${error.code || 'unknown'})`
    };
  }
}
