import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendSuccess, sendError, sendCreated, sendUnauthorized } from '../utils/responseHelper.js';
import { sendEmail, sendPasswordResetEmail } from '../utils/emailSender.js';

// Generate Access Token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// @desc    Send a fixed test email
// @route   GET /api/auth/test-email
// @access  Public (optionally protected via TEST_EMAIL_API_KEY)
export const sendTestEmail = async (req, res) => {
  try {
    const endpointKey = process.env.TEST_EMAIL_API_KEY;
    const providedKey = req.query.key || req.headers['x-test-email-key'];

    if (endpointKey && providedKey !== endpointKey) {
      return sendUnauthorized(res, 'Invalid key for test email endpoint');
    }

    const recipient = 'nitishm.23it@kongu.edu';
    const sentAt = new Date();

    const result = await sendEmail({
      to: recipient,
      subject: 'Sri Murugan Tours - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <h2>Sri Murugan Tours - Test Email</h2>
          <p>This is a test email triggered from the backend endpoint.</p>
          <p><strong>Sent At:</strong> ${sentAt.toISOString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        </div>
      `,
      text: `Sri Murugan Tours test email. Sent at ${sentAt.toISOString()} in ${process.env.NODE_ENV || 'development'} environment.`
    });

    if (!result.success) {
      return sendError(res, `Failed to send test email: ${result.error}`, 500);
    }

    return sendSuccess(res, 'Test email sent successfully', {
      to: recipient,
      messageId: result.messageId,
      sentAt: sentAt.toISOString()
    });
  } catch (error) {
    console.error('Send test email error:', error);
    return sendError(res, error.message, 500);
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, organization } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User already exists with this email');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      organization,
      role: 'client'
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    sendCreated(res, 'Registration successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        organization: user.organization,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendUnauthorized(res, 'Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      return sendUnauthorized(res, 'Account is deactivated. Please contact support.');
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendUnauthorized(res, 'Invalid credentials');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    sendSuccess(res, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        organization: user.organization,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // Clear refresh token
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    sendSuccess(res, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendUnauthorized(res, 'Refresh token required');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user with this refresh token
    const user = await User.findOne({ 
      _id: decoded.id, 
      refreshToken: refreshToken 
    }).select('+refreshToken');

    if (!user) {
      return sendUnauthorized(res, 'Invalid refresh token');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update refresh token in DB
    user.refreshToken = newRefreshToken;
    await user.save();

    sendSuccess(res, 'Token refreshed', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Refresh token expired, please login again');
    }
    console.error('Refresh token error:', error);
    sendUnauthorized(res, 'Invalid refresh token');
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    sendSuccess(res, 'User fetched', {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      organization: user.organization,
      role: user.role
    });
  } catch (error) {
    console.error('Get me error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return sendSuccess(res, 'If an account with that email exists, a password reset link has been sent.');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and save to user
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    // Send email
    await sendPasswordResetEmail(user.email, resetToken, user.name);

    sendSuccess(res, 'If an account with that email exists, a password reset link has been sent.');
  } catch (error) {
    console.error('Forgot password error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return sendError(res, 'Invalid or expired reset token');
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = null; // Invalidate all sessions

    await user.save();

    sendSuccess(res, 'Password reset successful. Please login with your new password.');
  } catch (error) {
    console.error('Reset password error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, organization } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, organization },
      { new: true, runValidators: true }
    );

    sendSuccess(res, 'Profile updated', {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      organization: user.organization,
      role: user.role
    });
  } catch (error) {
    console.error('Update profile error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect');
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, error.message, 500);
  }
};
