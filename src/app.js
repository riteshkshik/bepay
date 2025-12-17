const express = require('express');
const idempotencyMiddleware = require('./api/middlewares/idempotencyMiddleware');
const paymentController = require('./api/controllers/paymentController');
const { AppError } = require('./core/errors/AppError');

const app = express();
app.use(express.json());

// --- Routes ---
const router = express.Router();
router.post('/payments', idempotencyMiddleware, paymentController.createPayment);
app.use('/api', router);

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error('[Error]', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.name,
      message: err.message
    });
  }

  res.status(500).json({ error: 'InternalServerError', message: 'Something went wrong' });
});

module.exports = app;
