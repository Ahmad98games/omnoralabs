const axios = require('axios');

const MAILBLUSTER_API_URL = 'https://api.mailbluster.com/api/leads';

const createLead = async (email, firstName, lastName, fields = {}, tags = []) => {
    try {
        const apiKey = process.env.MAILBLUSTER_API_KEY;
        if (!apiKey) {
            console.warn('Mailbluster API key not found');
            return;
        }

        const payload = {
            email,
            firstName,
            lastName,
            fields,
            tags,
            subscribed: true,
            overrideExisting: true
        };

        const response = await axios.post(MAILBLUSTER_API_URL, payload, {
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log('Mailbluster Lead Updated:', response.data.message);
        return response.data;
    } catch (error) {
        console.error('Mailbluster Error:', error.response?.data || error.message);
        // Don't throw error to prevent blocking main order flow
    }
};

const sendOrderEmail = async (order, type) => {
    const { user, _id, totalAmount, items, paymentMethod, trackingNumber, carrier, trackingLink } = order;

    // Map order details to Mailbluster Merge Tags (Fields)
    // Note: You must create these fields in Mailbluster Settings > Merge Tags first
    const fields = {
        orderId: _id.toString(),
        orderTotal: totalAmount ? totalAmount.toString() : '0',
        orderItems: items ? items.map(i => `${i.name} x${i.quantity}`).join(', ') : '',
        orderLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${_id}`,
        paymentMethod: paymentMethod || '',
        trackingNumber: trackingNumber || '',
        carrier: carrier || '',
        trackingLink: trackingLink || ''
    };

    // Tag to trigger the automation
    // e.g. "Trigger_OrderPlaced", "Trigger_PaymentApproved"
    const tags = [`Trigger_${type}`];

    // Handle guest customer or registered user
    let email, firstName, lastName;

    if (order.guestCustomer) {
        email = order.guestCustomer.email;
        const names = order.guestCustomer.name ? order.guestCustomer.name.split(' ') : ['Guest'];
        firstName = names[0];
        lastName = names.length > 1 ? names.slice(1).join(' ') : '';
    } else if (order.user && order.user.email) { // If populated
        email = order.user.email;
        const names = order.user.name ? order.user.name.split(' ') : ['Customer'];
        firstName = names[0];
        lastName = names.length > 1 ? names.slice(1).join(' ') : '';
    } else {
        // Fallback if user not populated but we have ID, might need to fetch or rely on what's available
        // For now assume populated or guest
        email = 'unknown@example.com';
        firstName = 'Customer';
        lastName = '';
    }

    if (email && email !== 'unknown@example.com') {
        await createLead(
            email,
            firstName,
            lastName,
            fields,
            tags
        );
    }
};

module.exports = {
    sendOrderEmail
};
