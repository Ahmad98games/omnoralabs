const axios = require('axios');

// Sends WhatsApp message with order details via CallMeBot
async function sendOrderWhatsAppNotification(order) {
  const phone = '+923334355475';
  const itemsString = order.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
  const msg = `NEW OMNORA ORDER!\nName: ${order.customer.firstName || order.customer.name} ${order.customer.lastName || ''}\nPhone: ${order.customer.phone}\nOrder No: ${order.orderNumber}\nTotal: PKR ${order.total}\nItems: ${itemsString}`;
  try {
    await axios.get('https://api.callmebot.com/whatsapp.php', {
      params: {
        phone,
        text: msg,
        apikey: process.env.CALLMEBOT_APIKEY // Add your key in .env
      }
    });
    return true;
  } catch (error) {
    console.error('WhatsApp notification failed:', error.message || error);
    return false;
  }
}
module.exports = { sendOrderWhatsAppNotification };
