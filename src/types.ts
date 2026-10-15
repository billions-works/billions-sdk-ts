export type CurrencyType = 'stablecoin' | 'fiat' | 'token';
export type InvoiceType = 'b2b' | 'b2c';
export type InvoiceStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'refund_processing'
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

export interface CountryInfo {
  code: string;
  name: string;
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
  order_no?: string;
  description?: string;
  autoconvert?: string;
}

export interface EstimateInvoiceFeesResponse {
  amount: number;
  finalPrice: number;
  fee: number;
  summaryFee?: number;
  merchantReceiveAmount: number;
}

export interface CreateInvoiceRequest extends EstimateInvoiceFeesRequest {
  idempotencyKey?: string;
  callbackUrl?: string;
  expiresAt?: string;
}

export interface SignedRequestOptions {
  requestId?: string;
  timestamp?: string | number;
}

export interface CreateWithdrawalRequest {
  currency: string;
  amount: number | string;
  withdrawalMethodId: number;
}

export interface CreateCryptoRefundRequest {
  invoiceId: string;
  reason?: string;
  address?: string;
  withdrawToSameAddress?: boolean;
}

export interface CreateFiatRefundRequest {
  invoiceId: string;
  reason?: string;
}

export interface WithdrawalRequestInfo {
  id: string;
  currency: string;
  amount: string;
  withdrawal_method_id: number;
  status: string;
  payout_processor_status: string | null;
  payout_processor_tx_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefundRequestInfo {
  id: string;
  invoice_id: string;
  type: string;
  currency: string;
  amount: string;
  to_address: string | null;
  withdraw_to_same_address: boolean;
  status: string;
  payout_processor_status: string | null;
  payout_processor_tx_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalResponse { request: WithdrawalRequestInfo }
export interface RefundResponse { request: RefundRequestInfo }

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
  final_amount: string;
  network_and_other_fees: string;
  merchant_receive_amount: string;
  merchant_fee: string;
  paid_amount: string;
  callback_url: string | null;
  order_no: string | null;
  description: string | null;
}

export interface VerifyInvoicePaidCallbackData {
  id?: string;
  invoice_id?: string;
  status: string;
  paid_amount: string | number;
}

export type InvoiceWebhookEvent = 'invoice.paid' | 'invoice.status_changed';

export interface InvoiceWebhookData {
  invoice_id: string;
  external_invoice_id: string | null;
  order_no: string | null;
  previous_status: InvoiceStatus;
  status: InvoiceStatus;
  amount: string;
  final_amount: string;
  paid_amount: string;
  merchant_fee: string;
  network_and_other_fees: string;
  merchant_receive_amount: string;
  currency: string | null;
  settlement_currency: string | null;
  payment_source: string | null;
  payment_address: string | null;
  updated_at: string;
}

export interface InvoiceWebhookPayload extends Partial<InvoiceWebhookData> {
  event: InvoiceWebhookEvent;
  event_timestamp: string;
  attempt: number;
  previous_attempt_timestamp: string | null;
  data: InvoiceWebhookData;
}

export interface BillionsApiOptions {
  apiKey: string;
  secretKey?: string;
  webhookSecret?: string;
  baseUrl?: string;
  version?: string;
  fetchFn?: typeof fetch;
}
