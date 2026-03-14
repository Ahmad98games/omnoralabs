const { createModel } = require('../utils/modelFactory');

const schema = {
    sellerId: { type: String, required: true, unique: true, index: true },

    methods: {
        cod: { type: Boolean, default: true },
        bankTransfer: { type: Boolean, default: false },
        easypaisa: { type: Boolean, default: false },
        jazzcash: { type: Boolean, default: false },
        stripe: { type: Boolean, default: false },
    },

    // Bank transfer details
    bankDetails: {
        accountTitle: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        bankName: { type: String, default: '' },
        branchCode: { type: String, default: '' },
        iban: { type: String, default: '' },
    },

    // Easypaisa / JazzCash numbers
    easypaisaNumber: { type: String, default: '' },
    jazzcashNumber: { type: String, default: '' },

    // COD settings
    codMaxAmount: { type: Number, default: 50000 }, // Max COD order value (PKR)
    codFee: { type: Number, default: 0 },      // Extra fee for COD

    // Instructions shown to customer at checkout
    bankTransferInstructions: {
        type: String,
        default: 'Please transfer the amount and upload your payment receipt.'
    },
};

module.exports = createModel('PaymentMethod', schema);
