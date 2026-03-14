const express = require('express');
const router = express.Router();
const domainController = require('../controllers/domainController');
const { gatekeeper, CAPABILITIES } = require('../middleware/gatekeeper');

router.post('/', gatekeeper(CAPABILITIES.STATE_MUTATING), domainController.addDomain);
router.get('/:domain/status', domainController.verifyStatus);

module.exports = router;
