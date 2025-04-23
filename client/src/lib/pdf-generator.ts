import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice, LineItem, Attachment } from "@shared/schema"; // Assuming updated schema
import { formatCurrency } from "./utils";

interface ExtendedLineItem extends LineItem {
  details?: string;
}

interface InvoiceWithItems extends Invoice {
  items: ExtendedLineItem[];
  discount?: number;
}

// Image loading utility for attachments
const loadImage = async (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Generates a PDF from an invoice object, including attachments
 * @param invoice - The invoice data with line items
 * @param attachments - An array of attachment objects
 * @returns The generated PDF document as a Blob
 */
export const generatePDF = async (invoice: InvoiceWithItems, attachments: Attachment[] = []): Promise<Blob> => {
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

  // Add attachments if available
  if (attachments && attachments.length > 0) {
    // Add a page break
    doc.addPage();

    // Add attachments header
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Attachments', 14, 20);

    // Add each attachment
    let yPosition = 30;
    for (const attachment of attachments) {
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`${attachment.originalFilename}${attachment.description ? ` - ${attachment.description}` : ''}`, 14, yPosition);

      // If it's an image attachment and we have the data URL, add it to the PDF
      if (attachment.dataUrl && 
         (attachment.mimeType === 'image/jpeg' || 
          attachment.mimeType === 'image/png' || 
          attachment.mimeType === 'image/gif')) {
        try {
          // Try to add the image (will fail silently if not possible)
          const img = await loadImage(attachment.dataUrl);

          // Calculate image dimensions to fit on page
          const maxWidth = doc.internal.pageSize.getWidth() - 28; // 14pt margin on each side
          const maxHeight = 100; // Max image height

          let imgWidth = img.width;
          let imgHeight = img.height;

          if (imgWidth > maxWidth) {
            const ratio = maxWidth / imgWidth;
            imgWidth = maxWidth;
            imgHeight = imgHeight * ratio;
          }

          if (imgHeight > maxHeight) {
            const ratio = maxHeight / imgHeight;
            imgHeight = maxHeight;
            imgWidth = imgWidth * ratio;
          }

          // Add image
          yPosition += 5;
          doc.addImage(img, 'JPEG', 14, yPosition, imgWidth, imgHeight); //Use the loaded image
          yPosition += imgHeight + 15;
        } catch (error) {
          console.error('Failed to add image to PDF:', error);
          yPosition += 15; // Add more space if image failed
        }
      } else {
        yPosition += 15; // Space for non-image attachments
      }

      // Add a page if we're running out of space
      if (yPosition > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPosition = 20;
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

  // Return the PDF as a blob
  return doc.output('blob');
};

// Add a simplified version that just generates the basic PDF
export const generateSimplePDF = async (invoice: InvoiceWithItems): Promise<Blob> => {
  return generatePDF(invoice, []);
};

export default generatePDF;