import { jsPDF } from 'jspdf';
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
  // From / To
  doc.setFontSize(14);
  doc.text('From:', 20, 80);
  doc.setFontSize(12);
  doc.text(invoice.senderName || 'Sender', 20, 90);

  doc.setFontSize(14);
  doc.text('To:', 120, 80);
  doc.setFontSize(12);
  doc.text(invoice.clientName || 'Client', 120, 90);
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

  doc.autoTable({
    head: [tableColumn],
    body: tableRows.length ? tableRows : [['No items', '', '', '']],
    startY: 110,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [70, 70, 70],
      textColor: [255, 255, 255]
    }
  });
};

const addSummary = (doc: jsPDF, invoice: Invoice) => {
  const finalY = (doc as any).lastAutoTable.finalY + 20;

  doc.text('Summary:', 130, finalY);
  doc.text(`Subtotal: ${formatCurrency(invoice.subtotal || 0, invoice.currency)}`, 130, finalY + 10);
  doc.text(`Tax (${invoice.taxRate || 0}%): ${formatCurrency(invoice.taxAmount || 0, invoice.currency)}`, 130, finalY + 20);
  doc.text(`Total: ${formatCurrency(invoice.total || 0, invoice.currency)}`, 130, finalY + 30);
};

export const generatePDF = (invoice: Invoice): string => {
  try {
    const doc = createBasePDF(invoice);
    addHeader(doc, invoice);
    addPartyDetails(doc, invoice);
    addItemsTable(doc, invoice);
    addSummary(doc, invoice);

    return doc.output('datauristring');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('PDF generation failed');
  }
};

export const downloadPDF = (invoice: Invoice): void => {
  try {
    const doc = createBasePDF(invoice);
    addHeader(doc, invoice);
    addPartyDetails(doc, invoice);
    addItemsTable(doc, invoice);
    addSummary(doc, invoice);

    // Generate file name
    const fileName = `Invoice-${invoice.invoiceNumber || 'unknown'}.pdf`;

    // Download the PDF
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF for download:', error);
    throw new Error('PDF download failed');
  }
};