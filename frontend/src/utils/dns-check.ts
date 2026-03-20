import dns from 'node:dns';

export interface DNSStatus {
    aRecord: string[];
    cname: string[];
    propagation: 'Pending' | 'Verified' | 'Mismatched';
    error?: string;
}

/**
 * dns-check: Server-Side DNS Verification Engine
 * 
 * Verifies that the custom domain correctly points to Omnora's Edge.
 */
export async function verifyDNS(domain: string): Promise<DNSStatus> {
    const expectedIP = '1.1.1.1'; // Omnora Edge IP (Hypothetical)
    const expectedCNAME = 'domains.omnora.com';
    
    try {
        const aRecords = await dns.promises.resolve4(domain).catch(() => [] as string[]);
        const cnameRecords = await dns.promises.resolveCname(domain).catch(() => [] as string[]);

        const pointsToIP = aRecords.includes(expectedIP);
        const pointsToCNAME = cnameRecords.includes(expectedCNAME);

        if (pointsToIP || pointsToCNAME) {
            return {
                aRecord: aRecords,
                cname: cnameRecords,
                propagation: 'Verified'
            };
        }

        return {
            aRecord: aRecords,
            cname: cnameRecords,
            propagation: 'Mismatched'
        };
    } catch (err: any) {
        return {
            aRecord: [],
            cname: [],
            propagation: 'Pending',
            error: err.message
        };
    }
}
