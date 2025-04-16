import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice, LineItem } from "@shared/schema";
import { formatCurrency } from "./utils";

interface InvoiceWithItems extends Invoice {
  items: LineItem[];
}

/**
 * Generates a PDF from an invoice object
 * @param invoice - The invoice data with line items
 * @returns The generated PDF document
 */
export function generatePdf(invoice: InvoiceWithItems): jsPDF {
  // Create a new PDF document
  const doc = new jsPDF();

  // Set up document
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Add logo (if available)
  // This is a placeholder - you would need to provide a logo URL
  // doc.addImage(logoUrl, 'PNG', margin, yPos, 50, 15);
  
  // Add invoice header
  doc.setFontSize(24);
  doc.setTextColor(41, 67, 192); // Primary color
  doc.text("INVOICE", pageWidth - margin - doc.getTextWidth("INVOICE"), yPos + 10);
  
  yPos += 20;
  
  // Add invoice number and dates
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, margin, yPos);
  
  doc.setFontSize(10);
  yPos += 8;
  doc.text(`Issue Date: ${invoice.issueDate}`, margin, yPos);
  yPos += 6;
  doc.text(`Due Date: ${invoice.dueDate}`, margin, yPos);
  
  yPos += 15;
  
  // Add status
  doc.setFontSize(12);
  if (invoice.status === "paid") {
    doc.setTextColor(46, 124, 46); // Green
    doc.text("PAID", pageWidth - margin - doc.getTextWidth("PAID"), yPos);
  } else if (invoice.status === "overdue") {
    doc.setTextColor(180, 50, 50); // Red
    doc.text("OVERDUE", pageWidth - margin - doc.getTextWidth("OVERDUE"), yPos);
  } else {
    doc.text(
      invoice.status?.toUpperCase() || "PENDING", 
      pageWidth - margin - doc.getTextWidth(invoice.status?.toUpperCase() || "PENDING"), 
      yPos
    );
  }
  
  yPos += 20;
  
  // Add billing info - From/To
  const colWidth = (pageWidth - 2 * margin) / 2;
  
  // From section
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text("From:", margin, yPos);
  
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  yPos += 7;
  doc.text(invoice.senderName, margin, yPos);
  
  // Handle multiline address
  const senderAddressLines = invoice.senderAddress?.split("\n") || [];
  for (const line of senderAddressLines) {
    yPos += 5;
    doc.text(line, margin, yPos);
  }
  
  yPos += 5;
  doc.text(invoice.senderEmail || "", margin, yPos);
  
  if (invoice.senderPhone) {
    yPos += 5;
    doc.text(invoice.senderPhone, margin, yPos);
  }
  
  // Reset yPos for the "To" section
  yPos -= (12 + 5 * (senderAddressLines.length + (invoice.senderPhone ? 1 : 0)));
  
  // To section
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text("To:", margin + colWidth, yPos);
  
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  yPos += 7;
  doc.text(invoice.clientName, margin + colWidth, yPos);
  
  // Handle multiline address
  const clientAddressLines = invoice.clientAddress?.split("\n") || [];
  for (const line of clientAddressLines) {
    yPos += 5;
    doc.text(line, margin + colWidth, yPos);
  }
  
  yPos += 5;
  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, margin + colWidth, yPos);
  }
  
  // Move down to the greater of the two sections
  const fromLines = 2 + senderAddressLines.length + (invoice.senderPhone ? 1 : 0) + 1;
  const toLines = 2 + clientAddressLines.length + (invoice.clientEmail ? 1 : 0);
  const maxLines = Math.max(fromLines, toLines);
  
  yPos = margin + 20 + 15 + 20 + 7 + (5 * (maxLines - 1));
  yPos += 20; // Add some space before the table
  
  // Add line items table
  autoTable(doc, {
    startY: yPos,
    head: [["Description", "Quantity", "Rate", "Amount"]],
    body: invoice.items.map(item => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.rate, invoice.currency),
      formatCurrency(item.amount, invoice.currency)
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [230, 230, 240],
      textColor: [60, 60, 60],
      fontStyle: "bold"
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 40, halign: "right" },
      2: { cellWidth: 50, halign: "right" },
      3: { cellWidth: 50, halign: "right" }
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    }
  });
  
  // Get the Y position after the table
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Add totals
  const totalsX = pageWidth - margin - 80;
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  
  doc.text("Subtotal:", totalsX, yPos);
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - margin, yPos, { align: "right" });
  
  yPos += 7;
  doc.text(`Tax (${invoice.taxRate}%):`, totalsX, yPos);
  doc.text(formatCurrency(invoice.taxAmount, invoice.currency), pageWidth - margin, yPos, { align: "right" });
  
  // Add discount if present
  if (invoice.discount && invoice.discount > 0) {
    yPos += 7;
    doc.setTextColor(46, 124, 46); // Green for discount
    doc.text("Discount:", totalsX, yPos);
    doc.text(`-${formatCurrency(invoice.discount, invoice.currency)}`, pageWidth - margin, yPos, { align: "right" });
    doc.setTextColor(80, 80, 80); // Reset color
  }
  
  yPos += 10;
  
  // Add total
  doc.setFontSize(12);
  doc.setTextColor(41, 67, 192); // Primary color
  doc.text("Total:", totalsX, yPos);
  doc.text(formatCurrency(invoice.total, invoice.currency), pageWidth - margin, yPos, { align: "right" });
  
  // Add notes if present
  if (invoice.notes) {
    yPos += 25;
    
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text("Notes:", margin, yPos);
    
    yPos += 7;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    
    // Split notes into lines that fit within the page width
    const notesWidth = pageWidth - 2 * margin;
    const notesLines = doc.splitTextToSize(invoice.notes, notesWidth);
    
    for (const line of notesLines) {
      doc.text(line, margin, yPos);
      yPos += 5;
      
      // Check if we need a new page
      if (yPos > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
    }
  }
  
  // Add footer with powered by text
  const footerText = `Generated by InvoiceFlow on ${new Date().toLocaleDateString()}`;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    footerText,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );
  
  // Save the PDF with the invoice number as the filename
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
  
  return doc;
}

export default generatePdf;