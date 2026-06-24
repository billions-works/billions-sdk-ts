import { BILLIONS_DEFAULT_BASE_URL, BILLIONS_PUBLIC_API_VERSION } from './constants.js';
import { BillionsApiError, CallbackVerificationError, InvoiceNotPaidError } from './errors.js';
import type {
  BillionsApiOptions,
  CreateInvoiceRequest,
  CurrencyInfo,
  EstimateInvoiceFeesRequest,
  EstimateInvoiceFeesResponse,
  InvoiceInfo,
  MerchantInfo,
  VerifyInvoicePaidCallbackData,
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

export class BillionsApi {
  public readonly apiKey: string;
  public readonly baseUrl: string;
  public readonly version: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: BillionsApiOptions) {
    if (!options?.apiKey || !String(options.apiKey).trim()) {
      throw new Error('apiKey is required');
    }

    if (typeof globalThis.fetch !== 'function' && !options.fetchFn) {
      throw new Error('fetch implementation is required');
    }

    this.apiKey = String(options.apiKey).trim();
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

  async getInvoice(invoiceId: string): Promise<InvoiceInfo> {
    const normalizedInvoiceId = String(invoiceId || '').trim();
    if (!normalizedInvoiceId) {
      throw new Error('invoiceId is required');
    }

    return this.request<InvoiceInfo>(`/invoices/${encodeURIComponent(normalizedInvoiceId)}`, {
      method: 'GET',
    });
  }

  async verifyInvoicePaid(
    invoiceIdOrCallback: string | VerifyInvoicePaidCallbackData,
    callbackData?: VerifyInvoicePaidCallbackData,
  ): Promise<InvoiceInfo> {
    const invoiceId = typeof invoiceIdOrCallback === 'string'
      ? String(invoiceIdOrCallback).trim()
      : String(invoiceIdOrCallback?.id || '').trim();

    const callback = typeof invoiceIdOrCallback === 'string'
      ? callbackData
      : invoiceIdOrCallback;

    if (!invoiceId) {
      throw new Error('invoice id is required');
    }
    if (!callback) {
      throw new Error('callback data is required');
    }

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
}
