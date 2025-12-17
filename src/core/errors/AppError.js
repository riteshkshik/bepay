class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class IdempotencyConflictError extends AppError {
  constructor(message = 'Idempotency key reused with different payload') {
    super(message, 409);
  }
}

class BadRequestError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class TransientError extends AppError {
  constructor(message) {
    super(message, 503);
  }
}

module.exports = {
  AppError,
  IdempotencyConflictError,
  BadRequestError,
  TransientError
};
