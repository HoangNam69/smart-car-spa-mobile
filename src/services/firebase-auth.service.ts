import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Import Firebase Auth types
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Type aliases for compatibility
export type ConfirmationResult = FirebaseAuthTypes.ConfirmationResult;
export type User = FirebaseAuthTypes.User;

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

// User interface for compatibility
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
      // auth() is a function that returns the auth instance
      const confirmationResult = await auth().signInWithPhoneNumber(formattedPhone);
      
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
      const actionCodeSettings = {
        url: 'smartcarspamobile://auth/verify-email',
        handleCodeInApp: true,
      };
      
      await auth().sendSignInLinkToEmail(email, actionCodeSettings);
      
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
      const email = await AsyncStorage.getItem('emailForSignIn');
      
      if (email && await auth().isSignInWithEmailLink('')) {
        const result = await auth().signInWithEmailLink(email, '');
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
      const result = await auth().createUserWithEmailAndPassword(email, password);
      
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
      await auth().signOut();
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
      return await auth().isSignInWithEmailLink('');
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
