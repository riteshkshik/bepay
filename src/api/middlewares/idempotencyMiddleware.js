const { BadRequestError } = require('../../core/errors/AppError');

const idempotencyMiddleware = (req, res, next) => {
  const key = req.get('Idempotency-Key');
  if (!key) {
    return next(new BadRequestError('Missing Idempotency-Key header'));
  }
  req.idempotencyKey = key;
  next();
};

module.exports = idempotencyMiddleware;
