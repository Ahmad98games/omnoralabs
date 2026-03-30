import dns from 'node:dns';

/**
 * DNSStatus: Industrial Verification Interface
 * Enforcing Law 7 (Telemetry) for Custom Domain Propagation.
 */
export interface DNSStatus {
    aRecord: string[];
    cname: string[];
    propagation: 'Pending' | 'Verified' | 'Mismatched';
    error?: string;
}

/**
 * dns-check: Server-Side DNS Verification Engine
 * * Verifies that the custom domain correctly points to Omnora's Edge.
 * Ensures Law 6 (Resilience) via strict error handling.
 */
export async function verifyDNS(domain: string): Promise<DNSStatus> {
    const expectedIP = '1.1.1.1'; // Omnora Edge IP (Hypothetical)
    const expectedCNAME = 'domains.omnora.com';
    
    try {
        // Parallel execution for high-speed verification
        const [aRecords, cnameRecords] = await Promise.all([
            dns.promises.resolve4(domain).catch(() => [] as string[]),
            dns.promises.resolveCname(domain).catch(() => [] as string[])
        ]);

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
    } catch (err) {
        // Replacing 'any' with a type guard ensures 100% Type Safety
        const errorMessage = err instanceof Error ? err.message : 'Unknown DNS error occurred';
        
        return {
            aRecord: [],
            cname: [],
            propagation: 'Pending',
            error: errorMessage
        };
    }
}