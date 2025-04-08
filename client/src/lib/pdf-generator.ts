import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Invoice } from '../types/invoice';
import { formatCurrency, formatDate } from '../types/invoice';

// Add types to jsPDF for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const createBasePDF = (invoice: Invoice): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set document properties
  doc.setProperties({
    title: `Invoice-${invoice.invoiceNumber || 'N/A'}`,
    author: invoice.senderName || 'InvoiceFlow',
    subject: `Invoice for ${invoice.clientName || 'Client'}`,
    keywords: 'invoice, bill',
    creator: 'InvoiceFlow'
  });

  // Set up fonts
  doc.setFont('helvetica');

  return doc;
};

const addHeader = (doc: jsPDF, invoice: Invoice) => {
  // Title
  doc.setFontSize(24);
  doc.text('INVOICE', doc.internal.pageSize.width / 2, 20, { align: 'center' });

  // Invoice details
  doc.setFontSize(12);
  doc.text(`Invoice Number: ${invoice.invoiceNumber || 'N/A'}`, 20, 40);
  doc.text(`Date: ${formatDate(invoice.issueDate)}`, 20, 50);
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 20, 60);
};

const addPartyDetails = (doc: jsPDF, invoice: Invoice) => {
  // From section - Sender details
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('From:', 20, 80);

  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(invoice.senderName || 'Sender', 20, 90);

  let fromY = 100;

  // Add sender email if available
  if (invoice.senderEmail) {
    doc.text(invoice.senderEmail, 20, fromY);
    fromY += 6;
  }

  // Add sender phone if available
  if (invoice.senderPhone) {
    doc.text(invoice.senderPhone, 20, fromY);
  }

  // Add sender address if available
  if (invoice.senderAddress) {
    const addressLines = invoice.senderAddress.split('\n');
    let addressY = invoice.senderPhone ? fromY + 6 : fromY;

    addressLines.forEach(line => {
      if (line.trim()) {
        doc.text(line, 20, addressY);
        addressY += 6;
      }
    });
  }

  // To section - Client details
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('To:', 120, 80);

  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(invoice.clientName || 'Client', 120, 90);

  let toY = 100;

  // Add client email if available
  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, 120, toY);
    toY += 6;
  }

  // Add client address if available
  if (invoice.clientAddress) {
    const addressLines = invoice.clientAddress.split('\n');

    addressLines.forEach(line => {
      if (line.trim()) {
        doc.text(line, 120, toY);
        toY += 6;
      }
    });
  }
};

const addItemsTable = (doc: jsPDF, invoice: Invoice) => {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const tableColumn = ['Description', 'Qty', 'Rate', 'Amount'];
  const tableRows = items.map(item => [
    item.description || '',
    (item.quantity || 0).toString(),
    formatCurrency(item.rate || 0, invoice.currency),
    formatCurrency(item.amount || 0, invoice.currency)
  ]);

  // Calculate appropriate startY based on previous content
  // This ensures the table doesn't overlap with the sender/client details
  const startY = Math.max(
    // Make sure we start after the party details
    // We need extra space if addresses are multi-line
    invoice.senderAddress?.split('\n').length > 2 ||
      invoice.clientAddress?.split('\n').length > 2 ? 130 : 120
  );

  doc.autoTable({
    head: [tableColumn],
    body: tableRows.length ? tableRows : [['No items', '', '', '']],
    startY,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [70, 70, 70],
      textColor: [255, 255, 255]
    },
    columnStyles: {
      0: { cellWidth: 'auto' },    // Description (auto width)
      1: { cellWidth: 20 },        // Quantity
      2: { cellWidth: 30 },        // Rate
      3: { cellWidth: 30 }         // Amount
    }
  });
};

const addSummary = (doc: jsPDF, invoice: Invoice) => {
  const finalY = (doc as any).lastAutoTable.finalY + 20;

  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Summary:', 130, finalY);

  // Summary details
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Subtotal: ${formatCurrency(invoice.subtotal || 0, invoice.currency)}`, 130, finalY + 10);
  doc.text(`Tax (${invoice.taxRate || 0}%): ${formatCurrency(invoice.taxAmount || 0, invoice.currency)}`, 130, finalY + 20);

  // Make the total stand out
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text(`Total: ${formatCurrency(invoice.total || 0, invoice.currency)}`, 130, finalY + 35);

  // Reset font
  doc.setFont('helvetica', 'normal');

  // Add notes if present
  if (invoice.notes) {
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text('Notes:', 20, finalY + 10);
    doc.setFontSize(10);
    doc.text(invoice.notes, 20, finalY + 20, { maxWidth: 100 });
  }

  // Add footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Invoice generated by InvoiceFlow',
    doc.internal.pageSize.width / 2,
    doc.internal.pageSize.height - 10,
    { align: 'center' }
  );
};

export const generatePDF = (invoice: Invoice): string => {
  try {
    if (!invoice || !invoice.items || !Array.isArray(invoice.items)) {
      throw new Error('Invalid invoice data structure');
    }
    
    // Ensure all required fields are present
    if (!invoice.invoiceNumber || !invoice.senderName || !invoice.clientName) {
      throw new Error('Required invoice fields are missing');
    }
    
    const doc = createBasePDF(invoice);
    addHeader(doc, invoice);
    addPartyDetails(doc, invoice);
    addItemsTable(doc, invoice);
    addSummary(doc, invoice);

    return doc.output('datauristring');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('PDF generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const downloadPDF = (invoice: Invoice): void => {
  try {
    const doc = new jsPDF();

    // Add header
    doc.setFontSize(20);
    doc.text('INVOICE', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 35);
    doc.text(`Date: ${formatDate(invoice.issueDate)}`, 20, 42);
    doc.text(`Due: ${formatDate(invoice.dueDate)}`, 20, 49);

    // Add sender info
    doc.setFontSize(12);
    doc.text('From:', 20, 65);
    doc.setFontSize(10);
    doc.text(invoice.senderName, 20, 72);
    doc.text(invoice.senderEmail, 20, 79);
    const senderAddressLines = invoice.senderAddress.split('\n');
    senderAddressLines.forEach((line, index) => doc.text(line, 20, 86 + index * 7));


    // Add client info
    doc.setFontSize(12);
    doc.text('Bill To:', 120, 65);
    doc.setFontSize(10);
    doc.text(invoice.clientName, 120, 72);
    doc.text(invoice.clientEmail, 120, 79);
    const clientAddressLines = invoice.clientAddress.split('\n');
    clientAddressLines.forEach((line, index) => doc.text(line, 120, 86 + index * 7));

    // Add items table
    const tableTop = 120;
    doc.line(20, tableTop, 190, tableTop);
    doc.setFontSize(10);
    doc.text('Description', 20, tableTop + 7);
    doc.text('Qty', 120, tableTop + 7);
    doc.text('Rate', 140, tableTop + 7);
    doc.text('Amount', 170, tableTop + 7);

    let currentY = tableTop + 15;
    invoice.items.forEach(item => {
      doc.text(item.description, 20, currentY);
      doc.text(item.quantity.toString(), 120, currentY);
      doc.text(formatCurrency(item.rate, invoice.currency), 140, currentY);
      doc.text(formatCurrency(item.amount, invoice.currency), 170, currentY);
      currentY += 8;
    });

    // Add totals
    currentY += 10;
    doc.line(20, currentY, 190, currentY);
    currentY += 7;
    doc.text('Subtotal:', 140, currentY);
    doc.text(formatCurrency(invoice.subtotal, invoice.currency), 170, currentY);
    currentY += 7;
    doc.text('Tax:', 140, currentY);
    doc.text(formatCurrency(invoice.taxAmount, invoice.currency), 170, currentY);
    currentY += 7;
    doc.text('Total:', 140, currentY);
    doc.text(formatCurrency(invoice.total, invoice.currency), 170, currentY);

    // Add notes
    if (invoice.notes) {
      currentY += 20;
      doc.setFontSize(11);
      doc.text('Notes:', 20, currentY);
      doc.setFontSize(10);
      doc.text(invoice.notes, 20, currentY + 7);
    }

    // Save the PDF
    doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};