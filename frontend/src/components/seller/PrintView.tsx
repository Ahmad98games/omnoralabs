import React from 'react';
import type { Order } from '../../platform/core/DatabaseTypes';
import './ThermalPrintStyles.css';

export const PrintView: React.FC<{ order: Order | null, storeName: string }> = ({ order, storeName }) => {
    if (!order) return null;

    return (
        <div id="thermal-print-view" className="hidden print:block text-black bg-white">
            <div className="text-center mb-4">
                <h2 className="font-bold text-xl uppercase mb-1">{storeName}</h2>
                <p className="text-sm border-b border-black pb-2 border-dashed">ORDER RECEIPT</p>
            </div>
            
            <div className="text-xs mb-4 space-y-1">
                <p><strong>Order ID:</strong> #{order.id.substring(0, 8).toUpperCase()}</p>
                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Customer:</strong> {order.customerName || 'Guest'}</p>
            </div>

            <div className="border-b border-black border-dashed mb-2" />
            
            <table className="w-full text-xs mb-3">
                <thead>
                    <tr className="border-b border-black">
                        <th className="text-left font-bold py-1">Item</th>
                        <th className="text-center font-bold py-1">Qty</th>
                        <th className="text-right font-bold py-1">Amt</th>
                    </tr>
                </thead>
                <tbody>
                    {order.lineItems.map((item: any, idx: number) => (
                        <tr key={idx}>
                            <td className="py-1 pr-2 truncate max-w-[40mm]">{item.title}</td>
                            <td className="text-center py-1">{item.quantity}</td>
                            <td className="text-right py-1">{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t border-black border-dashed pt-2 mb-4 space-y-1 text-sm text-right">
                <p className="font-bold uppercase flex justify-between">
                    <span>Grand Total:</span>
                    <span>Rs. {order.totalAmount.toFixed(2)}</span>
                </p>
            </div>

            <div className="text-center text-xs border-t border-black border-dashed pt-4">
                <p>Thank you for your purchase!</p>
                <p className="text-[10px] mt-1">Powered by Omnora OS</p>
            </div>
        </div>
    );
};
