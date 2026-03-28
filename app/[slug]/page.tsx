import { Metadata, ResolvingMetadata } from 'next';
import { supabase } from '../../lib/supabaseClient';
import { CleanRenderer } from '../../frontend/src/platform/publish/CleanRenderer';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { slug: string };
}

/**
 * 🚀 Zero-Flicker SEO Engine (Task 2.1)
 * Next.js Server-Side Metadata API
 * This function runs entirely on the server, ensuring bots see 100% SEO content.
 */
export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = params;

  // 1. Fetch Page Manifest (or Product/Collection if needed)
  const { data: page, error } = await supabase
    .from('pages')
    .select('title, seoMeta, published_at')
    .eq('slug', slug)
    .single();

  if (error || !page) return { title: 'Not Found' };

  const seo = page.seoMeta || {};
  const canonical = `https://omnora.com/${slug}`;

  return {
    title: seo.title || page.title,
    description: seo.description,
    alternates: { canonical },
    openGraph: {
      title: seo.ogTitle || seo.title || page.title,
      description: seo.ogDescription || seo.description,
      url: canonical,
      type: 'website',
      images: seo.ogImage ? [{ url: seo.ogImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.twitterTitle || seo.title || page.title,
      description: seo.twitterDescription || seo.description,
      images: seo.twitterImage ? [seo.twitterImage] : [],
    },
    // Custom JSON-LD can be injected via <script> in the component, 
    // but basic meta is handled here.
  };
}

export default async function StorefrontPage({ params }: PageProps) {
  const { slug } = params;

  // Fetch Full Page Data for Rendering
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!page) notFound();

  // JSON-LD Structured Data (Product/Collection/Article)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: page.title,
    url: `https://omnora.com/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CleanRenderer 
        nodes={page.content?.nodes || {}} 
        rootIds={page.content?.rootIds || []} 
        pageId={page.id}
      />
    </>
  );
}
