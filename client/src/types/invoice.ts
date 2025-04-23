export interface LineItem {
  id?: number;
  invoiceId?: number;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
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
  status?: 'draft' | 'scheduled' | 'sent' | 'paid' | 'void' | 'overdue';
  
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
  createdAt?: Date;
  
  // Sharing info
  shareableLink?: string;
  
  // Line items
  items: LineItem[];
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
