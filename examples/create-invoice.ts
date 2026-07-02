import { BillionsApi } from '../src/index.js';

async function main() {
  const apiKey = process.env.BILLIONS_API_KEY || '';

  if (!apiKey) {
    throw new Error('BILLIONS_API_KEY is required');
  }

  const api = new BillionsApi({ apiKey });

  const invoice = await api.createInvoice({
    currency: 'USDT',
    amount: 100,
    type: 'b2b',
    orderId: `example-${Date.now()}`,
    description: 'Example invoice from billions-sdk-ts',
    callbackUrl: 'https://example.com/webhook',
  });

  console.log('Created invoice:');
  console.log(JSON.stringify(invoice, null, 2));
  console.log('Payment URL:', invoice.invoice_url);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
