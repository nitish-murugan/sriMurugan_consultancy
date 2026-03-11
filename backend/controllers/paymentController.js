import Razorpay from 'razorpay';
import crypto from 'crypto';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

// Initialize Razorpay
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
  });
};

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount || amount <= 0) {
      return sendError(res, 'Valid amount is required');
    }

    const razorpay = getRazorpayInstance();

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {}
    };

    const order = await razorpay.orders.create(options);

    sendSuccess(res, 'Order created', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });
  } catch (error) {
    console.error('Create order error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Verify payment signature
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendError(res, 'Missing payment verification parameters');
    }

    // Create signature to verify
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      sendSuccess(res, 'Payment verified successfully', {
        verified: true,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
    } else {
      sendError(res, 'Payment verification failed');
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get payment details
// @route   GET /api/payments/:paymentId
// @access  Private (Admin)
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(paymentId);

    sendSuccess(res, 'Payment details fetched', {
      id: payment.id,
      amount: payment.amount / 100, // Convert from paise
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      createdAt: new Date(payment.created_at * 1000)
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get Razorpay key (for frontend)
// @route   GET /api/payments/key
// @access  Public
export const getRazorpayKey = async (req, res) => {
  try {
    sendSuccess(res, 'Razorpay key', {
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Get razorpay key error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Initiate refund (Admin)
// @route   POST /api/payments/:paymentId/refund
// @access  Private (Admin)
export const initiateRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, notes } = req.body;

    const razorpay = getRazorpayInstance();

    const refundOptions = {
      notes: notes || {}
    };

    if (amount) {
      refundOptions.amount = Math.round(amount * 100); // Partial refund in paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundOptions);

    sendSuccess(res, 'Refund initiated', {
      id: refund.id,
      amount: refund.amount / 100,
      status: refund.status
    });
  } catch (error) {
    console.error('Initiate refund error:', error);
    sendError(res, error.message, 500);
  }
};
