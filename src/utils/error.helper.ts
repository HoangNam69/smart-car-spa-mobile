/**
 * Error helper utility for extracting error messages from API responses
 * Displays exact error message from backend without translation
 */

export function getErrorMessage(error: any): string {
  if (!error) {
    return "Đã xảy ra lỗi không xác định";
  }

  const errorData = error?.response?.data || error?.data || error;
  
  let message = errorData?.message;
  if (message) {
    // Special handling for time slot conflict
    if (typeof message === 'string' && message.includes("Please select a different time slot.")) {
      return "Thời gian bạn chọn đã bị đặt trước. Vui lòng chọn khung giờ khác!";
    }
    return message;
  }
  
  message = errorData?.error;
  if (message) {
    // Special handling for time slot conflict
    if (typeof message === 'string' && message.includes("Please select a different time slot.")) {
      return "Thời gian bạn chọn đã bị đặt trước. Vui lòng chọn khung giờ khác!";
    }
    return message;
  }
  
  message = error?.message;
  if (message) {
    // Special handling for time slot conflict
    if (typeof message === 'string' && message.includes("Please select a different time slot.")) {
      return "Thời gian bạn chọn đã bị đặt trước. Vui lòng chọn khung giờ khác!";
    }
    return message;
  }
  
  if (errorData?.errors && Array.isArray(errorData.errors)) {
    const errorMessages = errorData.errors
      .map((err: any) => {
        if (typeof err === 'string') {
          return err;
        }
        if (err?.message) {
          return err.message;
        }
        if (err?.field && err?.defaultMessage) {
          return `${err.field}: ${err.defaultMessage}`;
        }
        return null;
      })
      .filter((msg: string | null) => msg !== null);
    
    if (errorMessages.length > 0) {
      const combinedMessage = errorMessages.join('. ');
      // Special handling for time slot conflict
      if (combinedMessage.includes("Please select a different time slot.")) {
        return "Thời gian bạn chọn đã bị đặt trước. Vui lòng chọn khung giờ khác!";
      }
      return combinedMessage;
    }
  }
  
  const errorCode = errorData?.error_code || errorData?.errorCode;
  if (errorCode) {
    return `Lỗi ${errorCode}: ${errorData?.message || "Không có mô tả lỗi."}`;
  }
  
  if (error?.response?.statusText) {
    return error.response.statusText;
  }
  
  const status = error?.response?.status;
  if (status) {
    return `Lỗi ${status}: Đã xảy ra lỗi từ máy chủ.`;
  }
  
  return "Đã xảy ra lỗi. Vui lòng thử lại.";
}

