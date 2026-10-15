import { BILLIONS_DEFAULT_BASE_URL, BILLIONS_PUBLIC_API_VERSION } from './constants.js';
import { BillionsApiError, CallbackVerificationError, InvoiceNotPaidError } from './errors.js';
import { canonicalizeJson } from './json-canonicalization.js';
import type {
  BillionsApiOptions,
  CreateInvoiceRequest,
  CreateCryptoRefundRequest,
  CreateFiatRefundRequest,
  CreateWithdrawalRequest,
  CountryInfo,
  CurrencyInfo,
  EstimateInvoiceFeesRequest,
  EstimateInvoiceFeesResponse,
  InvoiceInfo,
  InvoiceWebhookPayload,
  MerchantInfo,
  RefundResponse,
  SignedRequestOptions,
  VerifyInvoicePaidCallbackData,
  WithdrawalResponse,
} from './types.js';

function normalizeBaseUrl(value?: string): string {
  const raw = String(value || BILLIONS_DEFAULT_BASE_URL).trim();
  return raw.replace(/\/+$/, '');
}

function normalizeDecimalString(value: string | number): string {
  const raw = String(value).trim();
  if (!raw) {
    return '0';
  }

  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    return raw;
  }

  const negative = raw.startsWith('-');
  const unsigned = negative ? raw.slice(1) : raw;
  const [integerPartRaw, fractionPartRaw = ''] = unsigned.split('.');
  const integerPart = integerPartRaw.replace(/^0+(?=\d)/, '') || '0';
  const fractionPart = fractionPartRaw.replace(/0+$/, '');
  const normalized = fractionPart ? `${integerPart}.${fractionPart}` : integerPart;

  return negative && normalized !== '0' ? `-${normalized}` : normalized;
}

function getWebhookData(
  callback: VerifyInvoicePaidCallbackData | InvoiceWebhookPayload,
): VerifyInvoicePaidCallbackData {
  return 'data' in callback ? callback.data : callback;
}

function getWebhookInvoiceId(
  callback: VerifyInvoicePaidCallbackData | InvoiceWebhookPayload,
): string {
  const data = getWebhookData(callback);
  return String(data.invoice_id || data.id || '').trim();
}

export class BillionsApi {
  public readonly apiKey: string;
  public readonly webhookSecret?: string;
  public readonly secretKey?: string;
  public readonly baseUrl: string;
  public readonly version: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: BillionsApiOptions) {
    if (!options?.apiKey || !String(options.apiKey).trim()) {
      throw new Error('apiKey is required');
    }
    if (options.secretKey !== undefined && options.secretKey.length === 0) {
      throw new Error('secretKey must not be empty');
    }
    if (options.webhookSecret !== undefined && options.webhookSecret.length === 0) {
      throw new Error('webhookSecret must not be empty');
    }
    if (options.secretKey && options.webhookSecret && options.secretKey !== options.webhookSecret) {
      throw new Error('secretKey and webhookSecret must match when both are provided');
    }

    if (typeof globalThis.fetch !== 'function' && !options.fetchFn) {
      throw new Error('fetch implementation is required');
    }

    this.apiKey = String(options.apiKey).trim();
    this.secretKey = options.secretKey || options.webhookSecret;
    this.webhookSecret = this.secretKey;
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.version = String(options.version || BILLIONS_PUBLIC_API_VERSION).trim() || BILLIONS_PUBLIC_API_VERSION;
    this.fetchFn = options.fetchFn || globalThis.fetch.bind(globalThis);
  }

  private get publicApiBasePath(): string {
    return `/public/${this.version}`;
  }

  private buildUrl(path: string): string {
    return `${this.baseUrl}${this.publicApiBasePath}${path}`;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetchFn(this.buildUrl(path), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...(init?.headers || {}),
      },
    });

    const responseText = await response.text();
    const responseBody = responseText ? this.safeJsonParse(responseText) : null;

    if (!response.ok) {
      const message = this.extractErrorMessage(responseBody) || `Billions API request failed with status ${response.status}`;
      throw new BillionsApiError(message, response.status, responseBody);
    }

    return responseBody as T;
  }

  private safeJsonParse(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private extractErrorMessage(payload: unknown): string | null {
    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return null;
  }

  async getVersion(): Promise<string> {
    return this.request<string>('/version', { method: 'GET' });
  }

  async getCurrencies(): Promise<CurrencyInfo[]> {
    return this.request<CurrencyInfo[]>('/currencies', { method: 'GET' });
  }

  async getCountries(): Promise<CountryInfo[]> {
    return this.request<CountryInfo[]>('/countries', { method: 'GET' });
  }

  async getMerchantInfo(): Promise<MerchantInfo> {
    return this.request<MerchantInfo>('/me', { method: 'GET' });
  }

  async estimateFees(payload: EstimateInvoiceFeesRequest): Promise<EstimateInvoiceFeesResponse> {
    return this.request<EstimateInvoiceFeesResponse>('/invoices/estimateFees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createInvoice(payload: CreateInvoiceRequest): Promise<InvoiceInfo> {
    return this.request<InvoiceInfo>('/invoices/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createWithdrawal(
    payload: CreateWithdrawalRequest,
    options?: SignedRequestOptions,
  ): Promise<WithdrawalResponse> {
    return this.signedMutation('/withdrawals/create', payload, options);
  }

  async refundCrypto(
    payload: CreateCryptoRefundRequest,
    options?: SignedRequestOptions,
  ): Promise<RefundResponse> {
    return this.signedMutation('/refunds/refundCrypto', payload, options);
  }

  async refundFiat(
    payload: CreateFiatRefundRequest,
    options?: SignedRequestOptions,
  ): Promise<RefundResponse> {
    return this.signedMutation('/refunds/refundFiat', payload, options);
  }

  async getInvoice(invoiceId: string): Promise<InvoiceInfo> {
    const normalizedInvoiceId = String(invoiceId || '').trim();
    if (!normalizedInvoiceId) {
      throw new Error('invoiceId is required');
    }

    return this.request<InvoiceInfo>(`/invoices/${encodeURIComponent(normalizedInvoiceId)}`, {
      method: 'GET',
    });
  }

  async getInvoicesByOrder(orderNo: string): Promise<InvoiceInfo[]> {
    const normalizedOrderNo = String(orderNo || '').trim();
    if (!normalizedOrderNo) {
      throw new Error('orderNo is required');
    }

    return this.request<InvoiceInfo[]>(`/invoices/byOrder/${encodeURIComponent(normalizedOrderNo)}`, {
      method: 'GET',
    });
  }

  async verifyInvoicePaid(
    invoiceIdOrCallback: string | VerifyInvoicePaidCallbackData | InvoiceWebhookPayload,
    callbackData?: VerifyInvoicePaidCallbackData | InvoiceWebhookPayload,
  ): Promise<InvoiceInfo> {
    const invoiceId = typeof invoiceIdOrCallback === 'string'
      ? String(invoiceIdOrCallback).trim()
      : getWebhookInvoiceId(invoiceIdOrCallback);

    const rawCallback = typeof invoiceIdOrCallback === 'string'
      ? callbackData
      : invoiceIdOrCallback;

    if (!invoiceId) {
      throw new Error('invoice id is required');
    }
    if (!rawCallback) {
      throw new Error('callback data is required');
    }
    const callback = getWebhookData(rawCallback);

    const invoice = await this.getInvoice(invoiceId);

    if (invoice.status !== 'completed') {
      throw new InvoiceNotPaidError();
    }

    if (String(callback.status).trim() !== String(invoice.status).trim()) {
      throw new CallbackVerificationError('Callback status does not match API invoice status');
    }

    if (normalizeDecimalString(callback.paid_amount) !== normalizeDecimalString(invoice.paid_amount)) {
      throw new CallbackVerificationError('Callback paid_amount does not match API invoice paid_amount');
    }

    return invoice;
  }

  async getInvoiceFromWebhook(
    webhook: VerifyInvoicePaidCallbackData | InvoiceWebhookPayload,
  ): Promise<InvoiceInfo> {
    const invoiceId = getWebhookInvoiceId(webhook);
    if (!invoiceId) {
      throw new Error('invoice id is required');
    }
    return this.getInvoice(invoiceId);
  }

  async verifyWebhookSignature(signature: string, body: unknown): Promise<boolean> {
    if (this.webhookSecret === undefined) {
      throw new Error('webhookSecret is required to verify webhook signatures');
    }

    const normalizedSignature = String(signature || '').trim().replace(/^jcs-sha256=/i, '');
    if (!/^[a-f0-9]{64}$/i.test(normalizedSignature)) {
      return false;
    }

    const cryptoApi = globalThis.crypto?.subtle;
    if (!cryptoApi) {
      throw new Error('Web Crypto API is required to verify webhook signatures');
    }

    const encoder = new TextEncoder();
    const key = await cryptoApi.importKey(
      'raw',
      encoder.encode(this.webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const signatureBytes: Uint8Array<ArrayBuffer> = Uint8Array.from(
      normalizedSignature.match(/.{2}/g) || [],
      (byte) => Number.parseInt(byte, 16),
    );
    let parsedBody = body;
    if (typeof body === 'string') {
      parsedBody = JSON.parse(body);
    } else if (body instanceof Uint8Array) {
      parsedBody = JSON.parse(new TextDecoder().decode(body));
    }
    const bodyBytes: Uint8Array<ArrayBuffer> = encoder.encode(canonicalizeJson(parsedBody));

    return cryptoApi.verify('HMAC', key, signatureBytes, bodyBytes);
  }

  private async signedMutation<T>(
    path: string,
    payload: unknown,
    options?: SignedRequestOptions,
  ): Promise<T> {
    if (!this.secretKey) {
      throw new Error('secretKey is required for signed operations');
    }
    const cryptoApi = globalThis.crypto;
    if (!cryptoApi?.subtle || typeof cryptoApi.randomUUID !== 'function') {
      throw new Error('Web Crypto API is required for signed operations');
    }
    const timestamp = String(options?.timestamp ?? Math.floor(Date.now() / 1000));
    const requestId = String(options?.requestId || cryptoApi.randomUUID()).toLowerCase();
    const fullPath = `${this.publicApiBasePath}${path}`;
    const message = `POST\n${fullPath}\n${timestamp}\n${requestId}\n${canonicalizeJson(payload)}`;
    const encoder = new TextEncoder();
    const key = await cryptoApi.subtle.importKey(
      'raw', encoder.encode(this.secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const digest = new Uint8Array(await cryptoApi.subtle.sign('HMAC', key, encoder.encode(message)));
    const signature = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');

    return this.request<T>(path, {
      method: 'POST',
      headers: {
        'x-billions-timestamp': timestamp,
        'x-billions-request-id': requestId,
        'x-billions-request-signature': `v1=${signature}`,
      },
      body: JSON.stringify(payload),
    });
  }
}
