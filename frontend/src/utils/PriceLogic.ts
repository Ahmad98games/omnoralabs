import { useState } from 'react';
import { ProductVariant } from './VariantMatrixEngine';

export const useProductVariants = (basePrice: number, variants: ProductVariant[] = []) => {
    // Automatically select the first available variant if none is selected
    const initialVariant = variants.length > 0 ? variants[0].id : null;
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(initialVariant);

    const activeVariant = variants?.find(v => v.id === selectedVariantId) || null;

    // Dynamic Pricing & Stock logic
    const displayPrice = activeVariant?.price_override !== null && activeVariant?.price_override !== undefined 
        ? activeVariant.price_override 
        : basePrice;
        
    const isOutOfStock = activeVariant ? activeVariant.stock <= 0 : false;

    const handleSelectVariant = (id: string) => {
        setSelectedVariantId(id);
    };

    return {
        activeVariant,
        displayPrice,
        isOutOfStock,
        selectedVariantId,
        handleSelectVariant
    };
};
