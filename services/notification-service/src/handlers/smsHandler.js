'use strict';

const twilio = require('twilio');
const config = require('../config');

const client = new twilio(
  config.twilio.accountSid,
  config.twilio.authToken
);

// ─── Send SMS ─────────────────────────────────────────────
const sendSMS = async (to, body) => {
  try {
    const phone = to.startsWith('+') ? to : `+91${to}`;

    await client.messages.create({
      from: config.twilio.fromNumber,
      to: phone,
      body
    });

    console.log(`✅ SMS sent to ${phone}`);
    return true;
  } catch (error) {
    console.error(`❌ SMS failed to ${to}:`, error.message);
    return false;
  }
};

// ─── Event Handlers ───────────────────────────────────────

const handleBidAccepted = async (data) => {
  const { seekerPhone, providerPhone, jobTitle, bidAmount } = data;

  // Notify seeker
  await sendSMS(
    seekerPhone,
    `Your job "${jobTitle}" has a bid accepted for ₹${bidAmount}. Please complete payment to proceed.`
  );

  // Notify provider
  await sendSMS(
    providerPhone,
    `Your bid of ₹${bidAmount} for "${jobTitle}" has been accepted. Await payment confirmation.`
  );
};

const handlePaymentCompleted = async (data) => {
  const { seekerPhone, providerPhone, jobTitle, amount } = data;

  // Notify seeker
  await sendSMS(
    seekerPhone,
    `Payment of ₹${amount} confirmed for "${jobTitle}". Your job is now active.`
  );

  // Notify provider
  await sendSMS(
    providerPhone,
    `Payment received for "${jobTitle}". You can now begin work.`
  );
};

module.exports = {
  handleBidAccepted,
  handlePaymentCompleted
};
