import { 
  Type, LayoutGrid, Sparkles, Image, Video, Calendar, 
  Smartphone, Monitor, Grid, SortAsc, Star, CheckSquare, 
  Heart, Plus, Compass, Settings
} from 'lucide-react';

export interface PropField {
  name: string;
  type: 'text' | 'number' | 'slider' | 'toggle' | 'select' | 'image' | 'video' | 'color' | 'date';
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  category?: string;
  visibleIf?: (props: any) => boolean; // 🛡️ Conditional Visibility
  responsive?: boolean; // 🛡️ Supports split Desktop/Mobile configurations
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
  hero: {
    sections: [
      {
        title: "Background",
        icon: Image,
        fields: [
          { name: 'bgType', type: 'select', label: 'Type', options: [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }, { value: 'color', label: 'Solid Color' }] },
          { 
            name: 'bgImage', type: 'image', label: 'Background Image',
            visibleIf: (p) => p.bgType === 'image' || !p.bgType 
          },
          { 
            name: 'bgVideo', type: 'video', label: 'Video Asset',
            visibleIf: (p) => p.bgType === 'video' 
          },
          { name: 'overlayOpacity', type: 'slider', label: 'Overlay Opacity', min: 0, max: 100, step: 1, visibleIf: (p) => p.bgType === 'image' || p.bgType === 'video' },
          { name: 'bgOverlay', type: 'color', label: 'Overlay Color' }
        ]
      },
      {
        title: "Typography & Layout",
        icon: Type,
        fields: [
          { name: 'headline', type: 'text', label: 'Headline Text', placeholder: 'Enter headline...' },
          { name: 'subtitle', type: 'text', label: 'Subtitle Text' },
          { name: 'textAlign', type: 'select', label: 'Text Alignment', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] },
          { name: 'fontSize', type: 'slider', label: 'Font Size (em)', min: 1, max: 10, step: 0.5, responsive: true }
        ]
      }
    ]
  },

  // ─── PRODUCT GRID & COMMERCE ────────────────────────────────────────────────
  'product-grid': {
    sections: [
      {
        title: "Grid Layout",
        icon: LayoutGrid,
        fields: [
          { name: 'desktopColumns', type: 'slider', label: 'Desktop Columns', min: 2, max: 6, step: 1 },
          { name: 'mobileColumns', type: 'slider', label: 'Mobile Columns', min: 1, max: 2, step: 1 },
          { name: 'gridGap', type: 'slider', label: 'Grid Gap (px)', min: 0, max: 100, step: 4 }
        ]
      },
      {
        title: "Content & Rules",
        icon: Settings,
        fields: [
          { name: 'category', type: 'select', label: 'Category Filter', options: [{ value: 'all', label: 'All Products' }, { value: 'best-sellers', label: 'Best Sellers' }, { value: 'new', label: 'New Arrivals' }] },
          { name: 'sortBy', type: 'select', label: 'Sort By', options: [{ value: 'price-asc', label: 'Price: Low to High' }, { value: 'price-desc', label: 'Price: High to Low' }, { value: 'newest', label: 'Newest' }] },
          { name: 'limit', type: 'number', label: 'Product Limit', min: 4, max: 24 }
        ]
      },
      {
        title: "Card Styles",
        icon: Star,
        fields: [
          { name: 'showRatings', type: 'toggle', label: 'Show Star Ratings' },
          { name: 'quickAdd', type: 'toggle', label: 'Enable Quick Add to Cart' },
          { name: 'discountBadge', type: 'toggle', label: 'Show Discount Badges' }
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
          { name: 'position', type: 'select', label: 'PositionAnchor', options: [{ value: 'bottom-right', label: 'Bottom Right' }, { value: 'bottom-left', label: 'Bottom Left' }] }
        ]
      }
    ]
  },

  // ─── CONTENT & FOOTER ───────────────────────────────────────────────────────
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
  }
};
