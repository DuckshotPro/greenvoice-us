
import { Invoice } from '@shared/schema';

export class DiscountCalculator {
  static calculateDiscount(subtotal: number, discountType: string, discountValue: number): number {
    if (!discountType || !discountValue) return 0;
    
    switch (discountType) {
      case 'percentage':
        return (subtotal * (discountValue / 100));
      case 'fixed':
        return Math.min(discountValue, subtotal);
      default:
        return 0;
    }
  }

  static recalculateInvoiceTotal(invoice: Invoice): Invoice {
    const subtotal = invoice.subtotal || 0;
    const discountTotal = this.calculateDiscount(subtotal, invoice.discountType || '', invoice.discountValue || 0);
    const taxableAmount = subtotal - discountTotal;
    const taxAmount = (invoice.taxRate || 0) * taxableAmount / 100;
    
    return {
      ...invoice,
      discountTotal,
      taxAmount,
      total: taxableAmount + taxAmount
    };
  }
}
