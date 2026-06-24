export class BillionsSdkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BillionsSdkError';
  }
}

export class BillionsApiError extends BillionsSdkError {
  public readonly statusCode: number;
  public readonly responseBody: unknown;

  constructor(message: string, statusCode: number, responseBody: unknown) {
    super(message);
    this.name = 'BillionsApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export class InvoiceNotPaidError extends BillionsSdkError {
  constructor(message = 'Invoice is not paid yet') {
    super(message);
    this.name = 'InvoiceNotPaidError';
  }
}

export class CallbackVerificationError extends BillionsSdkError {
  constructor(message = 'Callback data does not match invoice data from API') {
    super(message);
    this.name = 'CallbackVerificationError';
  }
}
