# Billions Public API (Temporary Notes)

Base URL:

- local example: `http://localhost:3000`
- public API prefix: `/public/v1`

Swagger:

- UI: `/public/v1/docs`
- JSON: `/public/v1/swagger.json`

Version endpoint:

- `GET /public/v1/version`
- response: `"v1"`

Authentication:

- private public-API methods use merchant API key
- supported headers:
  - `x-api-key: <apiKey>`
  - `Authorization: Bearer <apiKey>`

Current endpoints:

1. `GET /public/v1/version`
Returns API version key string.

2. `GET /public/v1/currencies`
Returns list of supported currencies.

3. `GET /public/v1/me`
Returns merchant basic info:
- `id`
- `email`
- `merchantName`
- `directorName`
- `website`
- `logo`
- `whitelabeling`

4. `POST /public/v1/invoices/estimateFees`
Request body:
```json
{
  "currency": "USDT",
  "amount": 100,
  "type": "b2b",
  "order_no": "INV-1001",
  "description": "Test invoice",
  "autoconvert": "USD"
}
```

Response body:
```json
{
  "amount": 100,
  "finalPrice": 101,
  "fee": 1
}
```

5. `POST /public/v1/invoices/create`
Request body:
```json
{
  "idempotencyKey": "create-123321",
  "currency": "USDT",
  "amount": 100,
  "type": "b2b",
  "order_no": "123321",
  "description": "Hello world",
  "autoconvert": "USD",
  "callbackUrl": "https://example.com/webhook"
}
```

Response body:
```json
{
  "created_at": "2026-06-24T09:50:15.555Z",
  "updated_at": "2026-06-24T09:50:15.555Z",
  "id": "0f633bdd-6777-4cc3-955a-89bcfc64895f",
  "type": "b2b",
  "status": "pending",
  "merchant_id": "04597e0f-387d-47a6-a388-2058afcee1b6",
  "settlement_currency": "USDT",
  "currency": "USDT_TRON",
  "convert_currency": null,
  "amount": "101.000000000000000000",
  "merchant_fee": "1.000000000000000000",
  "paid_amount": "0.000000000000000000",
  "callback_url": "https://example.com/webhook",
  "order_no": "123321",
  "description": "Hello world"
}
```

6. `GET /public/v1/invoices/{id}`
Returns the same response shape as invoice creation, but only for invoices owned by current merchant API key.

7. `GET /public/v1/invoices/byOrder/{order_no}`
Returns all invoices for the current merchant with the specified `order_no`.

Notes for SDK:

- version comparison should use `GET /public/v1/version` and expect `"v1"`
- invoice create and invoice get intentionally return the same DTO
- `estimateFees` does not accept `callbackUrl`
- public invoice endpoints do not expose payment routing internals
- invoice create supports idempotency through `idempotencyKey`
