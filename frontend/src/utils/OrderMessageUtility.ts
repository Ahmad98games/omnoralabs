/**
 * OrderMessageUtility: Multi-Language WhatsApp Order formatter
 * 
 * Generates formatted WhatsApp messages in English or Roman Urdu flawless.
 */

export interface OrderDetails {
    orderId: string;
    total: number;
    currency: string;
    items: { name: string; quantity: number }[];
    paymentMethod: {
        name: string;
        accountTitle: string;
        accountNumber: string;
    };
    language: 'en' | 'ur_roman';
    screenshotUploadUrl?: string;
}

export function generateOrderMessage(details: OrderDetails): string {
    const { orderId, total, currency, items, paymentMethod, language, screenshotUploadUrl } = details;

    const isUrdu = language === 'ur_roman';

    const itemText = items.map(item => `- ${item.name} (x${item.quantity})`).join('\n');

    if (isUrdu) {
        return `*Naya Order Received!* 🛍️\n\n` +
               `*Order ID:* #${orderId}\n` +
               `*Item List:* \n${itemText}\n\n` +
               `*Total Amount:* ${currency} ${total}\n\n` +
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
           `*Total:* ${currency} ${total}\n\n` +
           `*Payment:* \n` +
           `- *Method:* ${paymentMethod.name}\n` +
           `- *Title:* ${paymentMethod.accountTitle}\n` +
           `- *Account:* ${paymentMethod.accountNumber}\n\n` +
           `*Instruction:* Please send the payment and share the receipt here.\n` +
           (screenshotUploadUrl ? `*Upload Link:* ${screenshotUploadUrl}\n` : '') +
           `Powered by Omnora OS`;
}
