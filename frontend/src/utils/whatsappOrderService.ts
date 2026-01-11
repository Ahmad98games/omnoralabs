/**
 * OMNORA WHATSAPP UPLINK
 * Handles message generation and API redirects.
 */

interface OrderItem {
    id?: string;
    name: string;
    price: number;
    quantity: number;
}

// Flexible interface to handle both Backend Response and Local State
export interface OrderData {
    _id?: string;
    orderNumber: string; // Required now
    customerInfo?: { name: string; email: string; phone: string; };
    guestCustomer?: { name: string; email: string; phone: string; };
    shippingAddress?: {
        address: string;
        city: string;
        state?: string;
        postalCode?: string;
        country: string;
    };
    items?: OrderItem[];
    paymentMethod?: string;
    total?: number;       // Frontend State
    totalAmount?: number; // Backend DB
    notes?: string;
}

const WHATSAPP_BUSINESS_NUMBER = '923097613611'; // Omnora Official Line

/**
 * Format Currency
 */
const formatPrice = (amount: number) => `PKR ${amount.toLocaleString()}`;

/**
 * Format Payment Method for Human Reading
 */
function formatPaymentMethod(method?: string): string {
    if (!method) return 'Pending Selection';
    const methods: Record<string, string> = {
        cod: 'Cash on Delivery (COD)',
        meezan: 'Meezan Bank Transfer',
        jazzcash: 'JazzCash Mobile',
        easypaisa: 'EasyPaisa Mobile',
        payoneer: 'Payoneer / Wise'
    };
    return methods[method] || method.toUpperCase();
}

/**
 * Get Total Amount Safely
 */
function getOrderTotal(orderData: OrderData): string {
    const amount = orderData.totalAmount ?? orderData.total ?? 0;
    return formatPrice(amount);
}

/**
 * Generate Core Message Body
 */
function formatOrderDetailsBody(orderData: OrderData): string {
    const { orderNumber, customerInfo, guestCustomer, shippingAddress, items, paymentMethod, notes } = orderData;
    
    // Fallbacks
    const name = customerInfo?.name || guestCustomer?.name || 'Guest';
    const phone = customerInfo?.phone || guestCustomer?.phone || 'N/A';
    const city = shippingAddress?.city || 'Unknown City';
    const address = shippingAddress?.address || '';

    // Items List
    const itemsList = items?.map(i => `• ${i.name} (x${i.quantity})`).join('\n') || 'No items listed';

    return `*ORDER ID:* ${orderNumber}
*AMOUNT:* ${getOrderTotal(orderData)}
--------------------------------
*STATUS:* 🟡 Pending Confirmation
*DATE:* ${new Date().toLocaleString()}
--------------------------------
*CUSTOMER DATA*
👤 Name: ${name}
📞 Contact: ${phone}
📍 Location: ${city}
🏠 Address: ${address}

*MANIFEST*
${itemsList}

*PAYMENT CHANNEL*
💳 Method: ${formatPaymentMethod(paymentMethod)}
${notes ? `\n📝 *NOTES:* ${notes}` : ''}`;
}

/**
 * SCENARIO A: User clicks "I've Paid"
 */
export function generatePaymentReceiptMessage(orderData: OrderData): string {
    return `✅ *PAYMENT NOTIFICATION*
    
I have completed the transfer for this order.
Please verify and process.

${formatOrderDetailsBody(orderData)}

*ATTACHMENT:* [Sending Receipt Image...]`;
}

/**
 * SCENARIO B: User clicks "Continue on WhatsApp" (Automation)
 */
export function generateNewOrderMessage(orderData: OrderData): string {
    return `🚀 *NEW ORDER REQUEST*

I would like to finalize this order via WhatsApp.

${formatOrderDetailsBody(orderData)}

Please confirm availability and shipping timeline.`;
}

/**
 * Build the URL
 */
export function generateWhatsAppURL(message: string): string {
    return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Execute Redirect
 */
export function openWhatsApp(orderData: OrderData, type: 'payment' | 'automation' = 'automation'): boolean {
    try {
        const message = type === 'payment' 
            ? generatePaymentReceiptMessage(orderData) 
            : generateNewOrderMessage(orderData);

        const url = generateWhatsAppURL(message);
        window.open(url, '_blank');
        return true;
    } catch (error) {
        console.error('WhatsApp Uplink Failed:', error);
        return false;
    }
}