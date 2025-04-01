import { forwardRef, useRef } from 'react';
import { Invoice, formatCurrency, formatDate } from '@/types/invoice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Save } from 'lucide-react';
import { downloadPDF } from '@/lib/pdf-generator';

interface InvoicePreviewProps {
  invoice: Invoice;
  onPrint: () => void;
  onSave: () => void;
}

type InvoicePreviewRef = HTMLDivElement;

const InvoicePreview = forwardRef<InvoicePreviewRef, InvoicePreviewProps>(
  ({ invoice, onPrint, onSave }, ref) => {
    // Format the line items for display
    const hasLineItems = invoice.items && invoice.items.length > 0;
    
    return (
      <Card className="shadow rounded-lg overflow-hidden">
        {/* Preview Header */}
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Invoice Preview</h3>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onPrint}
              className="text-xs"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={onSave}
              className="text-xs"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" /> Save
            </Button>
          </div>
        </div>
        
        {/* Invoice Preview Content */}
        <div className="p-6 invoice-preview overflow-auto bg-white" ref={ref}>
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            {/* Header Section - Business & Invoice Info */}
            <div className="flex flex-col sm:flex-row justify-between mb-8">
              {/* Business Information */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{invoice.senderName}</h2>
                <div className="mt-1 text-gray-600 text-sm">
                  {invoice.senderAddress.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                  <p>{invoice.senderEmail}</p>
                  <p>{invoice.senderPhone}</p>
                </div>
              </div>
              
              {/* Invoice Information */}
              <div className="mt-4 sm:mt-0 text-right">
                <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
                <div className="mt-1">
                  <p className="text-gray-600 text-sm">
                    <span className="font-medium">Invoice #:</span> 
                    <span>{invoice.invoiceNumber}</span>
                  </p>
                  <p className="text-gray-600 text-sm">
                    <span className="font-medium">Date:</span>
                    <span>{formatDate(invoice.issueDate)}</span>
                  </p>
                  <p className="text-gray-600 text-sm">
                    <span className="font-medium">Due Date:</span>
                    <span>{formatDate(invoice.dueDate)}</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Bill To Section */}
            <div className="border-t border-gray-200 pt-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-1">Bill To:</h3>
              <div className="text-gray-600">
                <p className="font-medium">{invoice.clientName}</p>
                {invoice.clientAddress.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                <p>{invoice.clientEmail}</p>
              </div>
            </div>
            
            {/* Line Items Table */}
            <table className="min-w-full divide-y divide-gray-200 mb-6">
              <thead>
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hasLineItems ? (
                  invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 text-center">{item.quantity}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 text-center">
                        {formatCurrency(item.rate, invoice.currency)}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(item.amount, invoice.currency)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-3 text-sm text-gray-500 text-center">
                      No items added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Totals Section */}
            <div className="border-t border-gray-200 pt-4 pb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-600">Subtotal:</span>
                <span className="text-gray-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-600">Tax ({invoice.taxRate}%):</span>
                <span className="text-gray-900">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-base mt-2 pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-primary">{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
            
            {/* Notes Section */}
            {invoice.notes && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Notes:</h4>
                <p className="text-gray-600 text-sm">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";

export default InvoicePreview;
