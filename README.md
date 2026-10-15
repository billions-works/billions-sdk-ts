# billions-sdk-ts

TypeScript SDK for Billions public API.

## Install

```bash
npm install @billions-works/sdk-ts
```

## Usage

```ts
import { BillionsApi } from '@billions-works/sdk-ts';

const api = new BillionsApi({
  apiKey: 'your-api-key',
  webhookSecret: 'your-webhook-secret',
});

const version = await api.getVersion();
const currencies = await api.getCurrencies();
const countries = await api.getCountries();
const invoice = await api.createInvoice({
  currency: 'USDT',
  amount: 100,
  order_no: 'ORDER-1001',
  idempotencyKey: 'create-order-1001',
  callbackUrl: 'https://example.com/webhook',
});

console.log(invoice.invoice_url);
console.log(invoice.order_no);

const invoices = await api.getInvoicesByOrder('ORDER-1001');
console.log(invoices.length);
```

Default API host: `https://api.billions.works`

Default public API version: `v1`

## Examples

Create invoice:

```bash
BILLIONS_API_KEY=your-api-key npm run example:create
```

Get invoice:

```bash
BILLIONS_API_KEY=your-api-key BILLIONS_INVOICE_ID=invoice-id npm run example:get
```

Returned invoice objects include:

- `invoice_url` - ready-to-use payment page URL
- `order_no` - merchant order reference returned by create/get/byOrder endpoints
- `expires_at` - payment expiration time or `null`
- `network_and_other_fees` - network and processor fees included in the invoice calculation
- `status` - includes `pending`, `processing`, `completed`, `refund_processing`, `failed`, `expired`, `refunded`, `aml_check`, `aml_block`

Public API updates supported by this SDK:

- create invoice idempotency via `idempotencyKey`
- invoice lookups by `order_no` with `getInvoicesByOrder(orderNo)`
- request naming aligned with public API `order_no` field
- country directory via `getCountries()`

## Webhooks

Current webhooks use an envelope with `event`, retry timestamps and canonical
invoice fields in `data`. Top-level invoice fields are transitional duplicates.

Verify the signature using the received JSON body, either raw or already parsed:

```ts
const valid = await api.verifyWebhookSignature(signatureHeader, rawBody);
```

The method canonicalizes the parsed JSON according to RFC 8785 (JCS), then verifies
its HMAC-SHA256 signature. It accepts either the plain 64-character hex value or
`jcs-sha256=<hex>`. Whitespace, JSON property order, and equivalent escaping do not
affect verification. The secret is the original API `secretKey`, used as UTF-8 text.

```ts
const invoice = await api.getInvoiceFromWebhook(webhook);

if (webhook.event === 'invoice.paid') {
  const verified = await api.verifyInvoicePaid(webhook);
}
```

`getInvoiceFromWebhook()` treats the webhook as a wake-up signal and retrieves the
authoritative invoice for any status. `verifyInvoicePaid()` accepts both the new
envelope and legacy `{ id, status, paid_amount }` callbacks, requires the API invoice
to be `completed`, and compares status and paid amount.

Local manual test against test environment:

```bash
npm run example:test-api
```

Create your own local file:

- `examples/local-api-test.ts`
- this file is gitignored on purpose
