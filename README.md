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

Local manual test against test environment:

```bash
npm run example:test-api
```

Create your own local file:

- `examples/local-api-test.ts`
- this file is gitignored on purpose
