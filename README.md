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
});

const version = await api.getVersion();
const currencies = await api.getCurrencies();
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
- `status` - includes `pending`, `processing`, `completed`, `refund_processing`, `failed`, `expired`, `refunded`, `aml_check`, `aml_block`

Public API updates supported by this SDK:

- create invoice idempotency via `idempotencyKey`
- invoice lookups by `order_no` with `getInvoicesByOrder(orderNo)`
- request naming aligned with public API `order_no` field

Local manual test against test environment:

```bash
npm run example:test-api
```

Create your own local file:

- `examples/local-api-test.ts`
- this file is gitignored on purpose
