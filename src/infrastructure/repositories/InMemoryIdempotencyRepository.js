const createInMemoryIdempotencyRepository = () => {
  const store = new Map();

  return {
    async get(key) {
      return store.get(key);
    },

    async save(key, response, payloadHash) {
      store.set(key, { response, payloadHash });
    }
  };
};

// Export a singleton instance
module.exports = createInMemoryIdempotencyRepository();
