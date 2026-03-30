import React from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
}

interface RadixSelectProps {
    label?: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    icon?: React.ElementType;
    placeholder?: string;
}

export const RadixSelect: React.FC<RadixSelectProps> = ({
    label,
    value,
    options,
    onChange,
    icon: Icon,
    placeholder = "Select an option..."
}) => {
    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 font-mono">
                    {label}
                </label>
            )}
            <Select.Root value={value} onValueChange={onChange}>
                <Select.Trigger
                    className="w-full p-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm flex items-center justify-between hover:border-white/10 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 group"
                    aria-label={label}
                >
                    <div className="flex items-center gap-2">
                        {Icon && <Icon size={14} className="text-gray-400 group-hover:text-white transition-colors" />}
                        <Select.Value placeholder={placeholder}>
                            {options.find(o => o.value === value)?.label}
                        </Select.Value>
                    </div>
                    <Select.Icon className="text-gray-400 group-hover:text-white transition-colors">
                        <ChevronDown size={14} />
                    </Select.Icon>
                </Select.Trigger>

                <Select.Portal>
                    <Select.Content 
                        className="overflow-hidden bg-[#0A0A0F]/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in-0 zoom-in-95"
                        position="item-aligned"
                    >
                        <Select.Viewport className="p-1 max-h-48 overflow-y-auto custom-scrollbar">
                            {options.map((option) => (
                                <Select.Item
                                    key={option.value}
                                    value={option.value}
                                    className="flex items-center justify-between px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg cursor-pointer outline-none select-none transition-colors data-[state=checked]:text-indigo-400 data-[state=checked]:font-bold data-[state=checked]:bg-indigo-500/5"
                                >
                                    <Select.ItemText>{option.label}</Select.ItemText>
                                    <Select.ItemIndicator>
                                        <Check size={12} className="text-indigo-400" />
                                    </Select.ItemIndicator>
                                </Select.Item>
                            ))}
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
        </div>
    );
};
