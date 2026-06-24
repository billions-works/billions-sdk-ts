import { BillionsApi } from '../src/index.js';

async function main() {
  const apiKey = process.env.BILLIONS_API_KEY || '';
  const invoiceId = process.env.BILLIONS_INVOICE_ID || process.argv[2] || '';

  if (!apiKey) {
    throw new Error('BILLIONS_API_KEY is required');
  }
  if (!invoiceId) {
    throw new Error('BILLIONS_INVOICE_ID or first CLI argument is required');
  }

  const api = new BillionsApi({ apiKey });
  const invoice = await api.getInvoice(invoiceId);

  console.log('Invoice info:');
  console.log(JSON.stringify(invoice, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
