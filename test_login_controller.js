const dotenv = require('dotenv');
const path = require('path');

// Load backend/.env BEFORE importing controller/client
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const authController = require('./gsgbackend/controllers/authController');

const req = {
    body: {
        email: 'ahmed123457@gmail.com',
        password: 'password123'
    }
};

const res = {
    status: function(code) {
        this.statusCode = code;
        console.log('\nResponse Status:', code);
        return this;
    },
    json: function(data) {
        console.log('\nResponse JSON:', data);
    }
};

async function test() {
    console.log('Testing authController.login with mock data...');
    try {
        await authController.login(req, res);
    } catch (err) {
        console.error('\nController threw unhandled exception:', err);
    }
}

test();
