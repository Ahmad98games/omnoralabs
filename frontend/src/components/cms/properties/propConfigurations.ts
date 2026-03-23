import {
  Type, LayoutGrid, Sparkles, Image,
  Grid, SortAsc, Plus, Settings, Shield
} from 'lucide-react';

/**
 * propConfigurations — Omnora OS
 *
 * Defines the properties panel schema for every block type.
 * Every key here must match a key in ComponentRegistry and DEFAULT_PROPS exactly.
 *
 * Rules:
 * - 'hero' must exist — it is the type created by addPage()
 * - No hyphenated keys (trust-badges, faq-accordion) — use underscores only
 * - visibleIf functions use strict equality checks
 */

export interface PropField {
  name: string;
  type: 'text' | 'number' | 'slider' | 'toggle' | 'select' | 'image' | 'video' | 'color' | 'date' | 'array';
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string | number; label: string }[];
  category?: string;
  visibleIf?: (props: any) => boolean;
  responsive?: boolean;
  itemSchema?: { fields: PropField[] };
}

export interface ComponentPropConfig {
  sections: {
    title: string;
    icon: any;
    fields: PropField[];
  }[];
}

// ─── Shared field sets (reused across similar block types) ────────────────────

const CARD_STYLE_FIELDS: PropField[] = [
  {
    name: 'cardStyle',
    type: 'select',
    label: 'Card Style',
    options: [
      { value: 'minimal', label: 'Minimal' },
      { value: 'bordered', label: 'Bordered' },
      { value: 'shadowed', label: 'Shadowed' },
    ],
  },
  { name: 'showPrice', type: 'toggle', label: 'Show Price' },
  { name: 'showAddToCart', type: 'toggle', label: 'Show Add to Cart' },
];

const HERO_SECTIONS = [
  {
    title: 'Background',
    icon: Image,
    fields: [
      {
        name: 'backgroundType',
        type: 'select' as const,
        label: 'Background Type',
        options: [
          { value: 'color', label: 'Solid Color' },
          { value: 'image', label: 'Image' },
          { value: 'video', label: 'Video' },
        ],
      },
      {
        name: 'bgColor',
        type: 'color' as const,
        label: 'Background Color',
        visibleIf: (p: any) => p.backgroundType === 'color' || !p.backgroundType,
      },
      {
        name: 'imageSrc',
        type: 'image' as const,
        label: 'Background Image',
        visibleIf: (p: any) => p.backgroundType === 'image',
      },
      {
        name: 'overlayOpacity',
        type: 'slider' as const,
        label: 'Overlay Opacity (%)',
        min: 0, max: 80, step: 5,
        visibleIf: (p: any) => p.backgroundType === 'image',
      },
      {
        name: 'bgVideoUrl',
        type: 'video' as const,
        label: 'Video URL',
        placeholder: 'Paste video URL...',
        visibleIf: (p: any) => p.backgroundType === 'video',
      },
      { name: 'minHeight', type: 'slider' as const, label: 'Min Height (px)', min: 200, max: 800, step: 20 },
    ],
  },
  {
    title: 'Content & CTA',
    icon: Type,
    fields: [
      { name: 'headline', type: 'text' as const, label: 'Headline', placeholder: 'Enter headline...' },
      { name: 'subheadline', type: 'text' as const, label: 'Subheadline', placeholder: 'Enter subheadline...' },
      {
        name: 'textAlign',
        type: 'select' as const,
        label: 'Text Alignment',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
      },
      { name: 'textColor', type: 'color' as const, label: 'Text Color' },
      { name: 'ctaLabel', type: 'text' as const, label: 'Button Label', placeholder: 'Shop Now' },
      { name: 'ctaUrl', type: 'text' as const, label: 'Button URL', placeholder: '#' },
      {
        name: 'buttonStyle',
        type: 'select' as const,
        label: 'Button Style',
        options: [
          { value: 'filled', label: 'Filled' },
          { value: 'outline', label: 'Outline' },
          { value: 'ghost', label: 'Ghost' },
        ],
      },
      { name: 'buttonColor', type: 'color' as const, label: 'Button Color' },
    ],
  },
];

// ─── PROP_CONFIGS ─────────────────────────────────────────────────────────────

export const PROP_CONFIGS: Record<string, ComponentPropConfig> = {

  // hero and hero_banner share identical config.
  // hero must be here — it is what addPage() creates.
  'hero': { sections: HERO_SECTIONS },
  'hero_banner': { sections: HERO_SECTIONS },

  'split_hero': {
    sections: [
      {
        title: 'Layout',
        icon: LayoutGrid,
        fields: [
          {
            name: 'imagePosition',
            type: 'select',
            label: 'Image Side',
            options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }],
          },
          { name: 'splitRatio', type: 'slider', label: 'Left Column Width (%)', min: 30, max: 70, step: 1 },
        ],
      },
      {
        title: 'Image',
        icon: Image,
        fields: [
          { name: 'imageSrc', type: 'image', label: 'Image' },
          {
            name: 'imageObjectFit',
            type: 'select',
            label: 'Object Fit',
            options: [{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }],
          },
        ],
      },
      {
        title: 'Content',
        icon: Type,
        fields: [
          { name: 'headline', type: 'text', label: 'Headline' },
          { name: 'richText', type: 'text', label: 'Body Text' },
          { name: 'ctaText', type: 'text', label: 'CTA Label' },
          { name: 'ctaLink', type: 'text', label: 'CTA URL' },
          { name: 'ctaColor', type: 'color', label: 'CTA Color' },
        ],
      },
    ],
  },

  'product_grid': {
    sections: [
      {
        title: 'Grid Layout',
        icon: LayoutGrid,
        fields: [
          {
            name: 'columns',
            type: 'select',
            label: 'Columns',
            options: [{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }],
          },
          { name: 'gap', type: 'slider', label: 'Gap (px)', min: 8, max: 40, step: 4 },
          {
            name: 'productSource',
            type: 'select',
            label: 'Source',
            options: [
              { value: 'auto', label: 'All Products' },
              { value: 'collection', label: 'By Collection' },
              { value: 'bestsellers', label: 'Best Sellers' },
              { value: 'manual', label: 'Manual' },
            ],
          },
          {
            name: 'collectionId',
            type: 'text',
            label: 'Collection ID',
            placeholder: 'Enter collection ID',
            visibleIf: (p: any) => p.productSource === 'collection',
          },
          {
            name: 'productIds',
            type: 'text',
            label: 'Product IDs (comma separated)',
            placeholder: 'prod_1, prod_2',
            visibleIf: (p: any) => p.productSource === 'manual',
          },
        ],
      },
      {
        title: 'Card Style',
        icon: Settings,
        fields: [
          ...CARD_STYLE_FIELDS,
          {
            name: 'imageAspectRatio',
            type: 'select',
            label: 'Image Ratio',
            options: [
              { value: 'square', label: 'Square 1:1' },
              { value: 'portrait', label: 'Portrait 3:4' },
              { value: 'landscape', label: 'Landscape 16:9' },
            ],
          },
          { name: 'showBadge', type: 'toggle', label: 'Show New/Sale Badge' },
        ],
      },
    ],
  },

  'featured_product': {
    sections: [
      {
        title: 'Layout',
        icon: LayoutGrid,
        fields: [
          { name: 'productId', type: 'text', label: 'Product ID', placeholder: 'prod_123' },
          {
            name: 'layout',
            type: 'select',
            label: 'Direction',
            options: [
              { value: 'media-left', label: 'Media Left' },
              { value: 'media-right', label: 'Media Right' },
              { value: 'media-top', label: 'Media Top' },
            ],
          },
          { name: 'mediaSize', type: 'slider', label: 'Media Width (%)', min: 30, max: 70, step: 5 },
        ],
      },
      {
        title: 'Display Options',
        icon: Settings,
        fields: [
          { name: 'showDescription', type: 'toggle', label: 'Show Description' },
          { name: 'showVariants', type: 'toggle', label: 'Show Variants' },
          { name: 'showReviews', type: 'toggle', label: 'Show Reviews' },
        ],
      },
    ],
  },

  'best_sellers': {
    sections: [
      {
        title: 'Configuration',
        icon: Grid,
        fields: [
          { name: 'title', type: 'text', label: 'Heading', placeholder: 'Best Sellers' },
          { name: 'limit', type: 'slider', label: 'Product Count', min: 2, max: 12, step: 1 },
          {
            name: 'columns',
            type: 'select',
            label: 'Columns',
            options: [{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }],
          },
          ...CARD_STYLE_FIELDS,
        ],
      },
    ],
  },

  'recently_viewed': {
    sections: [
      {
        title: 'Settings',
        icon: SortAsc,
        fields: [
          { name: 'title', type: 'text', label: 'Heading', placeholder: 'Recently Viewed' },
          { name: 'limit', type: 'slider', label: 'Max Items', min: 2, max: 12, step: 1 },
          { name: 'emptyStateText', type: 'text', label: 'Empty State Text' },
          { name: 'persistAcrossSessions', type: 'toggle', label: 'Persist Across Sessions' },
        ],
      },
    ],
  },

  'store_header': {
    sections: [
      {
        title: 'Branding',
        icon: LayoutGrid,
        fields: [
          { name: 'logoSrc', type: 'image', label: 'Logo' },
          { name: 'logoHeight', type: 'slider', label: 'Logo Height (px)', min: 24, max: 80, step: 2 },
          { name: 'logoAlt', type: 'text', label: 'Logo Alt Text' },
        ],
      },
      {
        title: 'Navigation',
        icon: Settings,
        fields: [
          { name: 'showSearch', type: 'toggle', label: 'Show Search' },
          { name: 'showCart', type: 'toggle', label: 'Show Cart' },
          { name: 'showAccountIcon', type: 'toggle', label: 'Show Account' },
          { name: 'sticky', type: 'toggle', label: 'Sticky Header' },
          { name: 'backgroundColor', type: 'color', label: 'Background Color' },
          { name: 'textColor', type: 'color', label: 'Text Color' },
          { name: 'borderBottom', type: 'toggle', label: 'Bottom Border' },
          {
            name: 'mobileBreakpoint',
            type: 'select',
            label: 'Mobile Breakpoint',
            options: [{ value: 'sm', label: 'SM < 640px' }, { value: 'md', label: 'MD < 768px' }],
          },
          {
            name: 'hamburgerStyle',
            type: 'select',
            label: 'Hamburger Style',
            options: [{ value: 'lines', label: 'Lines' }, { value: 'dots', label: 'Dots' }, { value: 'cross', label: 'Cross' }],
          },
        ],
      },
    ],
  },

  'announcement_bar': {
    sections: [
      {
        title: 'Content',
        icon: Sparkles,
        fields: [
          { name: 'text', type: 'text', label: 'Message', placeholder: 'Free shipping on orders over $50!' },
          { name: 'link', type: 'text', label: 'Link URL', placeholder: '/collections/all' },
          { name: 'scrolling', type: 'toggle', label: 'Marquee Scroll' },
          { name: 'dismissable', type: 'toggle', label: 'Dismissable' },
        ],
      },
      {
        title: 'Style & Countdown',
        icon: Settings,
        fields: [
          { name: 'backgroundColor', type: 'color', label: 'Background' },
          { name: 'textColor', type: 'color', label: 'Text Color' },
          { name: 'showCountdown', type: 'toggle', label: 'Show Countdown' },
          {
            name: 'endDate',
            type: 'text',
            label: 'End Date (YYYY-MM-DD)',
            placeholder: '2026-12-31',
            visibleIf: (p: any) => p.showCountdown === true,
          },
        ],
      },
    ],
  },

  'cart_drawer': {
    sections: [
      {
        title: 'Drawer',
        icon: LayoutGrid,
        fields: [
          {
            name: 'triggerIcon',
            type: 'select',
            label: 'Icon',
            options: [{ value: 'bag', label: 'Bag' }, { value: 'cart', label: 'Cart' }, { value: 'basket', label: 'Basket' }],
          },
          {
            name: 'drawerPosition',
            type: 'select',
            label: 'Slide From',
            options: [{ value: 'right', label: 'Right' }, { value: 'left', label: 'Left' }],
          },
          { name: 'showProductImages', type: 'toggle', label: 'Show Images' },
          { name: 'showQuantityControls', type: 'toggle', label: 'Show Quantity Controls' },
        ],
      },
      {
        title: 'Upsell & Shipping',
        icon: Sparkles,
        fields: [
          { name: 'upsellEnabled', type: 'toggle', label: 'Enable Upsell' },
          { name: 'upsellTitle', type: 'text', label: 'Upsell Title', visibleIf: (p: any) => p.upsellEnabled === true },
          { name: 'showFreeShippingBar', type: 'toggle', label: 'Free Shipping Bar' },
          {
            name: 'freeShippingThreshold',
            type: 'number',
            label: 'Free Shipping Threshold ($)',
            visibleIf: (p: any) => p.showFreeShippingBar === true,
          },
        ],
      },
      {
        title: 'Checkout Button',
        icon: Settings,
        fields: [
          { name: 'checkoutButtonText', type: 'text', label: 'Button Text' },
          { name: 'checkoutButtonColor', type: 'color', label: 'Button Color' },
        ],
      },
    ],
  },

  'checkout_block': {
    sections: [
      {
        title: 'Layout',
        icon: LayoutGrid,
        fields: [
          {
            name: 'layout',
            type: 'select',
            label: 'Layout',
            options: [{ value: 'single-page', label: 'Single Page' }, { value: 'multi-step', label: 'Multi-Step' }],
          },
          { name: 'primaryColor', type: 'color', label: 'Primary Color' },
          { name: 'termsUrl', type: 'text', label: 'Terms URL', placeholder: '/terms' },
        ],
      },
      {
        title: 'Options',
        icon: Settings,
        fields: [
          { name: 'showOrderSummary', type: 'toggle', label: 'Show Order Summary' },
          { name: 'showPromoCode', type: 'toggle', label: 'Show Promo Code' },
          { name: 'showExpressCheckout', type: 'toggle', label: 'Express Checkout' },
          { name: 'requirePhone', type: 'toggle', label: 'Require Phone' },
        ],
      },
    ],
  },

  'upsell_widget': {
    sections: [
      {
        title: 'Placement',
        icon: Sparkles,
        fields: [
          {
            name: 'position',
            type: 'select',
            label: 'Position',
            options: [
              { value: 'pre-checkout', label: 'Pre-Checkout' },
              { value: 'post-add-to-cart', label: 'Post Add to Cart' },
              { value: 'cart-page', label: 'Cart Page' },
            ],
          },
          {
            name: 'displayStyle',
            type: 'select',
            label: 'Style',
            options: [
              { value: 'inline', label: 'Inline' },
              { value: 'popup', label: 'Popup' },
              { value: 'sticky-bar', label: 'Sticky Bar' },
            ],
          },
        ],
      },
      {
        title: 'Content',
        icon: Settings,
        fields: [
          { name: 'title', type: 'text', label: 'Title' },
          { name: 'maxProducts', type: 'number', label: 'Max Products (1-4)' },
          { name: 'discountPercent', type: 'number', label: 'Discount (%)' },
          { name: 'backgroundColor', type: 'color', label: 'Background' },
        ],
      },
    ],
  },

  'trust_badges': {
    sections: [
      {
        title: 'Layout',
        icon: LayoutGrid,
        fields: [
          {
            name: 'layout',
            type: 'select',
            label: 'Layout',
            options: [{ value: 'row', label: 'Row' }, { value: 'grid', label: 'Grid' }],
          },
          {
            name: 'badgeStyle',
            type: 'select',
            label: 'Badge Style',
            options: [
              { value: 'icon-text', label: 'Icon + Text' },
              { value: 'icon-only', label: 'Icon Only' },
              { value: 'text-only', label: 'Text Only' },
            ],
          },
          { name: 'iconSize', type: 'slider', label: 'Icon Size (px)', min: 24, max: 64, step: 4 },
        ],
      },
      {
        title: 'Badges',
        icon: Shield,
        fields: [
          {
            name: 'badges',
            type: 'array',
            label: 'Badges',
            itemSchema: {
              fields: [
                {
                  name: 'icon',
                  type: 'select',
                  label: 'Icon',
                  options: [
                    { value: 'shield-check', label: 'Shield' },
                    { value: 'truck', label: 'Truck' },
                    { value: 'return-arrow', label: 'Returns' },
                    { value: 'lock', label: 'Lock' },
                    { value: 'star', label: 'Star' },
                    { value: 'clock', label: 'Clock' },
                    { value: 'phone', label: 'Phone' },
                  ],
                },
                { name: 'text', type: 'text', label: 'Title' },
                { name: 'subtext', type: 'text', label: 'Subtitle' },
              ],
            },
          },
          { name: 'iconColor', type: 'color', label: 'Icon Color' },
          { name: 'textColor', type: 'color', label: 'Text Color' },
          { name: 'backgroundColor', type: 'color', label: 'Background' },
        ],
      },
    ],
  },

  'customer_reviews': {
    sections: [
      {
        title: 'Display',
        icon: LayoutGrid,
        fields: [
          {
            name: 'layout',
            type: 'select',
            label: 'Layout',
            options: [
              { value: 'grid', label: 'Grid' },
              { value: 'carousel', label: 'Carousel' },
              { value: 'masonry', label: 'Masonry' },
            ],
          },
          {
            name: 'columns',
            type: 'select',
            label: 'Columns',
            options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }],
          },
          { name: 'showStarSummary', type: 'toggle', label: 'Star Summary' },
          { name: 'showVerifiedBadge', type: 'toggle', label: 'Verified Badge' },
          {
            name: 'cardStyle',
            type: 'select',
            label: 'Card Style',
            options: [
              { value: 'flat', label: 'Flat' },
              { value: 'bordered', label: 'Bordered' },
              { value: 'elevated', label: 'Elevated' },
            ],
          },
        ],
      },
      {
        title: 'Source',
        icon: Settings,
        fields: [
          {
            name: 'source',
            type: 'select',
            label: 'Review Source',
            options: [
              { value: 'manual', label: 'Manual' },
              { value: 'judge.me', label: 'Judge.me' },
              { value: 'loox', label: 'Loox' },
              { value: 'yotpo', label: 'Yotpo' },
            ],
          },
          {
            name: 'reviews',
            type: 'array',
            label: 'Reviews',
            visibleIf: (p: any) => p.source === 'manual',
            itemSchema: {
              fields: [
                { name: 'author', type: 'text', label: 'Author' },
                { name: 'rating', type: 'number', label: 'Rating (1-5)' },
                { name: 'content', type: 'text', label: 'Review Text' },
                { name: 'date', type: 'text', label: 'Date' },
                { name: 'avatar', type: 'image', label: 'Avatar' },
              ],
            },
          },
          { name: 'accentColor', type: 'color', label: 'Star Color' },
        ],
      },
    ],
  },

  'whatsapp_button': {
    sections: [
      {
        title: 'Placement',
        icon: LayoutGrid,
        fields: [
          {
            name: 'position',
            type: 'select',
            label: 'Position',
            options: [
              { value: 'bottom-right', label: 'Bottom Right' },
              { value: 'bottom-left', label: 'Bottom Left' },
              { value: 'inline', label: 'Inline' },
            ],
          },
          {
            name: 'onlyShowOn',
            type: 'select',
            label: 'Show On',
            options: [
              { value: 'all', label: 'All Devices' },
              { value: 'mobile', label: 'Mobile Only' },
              { value: 'desktop', label: 'Desktop Only' },
            ],
          },
        ],
      },
      {
        title: 'Content',
        icon: Settings,
        fields: [
          { name: 'phoneNumber', type: 'text', label: 'Phone Number', placeholder: '+1234567890' },
          { name: 'defaultMessage', type: 'text', label: 'Pre-filled Message' },
          { name: 'buttonLabel', type: 'text', label: 'Button Label' },
          { name: 'showPulse', type: 'toggle', label: 'Pulse Animation' },
          { name: 'buttonColor', type: 'color', label: 'Button Color' },
        ],
      },
    ],
  },

  'policy_strip': {
    sections: [
      {
        title: 'Settings',
        icon: Settings,
        fields: [
          {
            name: 'layout',
            type: 'select',
            label: 'Layout',
            options: [{ value: 'row', label: 'Row' }, { value: 'stacked', label: 'Stacked' }],
          },
          {
            name: 'separator',
            type: 'select',
            label: 'Separator',
            options: [{ value: 'divider', label: 'Line' }, { value: 'dot', label: 'Dot' }, { value: 'none', label: 'None' }],
          },
          {
            name: 'fontSize',
            type: 'select',
            label: 'Font Size',
            options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }],
          },
          {
            name: 'policies',
            type: 'array',
            label: 'Policies',
            itemSchema: {
              fields: [
                { name: 'label', type: 'text', label: 'Label' },
                {
                  name: 'icon',
                  type: 'select',
                  label: 'Icon',
                  options: [
                    { value: 'shield-check', label: 'Shield' },
                    { value: 'truck', label: 'Truck' },
                    { value: 'return-arrow', label: 'Returns' },
                    { value: 'lock', label: 'Lock' },
                  ],
                },
                { name: 'linkUrl', type: 'text', label: 'URL' },
              ],
            },
          },
        ],
      },
    ],
  },

  'text_section': {
    sections: [
      {
        title: 'Content',
        icon: Type,
        fields: [
          { name: 'heading', type: 'text', label: 'Heading', placeholder: 'Enter heading...' },
          {
            name: 'headingSize',
            type: 'select',
            label: 'Heading Size',
            options: [
              { value: 'sm', label: 'Small' },
              { value: 'md', label: 'Medium' },
              { value: 'lg', label: 'Large' },
              { value: 'xl', label: 'Extra Large' },
            ],
          },
          { name: 'body', type: 'text', label: 'Body Text', placeholder: 'Enter body text...' },
          {
            name: 'alignment',
            type: 'select',
            label: 'Alignment',
            options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }],
          },
        ],
      },
      {
        title: 'CTA & Spacing',
        icon: Settings,
        fields: [
          { name: 'ctaLabel', type: 'text', label: 'Button Label' },
          { name: 'ctaUrl', type: 'text', label: 'Button URL' },
          {
            name: 'ctaStyle',
            type: 'select',
            label: 'CTA Style',
            options: [{ value: 'button', label: 'Button' }, { value: 'link', label: 'Link' }],
          },
          { name: 'maxWidth', type: 'slider', label: 'Max Width (px)', min: 400, max: 1200, step: 50 },
          { name: 'paddingY', type: 'slider', label: 'Vertical Padding (px)', min: 16, max: 120, step: 8 },
        ],
      },
    ],
  },

  'features_grid': {
    sections: [
      {
        title: 'Grid',
        icon: LayoutGrid,
        fields: [
          { name: 'headline', type: 'text', label: 'Heading' },
          {
            name: 'columns',
            type: 'select',
            label: 'Columns',
            options: [{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }],
          },
          { name: 'gap', type: 'slider', label: 'Gap (px)', min: 8, max: 40, step: 4 },
        ],
      },
      {
        title: 'Features',
        icon: Settings,
        fields: [
          {
            name: 'features',
            type: 'array',
            label: 'Feature Items',
            itemSchema: {
              fields: [
                { name: 'icon', type: 'text', label: 'Icon (emoji or name)' },
                { name: 'title', type: 'text', label: 'Title' },
                { name: 'description', type: 'text', label: 'Description' },
              ],
            },
          },
          { name: 'iconSize', type: 'slider', label: 'Icon Size (px)', min: 24, max: 64, step: 4 },
          { name: 'iconColor', type: 'color', label: 'Icon Color' },
          { name: 'iconBackground', type: 'color', label: 'Icon Background' },
          {
            name: 'cardStyle',
            type: 'select',
            label: 'Card Style',
            options: [{ value: 'flat', label: 'Flat' }, { value: 'bordered', label: 'Bordered' }, { value: 'elevated', label: 'Elevated' }],
          },
        ],
      },
    ],
  },

  'image_block': {
    sections: [
      {
        title: 'Media',
        icon: Image,
        fields: [
          { name: 'src', type: 'image', label: 'Image' },
          { name: 'alt', type: 'text', label: 'Alt Text' },
          { name: 'caption', type: 'text', label: 'Caption' },
          { name: 'link', type: 'text', label: 'Link URL' },
        ],
      },
      {
        title: 'Sizing',
        icon: Settings,
        fields: [
          {
            name: 'width',
            type: 'select',
            label: 'Width',
            options: [
              { value: 'full', label: 'Full Width' },
              { value: 'contained', label: 'Contained' },
              { value: 'narrow', label: 'Narrow' },
            ],
          },
          { name: 'height', type: 'slider', label: 'Height (px)', min: 200, max: 800, step: 50 },
          {
            name: 'objectFit',
            type: 'select',
            label: 'Object Fit',
            options: [{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'fill', label: 'Fill' }],
          },
          { name: 'borderRadius', type: 'slider', label: 'Border Radius (px)', min: 0, max: 24, step: 4 },
        ],
      },
    ],
  },

  'faq_accordion': {
    sections: [
      {
        title: 'Content',
        icon: Plus,
        fields: [
          { name: 'title', type: 'text', label: 'Section Title' },
          {
            name: 'faqs',
            type: 'array',
            label: 'Questions',
            itemSchema: {
              fields: [
                { name: 'question', type: 'text', label: 'Question' },
                { name: 'answer', type: 'text', label: 'Answer' },
              ],
            },
          },
          { name: 'allowMultiple', type: 'toggle', label: 'Allow Multiple Open' },
        ],
      },
      {
        title: 'Style',
        icon: Settings,
        fields: [
          { name: 'defaultOpen', type: 'number', label: 'Default Open Index' },
          {
            name: 'iconStyle',
            type: 'select',
            label: 'Icon',
            options: [
              { value: 'plus-minus', label: '+ / −' },
              { value: 'chevron', label: 'Chevron' },
              { value: 'arrow', label: 'Arrow' },
            ],
          },
          {
            name: 'borderStyle',
            type: 'select',
            label: 'Border',
            options: [
              { value: 'full', label: 'Full' },
              { value: 'bottom-only', label: 'Bottom Only' },
              { value: 'none', label: 'None' },
            ],
          },
          { name: 'headingColor', type: 'color', label: 'Heading Color' },
          { name: 'accentColor', type: 'color', label: 'Accent Color' },
        ],
      },
    ],
  },

  'site_footer': {
    sections: [
      {
        title: 'Columns',
        icon: LayoutGrid,
        fields: [
          {
            name: 'columns',
            type: 'array',
            label: 'Footer Columns',
            itemSchema: {
              fields: [
                { name: 'heading', type: 'text', label: 'Column Heading' },
                {
                  name: 'links',
                  type: 'array',
                  label: 'Links',
                  itemSchema: {
                    fields: [
                      { name: 'label', type: 'text', label: 'Label' },
                      { name: 'url', type: 'text', label: 'URL' },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: 'maxColumns',
            type: 'select',
            label: 'Max Columns',
            options: [{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }],
          },
        ],
      },
      {
        title: 'Branding & Social',
        icon: Settings,
        fields: [
          { name: 'logoSrc', type: 'image', label: 'Logo' },
          { name: 'logoAlt', type: 'text', label: 'Logo Alt' },
          { name: 'tagline', type: 'text', label: 'Tagline' },
          {
            name: 'socialLinks',
            type: 'array',
            label: 'Social Links',
            itemSchema: {
              fields: [
                {
                  name: 'platform',
                  type: 'select',
                  label: 'Platform',
                  options: [
                    { value: 'instagram', label: 'Instagram' },
                    { value: 'twitter', label: 'Twitter' },
                    { value: 'facebook', label: 'Facebook' },
                    { value: 'youtube', label: 'YouTube' },
                    { value: 'tiktok', label: 'TikTok' },
                    { value: 'pinterest', label: 'Pinterest' },
                  ],
                },
                { name: 'url', type: 'text', label: 'URL' },
              ],
            },
          },
        ],
      },
      {
        title: 'Newsletter',
        icon: Sparkles,
        fields: [
          { name: 'showNewsletter', type: 'toggle', label: 'Show Newsletter' },
          { name: 'newsletterHeading', type: 'text', label: 'Heading', visibleIf: (p: any) => p.showNewsletter === true },
          { name: 'newsletterPlaceholder', type: 'text', label: 'Placeholder', visibleIf: (p: any) => p.showNewsletter === true },
          { name: 'newsletterButtonText', type: 'text', label: 'Button Text', visibleIf: (p: any) => p.showNewsletter === true },
          { name: 'copyrightText', type: 'text', label: 'Copyright Text' },
          { name: 'paddingY', type: 'slider', label: 'Vertical Padding (px)', min: 32, max: 120, step: 8 },
        ],
      },
      {
        title: 'Colors',
        icon: Settings,
        fields: [
          { name: 'backgroundColor', type: 'color', label: 'Background' },
          { name: 'textColor', type: 'color', label: 'Text Color' },
          { name: 'linkHoverColor', type: 'color', label: 'Link Hover' },
          { name: 'dividerColor', type: 'color', label: 'Divider' },
        ],
      },
    ],
  },

  'countdown_timer': {
    sections: [
      {
        title: 'Settings',
        icon: Settings,
        fields: [
          { name: 'endDate', type: 'text', label: 'End Date (ISO)', placeholder: '2026-12-31T23:59:59Z' },
          {
            name: 'style',
            type: 'select',
            label: 'Style',
            options: [
              { value: 'boxed', label: 'Boxed' },
              { value: 'minimal', label: 'Minimal' },
              { value: 'inline', label: 'Inline' },
            ],
          },
          { name: 'expiredText', type: 'text', label: 'Expired Message' },
          {
            name: 'expiredAction',
            type: 'select',
            label: 'On Expiry',
            options: [
              { value: 'hide', label: 'Hide Block' },
              { value: 'show-text', label: 'Show Text' },
              { value: 'redirect', label: 'Redirect' },
            ],
          },
          {
            name: 'redirectUrl',
            type: 'text',
            label: 'Redirect URL',
            visibleIf: (p: any) => p.expiredAction === 'redirect',
          },
        ],
      },
      {
        title: 'Labels',
        icon: Type,
        fields: [
          { name: 'labelDays', type: 'text', label: 'Days Label' },
          { name: 'labelHours', type: 'text', label: 'Hours Label' },
          { name: 'labelMinutes', type: 'text', label: 'Minutes Label' },
          { name: 'labelSeconds', type: 'text', label: 'Seconds Label' },
        ],
      },
      {
        title: 'Colors',
        icon: Settings,
        fields: [
          { name: 'digitColor', type: 'color', label: 'Digit Color' },
          { name: 'labelColor', type: 'color', label: 'Label Color' },
          { name: 'digitBackground', type: 'color', label: 'Digit Background' },
          { name: 'backgroundColor', type: 'color', label: 'Section Background' },
        ],
      },
    ],
  },

  'promo_strip': {
    sections: [
      {
        title: 'Content',
        icon: LayoutGrid,
        fields: [
          {
            name: 'items',
            type: 'array',
            label: 'Messages',
            itemSchema: {
              fields: [
                { name: 'text', type: 'text', label: 'Message Text' },
                { name: 'link', type: 'text', label: 'Link URL' },
              ],
            },
          },
          { name: 'rotationInterval', type: 'slider', label: 'Rotation Speed (ms)', min: 2000, max: 8000, step: 500 },
          {
            name: 'animationType',
            type: 'select',
            label: 'Animation',
            options: [
              { value: 'slide', label: 'Slide' },
              { value: 'fade', label: 'Fade' },
              { value: 'none', label: 'None' },
            ],
          },
        ],
      },
      {
        title: 'Style',
        icon: Settings,
        fields: [
          { name: 'height', type: 'slider', label: 'Height (px)', min: 36, max: 64, step: 4 },
          { name: 'backgroundColor', type: 'color', label: 'Background' },
          { name: 'textColor', type: 'color', label: 'Text Color' },
        ],
      },
    ],
  },
};