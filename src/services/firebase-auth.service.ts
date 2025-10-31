import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthError,
  ConfirmationResult,
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  RecaptchaVerifier,
  sendEmailVerification,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPhoneNumber,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from '../config/firebase.config';

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

export class FirebaseAuthService {
  /**
   * Tạo Recaptcha Verifier cho Phone Auth (dành cho web)
   */
  static createRecaptchaVerifier(elementId: string): RecaptchaVerifier {
    const verifier = new RecaptchaVerifier(auth, elementId, {
      size: 'normal',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      },
    });
    return verifier;
  }

  /**
   * Gửi OTP đến số điện thoại
   * Trên React Native, chúng ta cần tạo một RecaptchaVerifier invisible
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
      
      // Trên React Native/Expo, cần tạo RecaptchaVerifier
      // Firebase sẽ tự động xử lý reCAPTCHA qua native code trên mobile
      // Trên React Native, không cần DOM element thực sự
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        },
      } as any);
      
      // Chỉ render trên web (có DOM)
      // Trên React Native, Firebase sẽ tự động xử lý khi gọi signInWithPhoneNumber
      if (Platform.OS === 'web') {
        try {
          // Tìm hoặc tạo container element cho web
          let container = document.getElementById('recaptcha-container');
          if (!container) {
            container = document.createElement('div');
            container.id = 'recaptcha-container';
            container.style.display = 'none';
            document.body.appendChild(container);
          }
          await verifier.render();
        } catch (renderError) {
          console.log('Render error (may be normal on some platforms):', renderError);
        }
      }
      
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        verifier
      );
      
      console.log('OTP sent successfully to:', formattedPhone);
      return confirmationResult;
    } catch (error) {
      console.error('Error sending OTP to phone:', error);
      console.error('Error code:', (error as any)?.code);
      console.error('Error message:', (error as any)?.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw this.handleAuthError(error as AuthError);
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
      return result.user;
    } catch (error) {
      console.log('Error verifying phone OTP:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Xóa Recaptcha Verifier
   */
  static clearRecaptchaVerifier(verifier: RecaptchaVerifier): void {
    if (verifier) {
      verifier.clear();
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
      
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      // Lưu email vào AsyncStorage để verify sau
      await AsyncStorage.setItem('emailForSignIn', email);
    } catch (error) {
      console.log('Error sending OTP to email:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Verify OTP link từ email
   */
  static async verifyEmailLink(): Promise<User | null> {
    try {
      const email = await AsyncStorage.getItem('emailForSignIn');
      
      if (email && isSignInWithEmailLink(auth, '')) {
        const result = await signInWithEmailLink(auth, email, '');
        await AsyncStorage.removeItem('emailForSignIn');
        return result.user;
      }
      return null;
    } catch (error) {
      console.log('Error verifying email link:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Tạo tài khoản với email/password
   */
  static async createAccount(email: string, password: string, displayName: string): Promise<User> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Cập nhật display name
      await updateProfile(result.user, { displayName });
      
      // Gửi email xác thực (optional)
      await sendEmailVerification(result.user);
      
      return result.user;
    } catch (error) {
      console.log('Error creating account:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Đăng xuất khỏi Firebase
   */
  static async signOutFromFirebase(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.log('Error signing out:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Kiểm tra xem có phải email link không
   */
  static isEmailLink(): boolean {
    return isSignInWithEmailLink(auth, '');
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
  private static handleAuthError(error: AuthError): FirebaseAuthError {
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
    };

    // Xử lý lỗi đặc biệt cho React Native
    const errorMessage = error.message || '';
    if (errorMessage.includes('Unable to load external scripts') || 
        errorMessage.includes('external scripts') ||
        errorMessage.includes('loadJS')) {
      return {
        code: 'auth/reCAPTCHA-error',
        message: 'Firebase Phone Auth cần native code. Vui lòng build development build với lệnh: npx expo run:android hoặc npx expo run:ios. Không thể dùng Expo Go cho tính năng này.'
      };
    }

    // Luôn hiển thị code và message đầy đủ để debug
    const message = errorMessages[error.code] || error.message || 'Có lỗi xảy ra';
    return {
      code: error.code,
      message: `${message} (Code: ${error.code || 'unknown'})`
    };
  }
}

