import { OmnoraKernel } from './OmnoraKernel';
import { supabase } from '../../lib/supabaseClient';

export interface MigrationReport {
    success: boolean;
    durationMs: number;
    corruptionsFixed: string[];
    versionUpgraded: boolean;
    logs: string[];
}

/**
 * KernelTester: QA Utility to simulate "Breaking Changes" and verify Self-Healing capabilities
 */
export const simulateCorruptionAndHeal = async (): Promise<MigrationReport> => {
    console.log('[Kernel QA] Starting Integrity Simulation...');
    const startTime = performance.now();
    const report: MigrationReport = {
        success: false,
        durationMs: 0,
        corruptionsFixed: [],
        versionUpgraded: false,
        logs: []
    };

    // 1. Create a healthy v1.0.0 AST Payload
    const healthyAst = {
        manifest_version: '1.0.0',
        merchant_id: 'qa-tester-store',
        blocks: [
            {
                id: 'node-1',
                type: 'hero_banner',
                props: {
                    headline: 'Test Headline',
                    bgColor: '#000000',
                    alignment: 'left'
                }
            },
            {
                id: 'node-2',
                type: 'product_grid',
                props: {
                    columns: 4,
                    limit: 8
                }
            }
        ]
    };

    // 2. Corrupt the AST (Delete Required Props deliberately)
    const corruptedAst = JSON.parse(JSON.stringify(healthyAst));
    delete corruptedAst.blocks[0].props.bgColor; // Deleted bgColor from Hero
    delete corruptedAst.blocks[1].props.columns; // Deleted columns from Grid
    report.logs.push('Corrupted AST: Deleted bgColor from hero_banner and columns from product_grid.');

    try {
        // 3. Pass through Kernel to execute Healing and Migration Pipes
        const kernel = OmnoraKernel.getInstance();
        const healedAst = await kernel.hydrate(corruptedAst);

        // 4. Verify Version Migration (Should jump from 1.0.0 -> 2.1.0)
        if (healedAst.manifest_version === '2.1.0') {
            report.versionUpgraded = true;
            report.logs.push('✅ Migrated successfully from v1.0.0 to v2.1.0');
        } else {
            report.logs.push('❌ Migration failed to update manifest_version. Got: ' + healedAst.manifest_version);
        }

        // 5. Verify Self-Healing (Default Props Injection from ComponentRegistry)
        const healedHero = healedAst.blocks.find((b: any) => b.type === 'hero_banner');
        if (healedHero && healedHero.props.bgColor === '#0a0a0f') {
            report.corruptionsFixed.push('hero_banner.bgColor');
            report.logs.push('✅ Self-Healed hero_banner.bgColor seamlessly using DEFAULT_PROPS');
        } else {
            report.logs.push('❌ Failed to self-heal hero_banner.bgColor');
        }

        const healedGrid = healedAst.blocks.find((b: any) => b.type === 'product_grid');
        if (healedGrid && healedGrid.props.columns === 3) {
            report.corruptionsFixed.push('product_grid.columns');
            report.logs.push('✅ Self-Healed product_grid.columns seamlessly using DEFAULT_PROPS');
        } else {
            report.logs.push('❌ Failed to self-heal product_grid.columns');
        }

        // 6. Verify System Logs in Supabase Audit Tables
        const { data: logs, error } = await supabase
            .from('system_logs')
            .select('*')
            .eq('event', 'KERNEL_UPGRADE')
            .order('created_at', { ascending: false })
            .limit(10);

        // We check manually since JSONB lookup might differ strictly
        const qaLog = logs?.find((log: any) => log.details?.merchant_id === 'qa-tester-store');

        if (qaLog) {
            report.logs.push('✅ Logging Audit: Successfully verified KERNEL_UPGRADE event natively in Supabase system_logs.');
        } else {
            report.logs.push('⚠️ Logging Audit: Could not verify system_log (' + (error?.message || 'Are SQL migrations applied?') + ')');
        }

        // Output overall success boolean
        report.success = report.versionUpgraded && report.corruptionsFixed.length === 2;

    } catch (error: any) {
        report.logs.push(`❌ Integrity Simulation Crashed: ${error.message}`);
        report.success = false;
    }

    report.durationMs = Math.round(performance.now() - startTime);
    console.log('[Kernel QA] Report Generated:', report);
    return report;
};
