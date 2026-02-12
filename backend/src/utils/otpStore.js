export const otpStore = new Map();

// Generate a 6-digit random OTP
export const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP with 5-minute expiry
export const storeOtp = (key, otp) => {
    otpStore.set(key, {
        otp,
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
};

// Verify OTP (and consume it if valid)
export const verifyOtp = (key, inputOtp) => {
    const data = otpStore.get(key);
    if (!data) return false;
    if (Date.now() > data.expires) {
        otpStore.delete(key);
        return false;
    }
    if (data.otp === inputOtp) {
        otpStore.delete(key); // OTP is one-time use
        return true;
    }
    return false;
};
