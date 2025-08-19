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
  region?: string;
  priority?: number;
};

// Enhanced currency support for Canada-US-Caribbean business corridor
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  // Core Regional Currencies (Most Important)
  { value: "USD", label: "USD ($) - US Dollar", symbol: "$", region: "core", priority: 1 },
  { value: "CAD", label: "CAD (C$) - Canadian Dollar", symbol: "C$", region: "core", priority: 2 },
  
  // Caribbean Regional Currencies
  { value: "XCD", label: "XCD (EC$) - Eastern Caribbean Dollar", symbol: "EC$", region: "caribbean", priority: 3 },
  { value: "KYD", label: "KYD (CI$) - Cayman Islands Dollar", symbol: "CI$", region: "caribbean", priority: 4 },
  { value: "JMD", label: "JMD (J$) - Jamaican Dollar", symbol: "J$", region: "caribbean", priority: 5 },
  { value: "TTD", label: "TTD (TT$) - Trinidad & Tobago Dollar", symbol: "TT$", region: "caribbean", priority: 6 },
  { value: "BBD", label: "BBD (Bds$) - Barbados Dollar", symbol: "Bds$", region: "caribbean", priority: 7 },
  
  // Major Global Currencies
  { value: "EUR", label: "EUR (€) - Euro", symbol: "€", region: "global", priority: 8 },
  { value: "GBP", label: "GBP (£) - British Pound", symbol: "£", region: "global", priority: 9 },
  { value: "JPY", label: "JPY (¥) - Japanese Yen", symbol: "¥", region: "global", priority: 10 },
  { value: "AUD", label: "AUD (A$) - Australian Dollar", symbol: "A$", region: "global", priority: 11 },
  { value: "INR", label: "INR (₹) - Indian Rupee", symbol: "₹", region: "global", priority: 12 },
  { value: "CNY", label: "CNY (¥) - Chinese Yuan", symbol: "¥", region: "global", priority: 13 },
];

// Currency exchange rate data with pegged rates for stability
export const CURRENCY_PEGS: Record<string, { pegged: boolean; rate?: number; baseCurrency?: string }> = {
  XCD: { pegged: true, rate: 2.70, baseCurrency: "USD" }, // Fixed peg since 1976
  BBD: { pegged: true, rate: 2.0, baseCurrency: "USD" },  // Fixed peg 2:1
  KYD: { pegged: false }, // Managed float, very strong currency
  JMD: { pegged: false }, // Floating currency
  TTD: { pegged: false }, // Managed float
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const currency = CURRENCY_OPTIONS.find(c => c.value === currencyCode);
  const symbol = currency?.symbol || "$";
  
  // Special formatting for specific currencies
  if (currencyCode === 'JPY' || currencyCode === 'CNY') {
    // No decimal places for Yen currencies typically
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Get currencies grouped by region for better UX
export const getCurrenciesByRegion = () => {
  const core = CURRENCY_OPTIONS.filter(c => c.region === 'core').sort((a, b) => (a.priority || 0) - (b.priority || 0));
  const caribbean = CURRENCY_OPTIONS.filter(c => c.region === 'caribbean').sort((a, b) => (a.priority || 0) - (b.priority || 0));
  const global = CURRENCY_OPTIONS.filter(c => c.region === 'global').sort((a, b) => (a.priority || 0) - (b.priority || 0));
  
  return { core, caribbean, global };
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
