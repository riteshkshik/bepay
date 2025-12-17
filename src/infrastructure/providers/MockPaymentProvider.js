const { v4: uuidv4 } = require('uuid');

const createMockPaymentProvider = () => {
  const _delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  return {
    async auth() {
      await _delay(100);
      console.log('[MockProvider] Authenticating...');
      return {
        accessToken: `token_${uuidv4()}`,
        expiresIn: 3600
      };
    },

    async createBeneficiary(token, beneficiary) {
      await _delay(150);
      console.log('[MockProvider] Creating Beneficiary...', beneficiary.name);
      return {
        beneficiaryId: `ben_${uuidv4().split('-')[0]}`
      };
    },

    async createQuote(token, params) {
      await _delay(150);
      console.log('[MockProvider] Creating Quote...', params.amount, params.currency);
      return {
        quoteId: `qt_${uuidv4().split('-')[0]}`,
        totalAmount: params.amount,
        fee: params.amount * 0.01 // 1% fee
      };
    },

    async createOrder(token, params) {
      await _delay(200);
      console.log('[MockProvider] Creating Order...');

      // Simulate transient failure (10% chance)
      if (Math.random() < 0.1) {
        console.warn('[MockProvider] Transient Failure Triggered!');
        const err = new Error("Gateway Timeout");
        err.isTransient = true;
        throw err;
      }

      return {
        orderId: `ord_${uuidv4()}`,
        status: 'PENDING'
      };
    }
  };
};

// Export singleton instance
module.exports = createMockPaymentProvider();
