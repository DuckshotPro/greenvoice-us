export interface LineItem {
  id?: number;
  invoiceId?: number;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Attachment {
  id: string;
  invoiceId: number;
  userId: number;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  storagePath?: string;
  createdAt: string;
  description?: string;
  dataUrl?: string; // For client-side preview
}

export interface Invoice {
  id?: number;
  userId: number;
  invoiceNumber: string;
  discountType?: 'percentage' | 'fixed' | 'coupon';
  discountValue?: number;
  discountTotal?: number;
  couponCode?: string;
  issueDate: string;
  dueDate: string;
  currency: string;

  // Sender details
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  senderPhone: string;

  // Client details
  clientName: string;
  clientEmail: string;
  clientAddress: string;

  // Financial details
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;

  // Additional info
  notes?: string;
  createdAt?: string;

  // Status
  status?: 'draft' | 'scheduled' | 'sent' | 'paid' | 'void' | 'overdue';

  // Scheduled sending
  scheduledSendDate?: string;
  sentAt?: string;

  // Recurring info
  recurringTemplateId?: number;

  // Payment info
  paidAt?: string;
  paymentMethod?: string;

  // Sharing info
  shareableLink?: string;

  // Items (joined data)
  items?: LineItem[];

  // Attachments
  attachments?: Attachment[];

  // Payment options
  allowPartialPayment?: boolean;
  minimumPaymentAmount?: number;
  allowTip?: boolean;
  suggestedTipPercentages?: number[];
  shippingOptions?: ShippingOption[];
}

export interface ShippingOption {
  id: string;
  name: string;
  description?: string;
  cost: number;
  estimatedDeliveryDays?: number;
}

export interface InvoiceFormData {
  // Sender details
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  senderPhone: string;

  // Client details
  clientName: string;
  clientEmail: string;
  clientAddress: string;

  // Invoice details
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;

  // Line items
  items: LineItem[];

  // Additional info
  notes: string;

  // Calculated fields
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export type CurrencyOption = {
  value: string;
  label: string;
  symbol: string;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "JPY", label: "JPY (¥)", symbol: "¥" },
  { value: "CAD", label: "CAD (C$)", symbol: "C$" },
  { value: "AUD", label: "AUD (A$)", symbol: "A$" },
  { value: "INR", label: "INR (₹)", symbol: "₹" },
  { value: "CNY", label: "CNY (¥)", symbol: "¥" },
];

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const currency = CURRENCY_OPTIONS.find(c => c.value === currencyCode);
  const symbol = currency?.symbol || "$";

  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};