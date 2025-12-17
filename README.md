# Payment Orchestrator (Node.js)

A clean-architecture implementation of a Payment Orchestrator API using Node.js and Express. This system orchestrates a complex payment flow, ensures robust idempotency, and handles transient failures with retry logic.

## 🚀 Key Features

*   **Clean Architecture**: Strict separation of concerns (API, Core, Infrastructure).
*   **Functional Design**: Uses Factory Functions and Closures instead of Classes/this for better encapsulation and testability.
*   **Orchestration Flow**: Automatically coordinates `Auth` -> `CreateBeneficiary` -> `CreateQuote` -> `CreateOrder`.
*   **Strict Idempotency**:
    *   Replays successful responses for duplicate requests (Same Key + Same Payload).
    *   Rejects concurrent/duplicate requests with different payloads (Same Key + Diff Payload -> `409 Conflict`).
*   **Resilience**: Built-in retry logic for transient errors (e.g., 503 Service Unavailable) from the provider.
*   **Mock Implementation**: Includes an in-memory idempotency store and a mock payment provider simulating real-world latency and random failures.

## 🛠️ Tech Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Utilities**: `uuid` (for key generation), `crypto` (for payload hashing).
*   **Architecture**: Ports & Adapters (Hexagonal) / Clean Architecture.

## 📂 Project Structure

```
src/
├── api/                  # Interface Layer (HTTP)
│   ├── controllers/      # Request handlers
│   ├── middlewares/      # Validation & Idempotency check
│   └── routes.js         # (Logical grouping, handled in app.js)
├── core/                 # Application Business Logic
│   ├── services/         # Orchestration logic (PaymentService)
│   └── errors/           # Domain Error definitions
├── infrastructure/       # Adapters & External concerns
│   ├── providers/        # Mock Bank API Provider
│   └── repositories/     # In-Memory Idempotency Store
├── app.js                # App configuration & Route wiring
└── server.js             # Entry point
```

## ⚡ Quick Start

### Prerequisites
*   Node.js (v14+ recommended)
*   npm

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository_url>
    cd bepay
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the server**
    ```bash
    npm start
    # OR
    node src/server.js
    ```
    The server will run on `http://localhost:3000`.

## 🧪 Testing & Verification

### 1. Automated Verification Script
We have a built-in script that tests the Happy Path, Idempotency Replay, and Conflict scenarios.

Run in a separate terminal while the server is running:
```bash
node scripts/verify.js
```

### 2. Manual Testing (Postman / cURL)

**Endpoint**: `POST http://localhost:3000/api/payments`

**Headers**:
*   `Content-Type`: `application/json`
*   `Idempotency-Key`: `<UNIQUE_STRING>` (Required)

**Body**:
```json
{
    "amount": 100,
    "currency": "USD",
    "beneficiary": {
        "name": "Alice Smith",
        "account": "123-456"
    }
}
```

#### Test Scenarios to Try:

1.  **Success**: Send the request above. Returns `200 OK` with `orderId`.
2.  **Idempotency (Replay)**: Send the **exact same request** with the **same `Idempotency-Key`**.
    *   **Result**: Returns `200 OK` with the **same** `orderId` immediately (cached).
3.  **Conflict**: Keep the same `Idempotency-Key` but change `"amount": 200`.
    *   **Result**: Returns `409 Conflict`.
4.  **Resilience**: The mock provider has a 10% chance of failing with a 503 error. The system will automatically retry. Check the server logs to see:
    > "Transient failure encountered. Retrying (1/2)..."

### cURL Command

```bash
curl --location 'http://localhost:3000/api/payments' \
--header 'Idempotency-Key: key_12345' \
--header 'Content-Type: application/json' \
--data '{
    "amount": 100,
    "currency": "USD",
    "beneficiary": {
        "name": "Alice Smith",
        "account": "123-456"
    }
}'
```

## 📝 Design Decisions

1.  **Why File Structure?**: Separation of concerns allows swapping out the mock provider for a real one (e.g., Stripe/PayPal) without touching the core logic.
2.  **Why Functional Patterns?**: Avoiding classes in JS reduces `this` binding issues and encourages simpler, immutable data flow.
3.  **Why In-Memory Store?**: For this assignment, we use specific in-memory maps. In production, this would be replaced with Redis/Memcached sharing the same interface.
