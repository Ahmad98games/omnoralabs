import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Order } from '../platform/core/DatabaseTypes';

export const generateInvoice = (order: Order, storeName: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(storeName.toUpperCase(), pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('TAX INVOICE / RECEIPT', pageWidth / 2, 28, { align: 'center' });

    // Order Info
    doc.setFontSize(10);
    doc.text(`Invoice No: #${order.id.substring(0, 8).toUpperCase()}`, 14, 45);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 52);

    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 140, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`${order.customerName || 'Customer'}`, 140, 52);
    doc.text(`${order.customerEmail}`, 140, 59);

    // Table
    const tableData = order.lineItems.map((item: any) => [
        item.title,
        item.quantity.toString(),
        `Rs. ${item.price.toFixed(2)}`,
        `Rs. ${(item.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 70,
        head: [['Item Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 70;

    // Totals
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: Rs. ${order.totalAmount.toFixed(2)}`, pageWidth - 14, finalY + 15, { align: 'right' });

    // Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for shopping with us!', pageWidth / 2, 280, { align: 'center' });

    // Save
    doc.save(`INV-${order.id.substring(0, 8).toUpperCase()}-${storeName.replace(/\s+/g, '').toUpperCase()}.pdf`);
};

export const shareInvoiceToWhatsApp = (order: Order, phone: string) => {
    let targetPhone = phone;
    // Attempt extracting phone from order.shippingAddress or object if phone not directly provided
    if (!targetPhone) targetPhone = prompt("Enter customer phone number to share invoice:") || "";

    if (!targetPhone) {
        alert("Customer phone number is required to open WhatsApp.");
        return;
    }
    
    const cleanPhone = targetPhone.replace(/[^0-9+]/g, '');
    const message = `Hello ${order.customerName || 'there'},\n\nThank you for your order (#${order.id.substring(0, 8).toUpperCase()})! Your total is Rs. ${order.totalAmount.toLocaleString()}.\n\nYour order is currently: ${order.status}.\n\nWe will update you once it ships!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};
