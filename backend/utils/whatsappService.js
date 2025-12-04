const axios = require("axios");
const { formatPhoneNumber, isValidWhatsAppNumber } = require("./phoneFormatter");

/**
 * Message Templates for consistent messaging
 */
const messageTemplates = {
    orderCreated: (name, orderNumber, total) =>
        `Hi ${name}! 🎉\n\nYour order *${orderNumber}* has been received.\n\n💰 Total: PKR ${total.toLocaleString()}\n\nThank you for shopping with Omnora!`,

    orderShipped: (name, orderNumber, trackingNumber) =>
        `Hi ${name}! 📦\n\nYour order *${orderNumber}* has been shipped.\n\n🚚 Tracking: ${trackingNumber}\n\nYou'll receive it soon!`,

    orderDelivered: (name, orderNumber) =>
        `Hi ${name}! ✅\n\nYour order *${orderNumber}* has been delivered.\n\nThank you for shopping with Omnora! We hope to serve you again.`,

    paymentApproved: (name, orderNumber) =>
        `Hi ${name}! ✅\n\nPayment approved for order *${orderNumber}*.\n\nYour order is now being processed. Thank you for shopping with Omnora!`,

    orderCancelled: (name, orderNumber) =>
        `Hi ${name},\n\nYour order *${orderNumber}* has been cancelled.\n\nIf you have any questions, please contact our support.`,

    paymentReminder: (name, orderNumber, total) =>
        `Hi ${name},\n\nReminder: Payment pending for order *${orderNumber}*.\n\n💰 Amount: PKR ${total.toLocaleString()}\n\nPlease complete your payment to process the order.`
};

/**
 * Send template message via WhatsApp Cloud API
 * @param {string} to - Phone number in international format
 * @param {string} templateName - Name of the template
 * @param {string} languageCode - Language code (e.g., "en_US")
 * @param {Array} components - Template components
 * @returns {Promise<Object|null>} - API response with message ID or null on failure
 */
const sendTemplateMessage = async (to, templateName, languageCode = "en_US", components = []) => {
    try {
        const formattedPhone = formatPhoneNumber(to);

        if (!formattedPhone || !isValidWhatsAppNumber(formattedPhone)) {
            console.warn(`Invalid WhatsApp number: ${to}`);
            return null;
        }

        const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
        const payload = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
                name: templateName,
                language: { code: languageCode },
                components: components
            }
        };

        const res = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        console.log(`✅ WhatsApp template message sent to ${formattedPhone}:`, res.data);

        // Return full response including message ID
        // Response format: { messaging_product: 'whatsapp', contacts: [...], messages: [{ id: 'wamid.xxx' }] }
        return res.data;
    } catch (err) {
        console.error("❌ WhatsApp API Error:", err.response?.data || err.message);
        // Return error details for DLQ handling
        return {
            error: true,
            message: err.response?.data || err.message,
            status: err.response?.status
        };
    }
};

/**
 * Send text message via WhatsApp Cloud API
 * @param {string} to - Phone number in international format (e.g., 923001234567)
 * @param {string} body - Message text
 * @returns {Promise<Object|null>} - Response data or null on failure
 */
const sendTextMessage = async (to, body) => {
    try {
        // Format and validate phone number
        const formattedPhone = formatPhoneNumber(to);

        if (!formattedPhone || !isValidWhatsAppNumber(formattedPhone)) {
            console.warn(`Invalid WhatsApp number: ${to}`);
            return null;
        }

        const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
        const payload = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "text",
            text: { body }
        };

        const res = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        console.log(`✅ WhatsApp message sent to ${formattedPhone}:`, res.data);
        return res.data;
    } catch (err) {
        console.error("❌ WhatsApp API Error:", err.response?.data || err.message);
        // Don't throw error to prevent blocking the main flow
        return null;
    }
};

/**
 * Send order created notification
 */
const sendOrderCreatedNotification = async (phone, customerName, orderNumber, totalAmount) => {
    const message = messageTemplates.orderCreated(customerName, orderNumber, totalAmount);
    return await sendTextMessage(phone, message);
};

/**
 * Send order shipped notification
 */
const sendOrderShippedNotification = async (phone, customerName, orderNumber, trackingNumber) => {
    const message = messageTemplates.orderShipped(customerName, orderNumber, trackingNumber);
    return await sendTextMessage(phone, message);
};

/**
 * Send order delivered notification
 */
const sendOrderDeliveredNotification = async (phone, customerName, orderNumber) => {
    const message = messageTemplates.orderDelivered(customerName, orderNumber);
    return await sendTextMessage(phone, message);
};

/**
 * Send payment approved notification (Using Template)
 */
const sendPaymentApprovedNotification = async (phone, customerName, orderNumber) => {
    // Use template message for approval as requested
    const components = [
        {
            type: "body",
            parameters: [
                { type: "text", text: customerName },
                { type: "text", text: orderNumber }
            ]
        }
    ];

    // Try sending template message first
    const result = await sendTemplateMessage(phone, "order_approved", "en_US", components);

    // Fallback to text message if template fails (optional, but good for reliability)
    if (!result) {
        console.log("⚠️ Falling back to text message for payment approval...");
        const message = messageTemplates.paymentApproved(customerName, orderNumber);
        return await sendTextMessage(phone, message);
    }

    return result;
};

/**
 * Send order cancelled notification
 */
const sendOrderCancelledNotification = async (phone, customerName, orderNumber) => {
    const message = messageTemplates.orderCancelled(customerName, orderNumber);
    return await sendTextMessage(phone, message);
};

/**
 * Send payment reminder notification
 */
const sendPaymentReminderNotification = async (phone, customerName, orderNumber, totalAmount) => {
    const message = messageTemplates.paymentReminder(customerName, orderNumber, totalAmount);
    return await sendTextMessage(phone, message);
};

module.exports = {
    sendTextMessage,
    sendTemplateMessage,
    sendOrderCreatedNotification,
    sendOrderShippedNotification,
    sendOrderDeliveredNotification,
    sendPaymentApprovedNotification,
    sendOrderCancelledNotification,
    sendPaymentReminderNotification,
    messageTemplates
};
