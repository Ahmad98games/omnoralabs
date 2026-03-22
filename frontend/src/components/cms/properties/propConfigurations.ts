import { 
  Type, LayoutGrid, Sparkles, Image, Video, Calendar, 
  Smartphone, Monitor, Grid, SortAsc, Star, CheckSquare, 
  Heart, Plus, Compass, Settings, Shield // 🛡️ For Trust Badges
} from 'lucide-react';

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
  visibleIf?: (props: any) => boolean; // 🛡️ Conditional Visibility
  responsive?: boolean; // 🛡️ Supports split Desktop/Mobile configurations
  itemSchema?: { fields: PropField[] }; // 🛡️ Array Editor Nested Schema
}

export interface ComponentPropConfig {
  sections: {
    title: string;
    icon: any;
    fields: PropField[];
  }[];
}

export const PROP_CONFIGS: Record<string, ComponentPropConfig> = {
  // ─── HERO & BANNERS ──────────────────────────────────────────────────────────
  'hero_banner': {
    sections: [
      {
        title: "Background",
        icon: Image,
        fields: [
          { name: 'backgroundType', type: 'select', label: 'Background Type', options: [{ value: 'color', label: 'Solid Color' }, { value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }] },
          { name: 'bgColor', type: 'color', label: 'Background Color', visibleIf: (p) => p.backgroundType === 'color' },
          { name: 'imageSrc', type: 'image', label: 'Background Image', visibleIf: (p) => p.backgroundType === 'image' },
          { name: 'overlayOpacity', type: 'slider', label: 'Overlay Opacity (%)', min: 0, max: 80, step: 5, visibleIf: (p) => p.backgroundType === 'image' },
          { name: 'bgVideoUrl', type: 'video', label: 'Video Asset Support', placeholder: 'Paste video URL...', visibleIf: (p) => p.backgroundType === 'video' },
          { name: 'minHeight', type: 'slider', label: 'Section Min Height (px)', min: 200, max: 800, step: 20 }
        ]
      },
      {
        title: "Content & Actions",
        icon: Type,
        fields: [
          { name: 'headline', type: 'text', label: 'Headline', placeholder: 'Enter headline...' },
          { name: 'subheadline', type: 'text', label: 'Subheadline', placeholder: 'Enter subheadline...' },
          { name: 'textAlign', type: 'select', label: 'Alignment', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] },
          { name: 'textColor', type: 'color', label: 'Text Color' },
          { name: 'ctaLabel', type: 'text', label: 'CTA Button Label' },
          { name: 'ctaUrl', type: 'text', label: 'CTA Link/URL' },
          { name: 'buttonStyle', type: 'select', label: 'Button Style', options: [{ value: 'filled', label: 'Filled' }, { value: 'outline', label: 'Outline' }, { value: 'ghost', label: 'Ghost' }] },
          { name: 'buttonColor', type: 'color', label: 'Button Color' }
        ]
      }
    ]
  },

  'split_hero': {
    sections: [
      {
        title: "Grid Layout",
        icon: LayoutGrid,
        fields: [
          { name: 'imagePosition', type: 'select', label: 'Image Position', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
          { name: 'splitRatio', type: 'slider', label: 'Split Ratio (Left Column %)', min: 30, max: 70, step: 1 }
        ]
      },
      {
        title: "Image Styling",
        icon: Image,
        fields: [
          { name: 'imageSrc', type: 'image', label: 'Image Asset' },
          { name: 'imageObjectFit', type: 'select', label: 'Object Fit', options: [{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }] }
        ]
      }
    ]
  },

  // ─── PRODUCT GRID & COMMERCE ────────────────────────────────────────────────
  'product_grid': {
    sections: [
      {
        title: "Grid Layout",
        icon: LayoutGrid,
        fields: [
          { name: 'columns', type: 'select', label: 'Grid Columns', options: [{ value: '2', label: '2 Columns' }, { value: '3', label: '3 Columns' }, { value: '4', label: '4 Columns' }] },
          { name: 'gap', type: 'slider', label: 'Grid Gap (px)', min: 8, max: 40, step: 4 },
          { name: 'productSource', type: 'select', label: 'Data Source', options: [{ value: 'auto', label: 'Automatic (All)' }, { value: 'collection', label: 'By Collection' }, { value: 'bestsellers', label: 'Best Sellers' }, { value: 'manual', label: 'Manual/Specific' }] },
          { name: 'collectionId', type: 'text', label: 'Collection ID', placeholder: 'Enter ID', visibleIf: (p) => p.productSource === 'collection' },
          { name: 'productIds', type: 'text', label: 'Product IDs (Comma Separated)', placeholder: 'prod_1, prod_2', visibleIf: (p) => p.productSource === 'manual' }
        ]
      },
      {
        title: "Card Styles",
        icon: Settings,
        fields: [
          { name: 'cardStyle', type: 'select', label: 'Style Template', options: [{ value: 'minimal', label: 'Minimal (No Border)' }, { value: 'bordered', label: 'Bordered' }, { value: 'shadowed', label: 'Shadowed (Hover Rise)' }] },
          { name: 'imageAspectRatio', type: 'select', label: 'Image Frame', options: [{ value: 'square', label: 'Square (1:1)' }, { value: 'portrait', label: 'Portrait (3:4)' }, { value: 'landscape', label: 'Landscape (16:9)' }] },
          { name: 'showPrice', type: 'toggle', label: 'Display Price' },
          { name: 'showAddToCart', type: 'toggle', label: 'Enable ATC Button' },
          { name: 'showBadge', type: 'toggle', label: 'Show "New/Sale" Badges' }
        ]
      }
    ]
  },

  'featured_product': {
    sections: [
      {
        title: "Layout Configuration",
        icon: LayoutGrid,
        fields: [
          { name: 'productId', type: 'text', label: 'Target Product ID', placeholder: 'P-101...' },
          { name: 'layout', type: 'select', label: 'Template Direction', options: [{ value: 'media-left', label: 'Media Left' }, { value: 'media-right', label: 'Media Right' }, { value: 'media-top', label: 'Media Top' }] },
          { name: 'mediaSize', type: 'slider', label: 'Media Column Width %', min: 30, max: 70, step: 5 }
        ]
      },
      {
        title: "Display Toggles",
        icon: Sparkles,
        fields: [
          { name: 'showDescription', type: 'toggle', label: 'Show Description Text' },
          { name: 'showVariants', type: 'toggle', label: 'Show Variant Dropdowns' },
          { name: 'showReviews', type: 'toggle', label: 'Show Review Stars' }
        ]
      }
    ]
  },

  'best_sellers': {
    sections: [
      {
        title: "Collection Config",
        icon: Grid,
        fields: [
          { name: 'title', type: 'text', label: 'Section Heading', placeholder: 'Best Sellers' },
          { name: 'limit', type: 'slider', label: 'Product Limit', min: 2, max: 12, step: 1 },
          { name: 'columns', type: 'select', label: 'Grid Columns', options: [{ value: '2', label: '2 Columns' }, { value: '3', label: '3 Columns' }, { value: '4', label: '4 Columns' }] }
        ]
      },
      {
        title: "Shared Card Styles",
        icon: Settings,
        fields: [
          { name: 'cardStyle', type: 'select', label: 'Style Template', options: [{ value: 'minimal', label: 'Minimal' }, { value: 'bordered', label: 'Bordered' }, { value: 'shadowed', label: 'Shadowed' }] },
          { name: 'showPrice', type: 'toggle', label: 'Display Price' },
          { name: 'showAddToCart', type: 'toggle', label: 'Enable ATC Button' }
        ]
      }
    ]
  },

  'recently_viewed': {
    sections: [
      {
        title: "Recents Logic",
        icon: SortAsc,
        fields: [
          { name: 'title', type: 'text', label: 'Heading', placeholder: 'Recently Viewed' },
          { name: 'limit', type: 'slider', label: 'Max Items Count', min: 2, max: 12, step: 1 },
          { name: 'emptyStateText', type: 'text', label: 'Empty Text fallback', placeholder: 'No history found...' },
          { name: 'persistAcrossSessions', type: 'toggle', label: 'Persist Across Sessions (Persistent Storage)' }
        ]
      }
    ]
  },

  'store_header': {
    sections: [
      {
        title: "Branding & Logo",
        icon: LayoutGrid,
        fields: [
          { name: 'logoSrc', type: 'image', label: 'Upload Logo' },
          { name: 'logoHeight', type: 'slider', label: 'Logo Height (px)', min: 24, max: 80, step: 2 },
          { name: 'logoAlt', type: 'text', label: 'Alt Text' }
        ]
      },
      {
        title: "Navigation & Tools",
        icon: Settings,
        fields: [
          { name: 'showSearch', type: 'toggle', label: 'Show Search' },
          { name: 'showCart', type: 'toggle', label: 'Show Cart' },
          { name: 'showAccountIcon', type: 'toggle', label: 'Show Account Icon' },
          { name: 'sticky', type: 'toggle', label: 'Sticky Navigation' },
          { name: 'backgroundColor', type: 'color', label: 'Background Color' },
          { name: 'textColor', type: 'color', label: 'Text/Link Color' },
          { name: 'borderBottom', type: 'toggle', label: 'Bottom Border' },
          { name: 'mobileBreakpoint', type: 'select', label: 'Mobile Trigger', options: [{ value: 'sm', label: 'SM (<640px)' }, { value: 'md', label: 'MD (<768px)' }] },
          { name: 'hamburgerStyle', type: 'select', label: 'Hamburger Icon', options: [{ value: 'lines', label: 'Lines' }, { value: 'dots', label: 'Dots' }, { value: 'cross', label: 'Cross' }] }
        ]
      }
    ]
  },

  'announcement_bar': {
    sections: [
      {
        title: "Announcement Content",
        icon: Sparkles,
        fields: [
          { name: 'text', type: 'text', label: 'Bar Text', placeholder: 'Free Shipping over $50!' },
          { name: 'link', type: 'text', label: 'Link URL', placeholder: '/collections/all' },
          { name: 'scrolling', type: 'toggle', label: 'Enable Marquee Effect' },
          { name: 'dismissable', type: 'toggle', label: 'Allow Dismiss (Session)' }
        ]
      },
      {
        title: "Styling & Countdown",
        icon: Settings,
        fields: [
          { name: 'backgroundColor', type: 'color', label: 'Background Color' },
          { name: 'textColor', type: 'color', label: 'Text Color' },
          { name: 'showCountdown', type: 'toggle', label: 'Show Countdown' },
          { name: 'endDate', type: 'text', label: 'End Date (YYYY-MM-DD)', placeholder: '2026-12-31', visibleIf: (p) => p.showCountdown === true }
        ]
      }
    ]
  },

  'cart_drawer': {
    sections: [
      {
        title: "Drawer Settings",
        icon: LayoutGrid,
        fields: [
          { name: 'triggerIcon', type: 'select', label: 'Trigger Icon', options: [{ value: 'bag', label: 'Bag' }, { value: 'cart', label: 'Cart' }, { value: 'basket', label: 'Basket' }] },
          { name: 'drawerPosition', type: 'select', label: 'Slide Direction', options: [{ value: 'right', label: 'Right' }, { value: 'left', label: 'Left' }] },
          { name: 'showProductImages', type: 'toggle', label: 'Show Product Images' },
          { name: 'showQuantityControls', type: 'toggle', label: 'Show Quantity Controls' }
        ]
      },
      {
        title: "Upsell & Shipping",
        icon: Sparkles,
        fields: [
          { name: 'upsellEnabled', type: 'toggle', label: 'Enable Upsell' },
          { name: 'upsellTitle', type: 'text', label: 'Upsell Title', visibleIf: (p) => p.upsellEnabled === true },
          { name: 'showFreeShippingBar', type: 'toggle', label: 'Free Shipping Bar' },
          { name: 'freeShippingThreshold', type: 'number', label: 'Free Shipping Threshold ($)', visibleIf: (p) => p.showFreeShippingBar === true }
        ]
      },
      {
        title: "Checkout Button",
        icon: Settings,
        fields: [
          { name: 'checkoutButtonText', type: 'text', label: 'Button Text' },
          { name: 'checkoutButtonColor', type: 'color', label: 'Button Color' }
        ]
      }
    ]
  },

  'checkout_block': {
    sections: [
      {
        title: "Layout & Theme",
        icon: LayoutGrid,
        fields: [
          { name: 'layout', type: 'select', label: 'Layout', options: [{ value: 'single-page', label: 'Single Page' }, { value: 'multi-step', label: 'Multi-Step' }] },
          { name: 'primaryColor', type: 'color', label: 'Primary Color' },
          { name: 'termsUrl', type: 'text', label: 'Terms & Conditions URL', placeholder: '/terms' }
        ]
      },
      {
        title: "Options & Rules",
        icon: Settings,
        fields: [
          { name: 'showOrderSummary', type: 'toggle', label: 'Show Order Summary' },
          { name: 'showPromoCode', type: 'toggle', label: 'Show Promo Code' },
          { name: 'showExpressCheckout', type: 'toggle', label: 'Enable Express Checkout' },
          { name: 'requirePhone', type: 'toggle', label: 'Require Phone Number' }
        ]
      }
    ]
  },

  'upsell_widget': {
    sections: [
      {
        title: "Display Triggers",
        icon: Sparkles,
        fields: [
          { name: 'position', type: 'select', label: 'Placement', options: [{ value: 'pre-checkout', label: 'Pre-Checkout' }, { value: 'post-add-to-cart', label: 'Post-Add-to-Cart' }, { value: 'cart-page', label: 'Cart Page' }] },
          { name: 'displayStyle', type: 'select', label: 'Layout Style', options: [{ value: 'inline', label: 'Inline Box' }, { value: 'popup', label: 'Popup Center' }, { value: 'sticky-bar', label: 'Sticky Bottom Bar' }] }
        ]
      },
      {
        title: "Content & Discounts",
        icon: Settings,
        fields: [
          { name: 'title', type: 'text', label: 'Widget Title' },
          { name: 'maxProducts', type: 'number', label: 'Max Products (1-4)' },
          { name: 'discountPercent', type: 'number', label: 'Discount Percent (%)' },
          { name: 'backgroundColor', type: 'color', label: 'Background Color' }
        ]
      }
    ]
  },

  // ─── TRUST & AUTHORITY ──────────────────────────────────────────────────────
  'whatsapp-floating': {
    sections: [
      {
        title: "Widget Setup",
        icon: Sparkles,
        fields: [
          { name: 'phoneNumber', type: 'text', label: 'WhatsApp Number', placeholder: '+1...' },
          { name: 'welcomeMessage', type: 'text', label: 'Welcome Message' },
          { name: 'avatarImage', type: 'image', label: 'Avatar Image' }, 
          { name: 'position', type: 'select', label: 'PositionAnchor', options: [{ value: 'bottom-right', label: 'Bottom Right' }, { value: 'bottom-left', label: 'Bottom Left' }] }
        ]
      }
    ]
  },

  'faq-accordion': {
    sections: [
      {
        title: "Accordion Logic",
        icon: Plus,
        fields: [
          { name: 'allowMultiple', type: 'toggle', label: 'Allow Multiple Open' },
          { name: 'iconType', type: 'select', label: 'Icon Type', options: [{ value: 'plus-minus', label: '+ / -' }, { value: 'arrow', label: 'Arrow' }] }
        ]
      }
    ]
  },

  'trust-badges': {
    sections: [
      {
        title: "Badges Configuration",
        icon: Shield,
        fields: [
          { name: 'iconLibrary', type: 'select', label: 'Icon Library', options: [{ value: 'lucide', label: 'Lucide Icons' }, { value: 'feather', label: 'Feather Icons' }] },
          { name: 'layout', type: 'select', label: 'Layout style', options: [{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'Vertical List' }] }
        ]
      }
    ]
  },

  'trust_badges': {
    sections: [
      {
        title: "Layout",
        icon: LayoutGrid,
        fields: [
          { name: 'layout', type: 'select', label: 'Layout', options: [{ value: 'row', label: 'Row' }, { value: 'grid', label: 'Grid' }] },
          { name: 'badgeStyle', type: 'select', label: 'Style', options: [{ value: 'icon-text', label: 'Icon + Text' }, { value: 'icon-only', label: 'Icon Only' }, { value: 'text-only', label: 'Text Only' }] },
          { name: 'iconSize', type: 'number', label: 'Icon Size (px)' }
        ]
      },
      {
        title: "Content & Colors",
        icon: Settings,
        fields: [
          { name: 'badges', type: 'array', label: 'Badges', itemSchema: {
              fields: [
                { name: 'icon', type: 'select', label: 'Icon', options: [{ value: 'shield-check', label: 'Shield' }, { value: 'truck', label: 'Truck' }, { value: 'return-arrow', label: 'Returns' }, { value: 'lock', label: 'Lock' }, { value: 'star', label: 'Star' }, { value: 'clock', label: 'Clock' }, { value: 'phone', label: 'Phone' }] },
                { name: 'text', type: 'text', label: 'Title' },
                { name: 'subtext', type: 'text', label: 'Subtitle' }
              ]
          }},
          { name: 'iconColor', type: 'color', label: 'Icon Color' },
          { name: 'textColor', type: 'color', label: 'Text Color' },
          { name: 'backgroundColor', type: 'color', label: 'Background Color' }
        ]
      }
    ]
  },

  'customer_reviews': {
    sections: [
      {
        title: "Display",
        icon: LayoutGrid,
        fields: [
          { name: 'layout', type: 'select', label: 'Layout', options: [{ value: 'grid', label: 'Grid' }, { value: 'carousel', label: 'Carousel' }, { value: 'masonry', label: 'Masonry' }] },
          { name: 'columns', type: 'select', label: 'Columns', options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }] },
          { name: 'showStarSummary', type: 'toggle', label: 'Show Star Summary' },
          { name: 'showVerifiedBadge', type: 'toggle', label: 'Show Verified Badge' },
          { name: 'cardStyle', type: 'select', label: 'Card Style', options: [{ value: 'flat', label: 'Flat' }, { value: 'bordered', label: 'Bordered' }, { value: 'elevated', label: 'Elevated' }] }
        ]
      },
      {
        title: "Source & Content",
        icon: Settings,
        fields: [
          { name: 'source', type: 'select', label: 'Source', options: [{ value: 'manual', label: 'Manual' }, { value: 'judge.me', label: 'Judge.me' }, { value: 'loox', label: 'Loox' }, { value: 'yotpo', label: 'Yotpo' }] },
          { name: 'reviews', type: 'array', label: 'Reviews', visibleIf: (p: any) => p.source === 'manual', itemSchema: {
              fields: [
                { name: 'author', type: 'text', label: 'Author' },
                { name: 'rating', type: 'number', label: 'Rating (1-5)' },
                { name: 'content', type: 'text', label: 'Content' },
                { name: 'date', type: 'text', label: 'Date' },
                { name: 'avatar', type: 'image', label: 'Avatar' }
              ]
          }},
          { name: 'accentColor', type: 'color', label: 'Star Color' }
        ]
      }
    ]
  },

  'whatsapp_button': {
    sections: [
      {
        title: "Placement",
        icon: LayoutGrid,
        fields: [
          { name: 'position', type: 'select', label: 'Position', options: [{ value: 'bottom-right', label: 'Bottom Right' }, { value: 'bottom-left', label: 'Bottom Left' }, { value: 'inline', label: 'Inline' }] },
          { name: 'onlyShowOn', type: 'select', label: 'Show On', options: [{ value: 'all', label: 'All Devices' }, { value: 'mobile', label: 'Mobile Only' }, { value: 'desktop', label: 'Desktop Only' }] }
        ]
      },
      {
        title: "Content & Style",
        icon: Settings,
        fields: [
          { name: 'phoneNumber', type: 'text', label: 'Phone Number' },
          { name: 'defaultMessage', type: 'text', label: 'Default Message' },
          { name: 'buttonLabel', type: 'text', label: 'Button Label' },
          { name: 'showPulse', type: 'toggle', label: 'Show Pulse Animation' },
          { name: 'buttonColor', type: 'color', label: 'Button Color' }
        ]
      }
    ]
  },

  'policy_strip': {
    sections: [
      {
        title: "Settings",
        icon: Settings,
        fields: [
          { name: 'layout', type: 'select', label: 'Layout', options: [{ value: 'row', label: 'Row' }, { value: 'stacked', label: 'Stacked' }] },
          { name: 'separator', type: 'select', label: 'Separator', options: [{ value: 'divider', label: 'Divider' }, { value: 'dot', label: 'Dot' }, { value: 'none', label: 'None' }] },
          { name: 'fontSize', type: 'select', label: 'Font Size', options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }] },
          { name: 'policies', type: 'array', label: 'Policies', itemSchema: {
              fields: [
                { name: 'label', type: 'text', label: 'Label' },
                { name: 'icon', type: 'select', label: 'Icon', options: [{ value: 'shield-check', label: 'Shield' }, { value: 'truck', label: 'Truck' }, { value: 'return-arrow', label: 'Returns' }, { value: 'lock', label: 'Lock' }] },
                { name: 'linkUrl', type: 'text', label: 'Link URL' }
              ]
          }}
        ]
      }
    ]
  },

  'text_section': {
    sections: [
      {
        title: "Content",
        icon: Type,
        fields: [
          { name: 'heading', type: 'text', label: 'Heading', placeholder: 'Enter heading...' },
          { name: 'headingSize', type: 'select', label: 'Heading Size', options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }, { value: 'xl', label: 'Extra Large' }] },
          { name: 'body', type: 'text', label: 'Body Text', placeholder: 'Enter rich text...' },
          { name: 'alignment', type: 'select', label: 'Alignment', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] }
        ]
      },
      {
        title: "Action & Multipliers",
        icon: Settings,
        fields: [
          { name: 'ctaLabel', type: 'text', label: 'CTA Label' },
          { name: 'ctaUrl', type: 'text', label: 'CTA URL' },
          { name: 'ctaStyle', type: 'select', label: 'CTA Style', options: [{ value: 'button', label: 'Button' }, { value: 'link', label: 'Link' }] },
          { name: 'maxWidth', type: 'slider', label: 'Max Width (px)', min: 400, max: 1200, step: 50 },
          { name: 'paddingY', type: 'slider', label: 'Vertical Padding (px)', min: 16, max: 120, step: 8 }
        ]
      }
    ]
  },

  'features_grid': {
    sections: [
      {
        title: "Grid Layout",
        icon: LayoutGrid,
        fields: [
          { name: 'headline', type: 'text', label: 'Headline' },
          { name: 'columns', type: 'select', label: 'Columns', options: [{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }] },
          { name: 'gap', type: 'slider', label: 'Gap (px)', min: 8, max: 40, step: 4 }
        ]
      },
      {
        title: "Features & Styles",
        icon: Settings,
        fields: [
          { name: 'features', type: 'array', label: 'Features', itemSchema: {
              fields: [
                { name: 'icon', type: 'text', label: 'Icon (Emoji or SVG)' },
                { name: 'title', type: 'text', label: 'Title' },
                { name: 'description', type: 'text', label: 'Description' }
              ]
          }},
          { name: 'iconSize', type: 'slider', label: 'Icon Size (px)', min: 24, max: 64, step: 4 },
          { name: 'iconColor', type: 'color', label: 'Icon Color' },
          { name: 'iconBackground', type: 'color', label: 'Icon Background' },
          { name: 'cardStyle', type: 'select', label: 'Card Style', options: [{ value: 'flat', label: 'Flat' }, { value: 'bordered', label: 'Bordered' }, { value: 'elevated', label: 'Elevated' }] }
        ]
      }
    ]
  },

  'image_block': {
    sections: [
      {
        title: "Media setting",
        icon: Image,
        fields: [
          { name: 'src', type: 'image', label: 'Source' },
          { name: 'alt', type: 'text', label: 'Alt Text' },
          { name: 'caption', type: 'text', label: 'Caption' },
          { name: 'link', type: 'text', label: 'Link URL' }
        ]
      },
      {
        title: "Styling layout",
        icon: Settings,
        fields: [
          { name: 'width', type: 'select', label: 'Width', options: [{ value: 'full', label: 'Full' }, { value: 'contained', label: 'Contained' }, { value: 'narrow', label: 'Narrow' }] },
          { name: 'height', type: 'slider', label: 'Height (px)', min: 200, max: 800, step: 50 },
          { name: 'objectFit', type: 'select', label: 'Object Fit', options: [{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'fill', label: 'Fill' }] },
          { name: 'borderRadius', type: 'slider', label: 'Border Radius (px)', min: 0, max: 24, step: 4 }
        ]
      }
    ]
  },

  'faq_accordion': {
    sections: [
      {
        title: "Accordion layout",
        icon: LayoutGrid,
        fields: [
          { name: 'title', type: 'text', label: 'Title' },
          { name: 'faqs', type: 'array', label: 'FAQs', itemSchema: {
              fields: [
                { name: 'question', type: 'text', label: 'Question' },
                { name: 'answer', type: 'text', label: 'Answer' }
              ]
          }},
          { name: 'allowMultiple', type: 'toggle', label: 'Allow Multiple Open' }
        ]
      },
      {
        title: "Styling settings",
        icon: Settings,
        fields: [
          { name: 'defaultOpen', type: 'number', label: 'Default Open Index (-1 for none)' },
          { name: 'iconStyle', type: 'select', label: 'Icon Style', options: [{ value: 'plus-minus', label: 'Plus/Minus' }, { value: 'chevron', label: 'Chevron' }, { value: 'arrow', label: 'Arrow' }] },
          { name: 'borderStyle', type: 'select', label: 'Border Style', options: [{ value: 'full', label: 'Full' }, { value: 'bottom-only', label: 'Bottom Only' }, { value: 'none', label: 'None' }] },
          { name: 'headingColor', type: 'color', label: 'Heading Color' },
          { name: 'accentColor', type: 'color', label: 'Accent Color' }
        ]
      }
    ]
  },

  'site_footer': {
    sections: [
      {
        title: "Layout & Branding",
        icon: LayoutGrid,
        fields: [
          { name: 'columns', type: 'array', label: 'Columns', itemSchema: {
              fields: [
                { name: 'heading', type: 'text', label: 'Heading' },
                { name: 'links', type: 'array', label: 'Links', itemSchema: {
                    fields: [
                      { name: 'label', type: 'text', label: 'Label' },
                      { name: 'url', type: 'text', label: 'URL' }
                    ]
                }}
              ]
          }},
          { name: 'maxColumns', type: 'select', label: 'Max Columns', options: [{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }] },
          { name: 'logoSrc', type: 'image', label: 'Logo' },
          { name: 'logoAlt', type: 'text', label: 'Logo Alt Text' },
          { name: 'tagline', type: 'text', label: 'Tagline' },
          { name: 'socialLinks', type: 'array', label: 'Social Links', itemSchema: {
              fields: [
                { name: 'platform', type: 'select', label: 'Platform', options: [
                  { value: 'instagram', label: 'Instagram' },
                  { value: 'twitter', label: 'Twitter' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'youtube', label: 'YouTube' },
                  { value: 'pinterest', label: 'Pinterest' },
                  { value: 'tiktok', label: 'TikTok' }
                ]},
                { name: 'url', type: 'text', label: 'URL' }
              ]
          }}
        ]
      },
      {
        title: "Newsletter & Bottom Bar",
        icon: Settings,
        fields: [
          { name: 'showNewsletter', type: 'toggle', label: 'Show Newsletter' },
          { name: 'newsletterHeading', type: 'text', label: 'Newsletter Heading', visibleIf: (p: any) => p.showNewsletter === true },
          { name: 'newsletterPlaceholder', type: 'text', label: 'Placeholder', visibleIf: (p: any) => p.showNewsletter === true },
          { name: 'newsletterButtonText', type: 'text', label: 'Button Text', visibleIf: (p: any) => p.showNewsletter === true },
          { name: 'copyrightText', type: 'text', label: 'Copyright Text' },
          { name: 'paddingY', type: 'slider', label: 'Vertical Padding (px)', min: 32, max: 120, step: 8 }
        ]
      },
      {
        title: "Colors",
        icon: Settings,
        fields: [
          { name: 'backgroundColor', type: 'color', label: 'Background Color' },
          { name: 'textColor', type: 'color', label: 'Text Color' },
          { name: 'linkHoverColor', type: 'color', label: 'Link Hover Color' },
          { name: 'dividerColor', type: 'color', label: 'Divider Color' }
        ]
      }
    ]
  },

  'countdown_timer': {
    sections: [
      {
        title: "Settings",
        icon: Settings,
        fields: [
          { name: 'endDate', type: 'text', label: 'End Date (ISO timestamp)' },
          { name: 'style', type: 'select', label: 'Style', options: [{ value: 'boxed', label: 'Boxed' }, { value: 'inline', label: 'Inline' }, { value: 'minimal', label: 'Minimal' }] },
          { name: 'expiredText', type: 'text', label: 'Expired Text' },
          { name: 'expiredAction', type: 'select', label: 'Expired Action', options: [{ value: 'hide', label: 'Hide' }, { value: 'show-text', label: 'Show Text' }, { value: 'redirect', label: 'Redirect' }] },
          { name: 'redirectUrl', type: 'text', label: 'Redirect URL', visibleIf: (p: any) => p.expiredAction === 'redirect' }
        ]
      },
      {
        title: "Labels (i18n)",
        icon: LayoutGrid,
        fields: [
          { name: 'labelDays', type: 'text', label: 'Days Label' },
          { name: 'labelHours', type: 'text', label: 'Hours Label' },
          { name: 'labelMinutes', type: 'text', label: 'Minutes Label' },
          { name: 'labelSeconds', type: 'text', label: 'Seconds Label' }
        ]
      },
      {
        title: "Colors",
        icon: Settings,
        fields: [
          { name: 'digitColor', type: 'color', label: 'Digit Color' },
          { name: 'labelColor', type: 'color', label: 'Label Color' },
          { name: 'digitBackground', type: 'color', label: 'Digit Background' },
          { name: 'backgroundColor', type: 'color', label: 'Background Color' }
        ]
      }
    ]
  },

  'promo_strip': {
    sections: [
      {
        title: "Content",
        icon: LayoutGrid,
        fields: [
          { name: 'items', type: 'array', label: 'Items', itemSchema: {
              fields: [
                { name: 'text', type: 'text', label: 'Text' },
                { name: 'link', type: 'text', label: 'Link URL' }
              ]
          }},
          { name: 'rotationInterval', type: 'slider', label: 'Rotation Interval (ms)', min: 2000, max: 8000, step: 500 },
          { name: 'animationType', type: 'select', label: 'Animation Type', options: [{ value: 'slide', label: 'Slide' }, { value: 'fade', label: 'Fade' }, { value: 'none', label: 'None' }] }
        ]
      },
      {
        title: "Styling",
        icon: Settings,
        fields: [
          { name: 'height', type: 'slider', label: 'Height (px)', min: 36, max: 64, step: 4 },
          { name: 'backgroundColor', type: 'color', label: 'Background Color' },
          { name: 'textColor', type: 'color', label: 'Text Color' }
        ]
      }
    ]
  }
};
