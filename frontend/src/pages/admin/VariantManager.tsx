import React, { useState } from 'react';
import { VariantOption, ProductVariant, generateVariantMatrix, mergeVariantMatrix } from '../../utils/VariantMatrixEngine';

export const VariantManager: React.FC = () => {
    const [options, setOptions] = useState<VariantOption[]>([]);
    const [variants, setVariants] = useState<ProductVariant[]>([]);

    const addOption = () => {
        setOptions([...options, { name: '', values: [] }]);
    };

    const updateOptionName = (idx: number, name: string) => {
        const newOpts = [...options];
        newOpts[idx].name = name;
        setOptions(newOpts);
    };

    const addOptionValue = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
            const newOpts = [...options];
            if (!newOpts[idx].values.includes(e.currentTarget.value.trim())) {
                newOpts[idx].values.push(e.currentTarget.value.trim());
                setOptions(newOpts);
            }
            e.currentTarget.value = '';
        }
    };

    const generateAndMerge = () => {
        const newMatrix = generateVariantMatrix(options);
        const merged = mergeVariantMatrix(variants, newMatrix);
        setVariants(merged);
    };

    const updateVariant = (id: string, field: keyof ProductVariant, value: string | number | null) => {
        setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    return (
        <div className="bg-[#18181b] p-6 rounded-xl border border-gray-800 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Variant Manager</h2>
                <button onClick={addOption} className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded text-white transition-colors">
                    + Add Option
                </button>
            </div>

            {/* Options Builder */}
            <div className="space-y-4">
                {options.map((opt, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">Option Name (e.g. Size)</label>
                            <input 
                                type="text"
                                value={opt.name}
                                onChange={(e) => updateOptionName(idx, e.target.value)}
                                className="w-full bg-[#111] border border-gray-700 rounded p-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex-[2]">
                            <label className="text-xs text-gray-500 mb-1 block">Values (Press Enter to add)</label>
                            <div className="flex flex-wrap gap-2 items-center bg-[#111] border border-gray-700 rounded p-2 min-h-[38px]">
                                {opt.values.map((v, i) => (
                                    <span key={i} className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded">
                                        {v}
                                    </span>
                                ))}
                                <input 
                                    type="text"
                                    onKeyDown={(e) => addOptionValue(idx, e)}
                                    placeholder="Add value..."
                                    className="bg-transparent text-white text-sm outline-none flex-1 min-w-[100px]"
                                />
                            </div>
                        </div>
                    </div>
                ))}
                
                {options.length > 0 && (
                    <button onClick={generateAndMerge} className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
                        Generate Variant Matrix
                    </button>
                )}
            </div>

            {/* Matrix Editor */}
            {variants.length > 0 && (
                <div className="overflow-x-auto border border-gray-800 rounded-lg">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-gray-900 text-xs">
                            <tr>
                                <th className="px-4 py-3">Variant Name</th>
                                <th className="px-4 py-3">Price Override</th>
                                <th className="px-4 py-3">Stock Limit</th>
                                <th className="px-4 py-3">SKU</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variants.map(v => (
                                <tr key={v.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                    <td className="px-4 py-3 text-white font-medium">{v.name}</td>
                                    <td className="px-4 py-3">
                                        <input 
                                            type="number" 
                                            value={v.price_override || ''}
                                            onChange={(e) => updateVariant(v.id, 'price_override', parseFloat(e.target.value) || null)}
                                            placeholder="Base Price"
                                            className="w-24 bg-[#111] border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-indigo-500 focus:outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input 
                                            type="number" 
                                            value={v.stock}
                                            onChange={(e) => updateVariant(v.id, 'stock', parseInt(e.target.value) || 0)}
                                            className="w-20 bg-[#111] border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-indigo-500 focus:outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{v.sku}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
