import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import type { Order } from '../platform/core/DatabaseTypes';

// ─── Industrial Interfaces ───────────────────────────────────────────────────
interface OrderLineItem {
    title: string;
    quantity: number;
    price: number;
    [key: string]: unknown;
}

// Extension to handle jsPDF internal state with autoTable
interface jsPDFWithPlugin extends jsPDF {
    lastAutoTable: {
        finalY: number;
    };
}

export const generateInvoice = (order: Order, storeName: string): void => {
    const doc = new jsPDF() as jsPDFWithPlugin;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header - Industrial Branding
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(storeName.toUpperCase(), pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('TAX INVOICE / RECEIPT', pageWidth / 2, 28, { align: 'center' });

    // Order Info - Precision Layout
    doc.setFontSize(10);
    doc.text(`Invoice No: #${order.id.substring(0, 8).toUpperCase()}`, 14, 45);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 52);

    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 140, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`${order.customerName || 'Customer'}`, 140, 52);
    doc.text(`${order.customerEmail}`, 140, 59);

    // Table Logic - Zero-Debt Mapping
    const tableData = (order.lineItems as unknown as OrderLineItem[]).map((item) => [
        item.title,
        item.quantity.toString(),
        `Rs. ${item.price.toFixed(2)}`,
        `Rs. ${(item.price * item.quantity).toFixed(2)}`
    ]);

    const tableOptions: UserOptions = {
        startY: 70,
        head: [['Item Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40] },
        styles: { font: 'helvetica', fontSize: 9 },
    };

    autoTable(doc, tableOptions);

    const finalY = doc.lastAutoTable.finalY || 70;

    // Totals - Law 4 Tabular Numerals (Visual Alignment)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: Rs. ${order.totalAmount.toFixed(2)}`, pageWidth - 14, finalY + 15, { align: 'right' });

    // Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for shopping with us!', pageWidth / 2, 280, { align: 'center' });

    // Atomic Save
    doc.save(`INV-${order.id.substring(0, 8).toUpperCase()}-${storeName.replace(/\s+/g, '').toUpperCase()}.pdf`);
};

export const shareInvoiceToWhatsApp = (order: Order, phone: string): void => {
    let targetPhone = phone;
    
    if (!targetPhone) {
        targetPhone = window.prompt("Enter customer phone number to share invoice:") || "";
    }

    if (!targetPhone) {
        alert("Customer phone number is required to open WhatsApp.");
        return;
    }
    
    const cleanPhone = targetPhone.replace(/[^0-9+]/g, '');
    const message = `Hello ${order.customerName || 'there'},\n\nThank you for your order (#${order.id.substring(0, 8).toUpperCase()})! Your total is Rs. ${order.totalAmount.toLocaleString()}.\n\nYour order is currently: ${order.status}.\n\nWe will update you once it ships!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};