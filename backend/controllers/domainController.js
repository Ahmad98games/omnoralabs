const logger = require('../services/logger');
const { validateEnv } = require('../config/env');
const axios = require('axios');

const config = validateEnv();
const { vercel } = config.cloud;

/**
 * Vercel Domain API Integration:
 * Maps a custom domain to the project and checks verification status.
 */
exports.addDomain = async (req, res) => {
    try {
        const { domain } = req.body;
        const tenantId = req.tenantId || 'default_tenant';

        if (!domain) return res.status(400).json({ error: 'Domain name is required' });

        logger.info('Initiating domain mapping', { domain, tenantId });

        // Vercel Integration: Add domain to project
        let vercelStatus = 'pending';
        let verificationInstructions = 'Add CNAME record to your DNS provider pointing to cname.vercel-dns.com';

        if (vercel.token && vercel.projectId) {
            try {
                const response = await axios.post(
                    `https://api.vercel.com/v9/projects/${vercel.projectId}/domains${vercel.teamId ? `?teamId=${vercel.teamId}` : ''}`,
                    { name: domain },
                    { headers: { Authorization: `Bearer ${vercel.token}` } }
                );
                vercelStatus = response.data.verified ? 'verified' : 'pending';
            } catch (err) {
                // If domain already exists, check status
                if (err.response?.status === 409) {
                    const statusRes = await axios.get(
                        `https://api.vercel.com/v9/projects/${vercel.projectId}/domains/${domain}${vercel.teamId ? `?teamId=${vercel.teamId}` : ''}`,
                        { headers: { Authorization: `Bearer ${vercel.token}` } }
                    );
                    vercelStatus = statusRes.data.verified ? 'verified' : 'pending';
                } else {
                    throw err;
                }
            }
        } else {
            logger.warn('VERCEL_TOKEN or PROJECT_ID missing. Returning mock verification data.');
        }

        res.json({
            success: true,
            domain,
            status: vercelStatus,
            dns_verification: {
                type: 'CNAME',
                target: 'cname.vercel-dns.com',
                instructions: verificationInstructions
            }
        });
    } catch (err) {
        logger.error('Domain mapping failed', { error: err.message });
        res.status(500).json({ error: 'Failed to initiate domain mapping', message: err.message });
    }
};

exports.verifyStatus = async (req, res) => {
    try {
        const { domain } = req.params;
        const tenantId = req.tenantId || 'default_tenant';

        if (!domain) return res.status(400).json({ error: 'Domain name is required' });

        logger.info('Verifying domain status', { domain, tenantId });

        if (!vercel.token || !vercel.projectId) {
            return res.json({
                success: true,
                domain,
                status: 'pending',
                verified: false,
                reason: 'Vercel configuration missing',
                config: {
                    cname: 'shops.omnora.com',
                    a: '76.76.21.21'
                }
            });
        }

        const response = await axios.get(
            `https://api.vercel.com/v9/projects/${vercel.projectId}/domains/${domain}${vercel.teamId ? `?teamId=${vercel.teamId}` : ''}`,
            { headers: { Authorization: `Bearer ${vercel.token}` } }
        );

        const data = response.data;
        const isVerified = data.verified;
        const status = isVerified ? 'active' : 'pending';

        res.json({
            success: true,
            domain,
            status,
            verified: isVerified,
            verification: data.verification,
            error: data.error,
            config: {
                cname: 'shops.omnora.com',
                a: '76.76.21.21'
            }
        });
    } catch (err) {
        logger.error('Domain verification failed', { error: err.message });
        res.status(500).json({ 
            error: 'Failed to verify domain status', 
            message: err.response?.data?.error?.message || err.message 
        });
    }
};
