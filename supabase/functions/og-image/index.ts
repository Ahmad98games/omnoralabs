// Supabase Edge Function: og-image/index.ts
// Uses Satori + Resvg to generate a PNG from React-like markup
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import satori from "https://esm.sh/satori@0.10.11";
import { Resvg } from "https://esm.sh/@resvg/resvg-wasm@2.5.0";

// Make sure to load the WebAssembly binary for Resvg
// Note: In Supabase Edge Functions, you load WASM over a URL or bundle it.
const resvg_wasm = await fetch("https://unpkg.com/@resvg/resvg-wasm@2.5.0/index_bg.wasm").then(res => res.arrayBuffer());
import { initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.5.0";
await initWasm(resvg_wasm);

const fontData = await fetch('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2').then(res => res.arrayBuffer());

serve(async (req) => {
    try {
        const url = new URL(req.url);
        const title = url.searchParams.get('title') || 'Omnora OS Product';
        const price = url.searchParams.get('price') || '';
        const currency = url.searchParams.get('currency') || 'USD';
        const image = url.searchParams.get('image') || '';
        const merchant = url.searchParams.get('merchant') || 'Omnora OS Store';

        // Satori markup definition
        const svg = await satori(
            {
                type: 'div',
                props: {
                    style: {
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        backgroundImage: image ? `url(${image})` : 'linear-gradient(to bottom right, #1a1a1a, #000000)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        padding: '40px',
                        fontFamily: 'Inter',
                    },
                    children: [
                        {
                            type: 'div',
                            props: {
                                style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(0,0,0,0.85)',
                                    padding: '30px 50px',
                                    borderRadius: '20px',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    width: '100%',
                                    marginBottom: '20px'
                                },
                                children: [
                                    {
                                        type: 'div',
                                        props: {
                                            style: { fontSize: 32, color: '#a1a1aa', marginBottom: 10, letterSpacing: '0.1em', textTransform: 'uppercase' },
                                            children: merchant,
                                        }
                                    },
                                    {
                                        type: 'div',
                                        props: {
                                            style: { fontSize: 64, color: '#ffffff', fontWeight: 800, textAlign: 'center', marginBottom: 20 },
                                            children: title,
                                        }
                                    },
                                    price ? {
                                        type: 'div',
                                        props: {
                                            style: { fontSize: 48, color: '#34d399', fontWeight: 700 },
                                            children: `${currency === 'USD' ? '$' : currency + ' '}${price}`,
                                        }
                                    } : null
                                ].filter(Boolean),
                            }
                        }
                    ]
                }
            },
            {
                width: 1200,
                height: 630,
                fonts: [
                    {
                        name: 'Inter',
                        data: fontData,
                        weight: 400,
                    },
                    {
                        name: 'Inter',
                        data: fontData,
                        weight: 700,
                        style: 'bold'
                    }
                ],
            }
        );

        const resvg = new Resvg(svg, {
            fitTo: { mode: 'width', value: 1200 },
        });
        
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        return new Response(pngBuffer, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
});
