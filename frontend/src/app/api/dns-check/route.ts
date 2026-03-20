import { NextResponse } from 'next/server';
import { verifyDNS } from '../../../utils/dns-check';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 });
    }

    try {
        const status = await verifyDNS(domain);
        return NextResponse.json({ success: true, ...status });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
