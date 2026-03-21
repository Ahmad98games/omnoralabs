/**
 * OrderMessageUtility: Multi-Language WhatsApp Order formatter
 * 
 * Generates formatted WhatsApp messages in English or Roman Urdu flawless.
 */

export interface OrderDetails {
    orderId: string;
    total: number;
    currency: string;
    items: { name: string; quantity: number; variant_name?: string }[];
    paymentMethod: {
        name: string;
        accountTitle: string;
        accountNumber: string;
    };
    language: 'en' | 'ur_roman';
    screenshotUploadUrl?: string;
    discountCode?: string;
    discountValue?: number;
    subtotal?: number;
}

export function generateOrderMessage(details: OrderDetails): string {
    const { orderId, total, subtotal, discountCode, discountValue, currency, items, paymentMethod, language, screenshotUploadUrl } = details;

    const isUrdu = language === 'ur_roman';

    const itemText = items.map(item => `- ${item.name} ${item.variant_name ? `(${item.variant_name}) ` : ''}(x${item.quantity})`).join('\n');

    if (isUrdu) {
        return `*Naya Order Received!* 🛍️\n\n` +
               `*Order ID:* #${orderId}\n` +
               `*Item List:* \n${itemText}\n\n` +
               (discountCode ? `*Order Total:* ${currency} ${(subtotal || total + (discountValue || 0)).toFixed(2)} | *Discount (${discountCode}):* -${currency} ${discountValue?.toFixed(2)} | *Grand Total:* ${currency} ${total}\n\n` : `*Total Amount:* ${currency} ${total}\n\n`) +
               `*Payment details:* \n` +
               `- *Bank:* ${paymentMethod.name}\n` +
               `- *Title:* ${paymentMethod.accountTitle}\n` +
               `- *Number:* ${paymentMethod.accountNumber}\n\n` +
               `*Instruction:* Paise bhej kar screenshot yahan share karein.\n` +
               (screenshotUploadUrl ? `*Upload Link:* ${screenshotUploadUrl}\n` : '') +
               `Powered by Omnora OS`;
    }

    return `*New Order Placed!* 🛍️\n\n` +
           `*Order ID:* #${orderId}\n` +
           `*Items:* \n${itemText}\n\n` +
           (discountCode ? `*Order Total:* ${currency} ${(subtotal || total + (discountValue || 0)).toFixed(2)} | *Discount (${discountCode}):* -${currency} ${discountValue?.toFixed(2)} | *Grand Total:* ${currency} ${total}\n\n` : `*Total:* ${currency} ${total}\n\n`) +
           `*Payment:* \n` +
           `- *Method:* ${paymentMethod.name}\n` +
           `- *Title:* ${paymentMethod.accountTitle}\n` +
           `- *Account:* ${paymentMethod.accountNumber}\n\n` +
           `*Instruction:* Please send the payment and share the receipt here.\n` +
           (screenshotUploadUrl ? `*Upload Link:* ${screenshotUploadUrl}\n` : '') +
           `Powered by Omnora OS`;
}
