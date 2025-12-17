const crypto = require('crypto');
const { IdempotencyConflictError, TransientError } = require('../errors/AppError');
const paymentProvider = require('../../infrastructure/providers/MockPaymentProvider');
const idempotencyRepository = require('../../infrastructure/repositories/InMemoryIdempotencyRepository');

const _hash = (data) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

const _createOrderWithRetry = async (token, params, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await paymentProvider.createOrder(token, params);
    } catch (err) {
      if (err.isTransient && i < retries) {
        console.warn(`Transient failure encountered. Retrying (${i + 1}/${retries})...`);
        await new Promise(res => setTimeout(res, 500 * (i + 1))); // Simple backoff
        continue;
      }
      throw err;
    }
  }
};

/**
 * Orchestrates the payment flow: Auth -> Beneficiary -> Quote -> Order
 */
const processPayment = async (idempotencyKey, payload) => {
  // 1. Check Idempotency
  const payloadHash = _hash(payload);
  const existingRecord = await idempotencyRepository.get(idempotencyKey);

  if (existingRecord) {
    if (existingRecord.payloadHash !== payloadHash) {
      throw new IdempotencyConflictError();
    }
    return existingRecord.response;
  }

  // 2. Orchestration Flow
  try {
    // Step A: Authentication
    const authData = await paymentProvider.auth();
    const token = authData.accessToken;

    // Step B: Create Beneficiary
    const beneficiaryData = await paymentProvider.createBeneficiary(token, payload.beneficiary);

    // Step C: Create Quote
    const quoteData = await paymentProvider.createQuote(token, {
      amount: payload.amount,
      currency: payload.currency
    });

    // Step D: Create Order (with simple retry logic for transient errors)
    const orderData = await _createOrderWithRetry(token, {
      quoteId: quoteData.quoteId,
      beneficiaryId: beneficiaryData.beneficiaryId
    });

    // 3. Normalize Response
    const response = {
      id: orderData.orderId,
      status: orderData.status,
      quote: {
        id: quoteData.quoteId,
        amount: quoteData.totalAmount,
        fee: quoteData.fee
      },
      beneficiary: {
        id: beneficiaryData.beneficiaryId
      },
      createdAt: new Date().toISOString()
    };

    // 4. Save Idempotency Record
    await idempotencyRepository.save(idempotencyKey, response, payloadHash);

    return response;

  } catch (err) {
    // Pass through domain errors, wrap others if necessary
    throw err;
  }
};

module.exports = { processPayment };
