import { BillionsApi } from '../src/index.js';

async function main() {
  const api = new BillionsApi({
    apiKey: 'PUT_YOUR_TEST_API_KEY_HERE',
    baseUrl: 'https://api-test.billions.works',
  });

  const version = await api.getVersion();
  console.log('Version:', version);

  const currencies = await api.getCurrencies();
  console.log('Currencies:', currencies.map((item) => item.internalTicker));

  const invoice = await api.createInvoice({
    currency: 'USDT',
    amount: 10,
    type: 'b2b',
    orderId: `sdk-test-${Date.now()}`,
    description: 'SDK local api-test check',
    callbackUrl: 'https://example.com/webhook',
  });

  console.log('Created invoice:');
  console.log(JSON.stringify(invoice, null, 2));

  const invoiceInfo = await api.getInvoice(invoice.id);
  console.log('Fetched invoice:');
  console.log(JSON.stringify(invoiceInfo, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
