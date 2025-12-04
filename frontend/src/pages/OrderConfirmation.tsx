import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'
import './Checkout.css' // Reuse checkout styles for consistency

export default function OrderConfirmation() {
    const { id } = useParams()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [file, setFile] = useState<File | null>(null)
    const [message, setMessage] = useState('')
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        let interval: NodeJS.Timeout;

        const fetchOrder = async () => {
            try {
                const res = await client.get(`/orders/${id}`)
                if (res.data.success) {
                    const updatedOrder = res.data.order;
                    setOrder(updatedOrder)

                    // Stop polling if order is in a final state
                    const finalStates = ['approved', 'processing', 'shipped', 'delivered', 'cancelled'];
                    if (finalStates.includes(updatedOrder.status) || updatedOrder.isApproved) {
                        clearInterval(interval);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch order', error)
            } finally {
                setLoading(false)
            }
        }

        fetchOrder()

        // Poll every 5 seconds
        interval = setInterval(fetchOrder, 5000)
        return () => clearInterval(interval)
    }, [id])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setMessage('') // Clear previous errors
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setUploading(true) // Lock button immediately
        const formData = new FormData()
        formData.append('receipt', file)

        try {
            const res = await client.post(`/orders/${id}/receipt`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            if (res.data.success) {
                setMessage('Receipt sent. Please Wait for Approval.')
                setOrder({ ...order, status: 'receipt_submitted', paymentProof: res.data.paymentProof })
                setFile(null) // Clear file input
            }
        } catch (error: any) {
            console.error('Upload failed', error)
            setMessage(error.response?.data?.error || 'Failed to upload receipt. Please try again.')
            setUploading(false) // Unlock button on error
        }
    }

    return (
        <div className="checkout-container">
            <div className="checkout-card">
                <h1 className="checkout-title">Order Confirmation</h1>
                {loading ? (
                    <p>Loading order details...</p>
                ) : order ? (
                    <div className="order-details">
                        <p><strong>Order ID:</strong> {order._id}</p>
                        <p><strong>Status:</strong> {order.status}</p>
                        <p><strong>Total Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
                        {order.paymentMethod === 'bank_transfer' && !order.isApproved && (
                            <div className="payment-upload-section">
                                <h3>Upload Payment Receipt</h3>
                                {order.paymentProof && (
                                    <p>Current Receipt: <a href={order.paymentProof} target="_blank" rel="noopener noreferrer">View</a></p>
                                )}
                                <form onSubmit={handleUpload}>
                                    <input type="file" onChange={handleFileChange} accept="image/*,application/pdf" />
                                    <button type="submit" disabled={!file || uploading} className="luxury-button">
                                        {uploading ? 'Uploading...' : 'Upload Receipt'}
                                    </button>
                                </form>
                                {message && <p className="message">{message}</p>}
                            </div>
                        )}
                        {order.isApproved && <p className="success-message">Your order has been approved!</p>}
                        {order.items && order.items.length > 0 && (
                            <div className="order-items">
                                <h3>Items:</h3>
                                <ul>
                                    {order.items.map((item: any) => (
                                        <li key={item._id}>
                                            {item.product.name} x {item.quantity} - ${item.price.toFixed(2)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <p>Order not found.</p>
                )}

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <Link to="/" className="luxury-button" style={{ display: 'inline-block', textDecoration: 'none' }}>Continue Shopping</Link>
                </div>
            </div>
        </div>
    )
}
