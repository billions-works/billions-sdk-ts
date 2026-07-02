export type CurrencyType = 'stablecoin' | 'fiat' | 'token';
export type InvoiceType = 'b2b' | 'b2c';
export type InvoiceStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'refunded'
  | 'aml_check'
  | 'aml_block';

export interface CurrencyInfo {
  ticker: string;
  fullName: string;
  network: string;
  contractAddress: string | null;
  type: CurrencyType;
  icon: string;
  iconDark: string;
  internalTicker: string;
}

export interface MerchantInfo {
  id: string;
  email: string;
  merchantName: string | null;
  directorName: string | null;
  website: string | null;
  logo: string | null;
  whitelabeling: boolean;
}

export interface EstimateInvoiceFeesRequest {
  currency: string;
  amount: number | string;
  type?: InvoiceType;
  orderId?: string;
  description?: string;
  autoconvert?: string;
}

export interface EstimateInvoiceFeesResponse {
  amount: number;
  finalPrice: number;
  fee: number;
}

export interface CreateInvoiceRequest extends EstimateInvoiceFeesRequest {
  callbackUrl?: string;
  expiresAt?: string;
}

export interface InvoiceInfo {
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  invoice_url: string;
  id: string;
  type: InvoiceType;
  status: InvoiceStatus;
  merchant_id: string;
  settlement_currency: string | null;
  currency: string | null;
  convert_currency: string | null;
  amount: string;
  merchant_fee: string;
  paid_amount: string;
  callback_url: string | null;
  order_no: string | null;
  description: string | null;
}

export interface VerifyInvoicePaidCallbackData {
  id?: string;
  status: string;
  paid_amount: string | number;
}

export interface BillionsApiOptions {
  apiKey: string;
  baseUrl?: string;
  version?: string;
  fetchFn?: typeof fetch;
}
