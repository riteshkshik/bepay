const paymentService = require('../../core/services/PaymentService');

const createPayment = async (req, res, next) => {
  try {
    const { idempotencyKey, body } = req;
    const result = await paymentService.processPayment(idempotencyKey, body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { createPayment };
