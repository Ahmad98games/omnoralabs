/**
 * ðŸ› ï¸ OMNORA LABS | CHECKOUT MODULE
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Rendering Engine
 * "Precision is the foundation of industrial scale."
 * ---------------------------------------------------------
 */

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client, { trackEvent } from '../api/client'
import './Checkout.css'
import { useToast } from '../context/ToastContext'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { OmnoraLogger } from '../utils/OmnoraLogger'

/**
 * ENTITY_NODE: Represents a singular unit of inventory mapped to the current session.
 * We avoid generic names like 'CartItem' to maintain structural semantic integrity.
 */
interface EntityNode {
    id: string;
    name: string;
    price: number;
    image?: string;
    quantity: number;
}

export default function Checkout() {
    // SYSTEM STATE: Hydration and Integrity monitoring
    const [entities, setEntities] = useState<EntityNode[]>([])
    const [isCommitting, setIsCommitting] = useState(false)
    const [integrityFault, setIntegrityFault] = useState<string | null>(null)
    const [deploymentRecord, setDeploymentRecord] = useState<string | null>(null)
    
    // REGISTRY FLOW: Directional routing of the committal process
    const [registryNamespace, setRegistryNamespace] = useState<'local' | 'international'>('local')
    const [committalProtocol, setCommittalProtocol] = useState('cod')
    
    const { showToast } = useToast()
    const formRef = useScrollReveal()
    const summaryRef = useScrollReveal()

    const [manifest, setManifest] = useState(() => {
        // NOTE: Direct localStorage access here is intentional to bypass redundant context hydration delays. - Ahmad.
        const saved = localStorage.getItem('checkout_manifest')
        return saved ? JSON.parse(saved) : {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Pakistan',
            notes: ''
        }
    })

    const navigate = useNavigate()

    useEffect(() => {
        localStorage.setItem('checkout_manifest', JSON.stringify(manifest))
    }, [manifest])

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('cart') || '[]') as EntityNode[]
        setEntities(data)
        
        if (data.length === 0) {
            OmnoraLogger.warn("System detected empty entity staging. Redirecting to registry.")
            navigate('/cart')
        }
    }, [navigate])

    const subtotal = useMemo(() => entities.reduce((s, i) => s + i.price * i.quantity, 0), [entities])
    const tax = useMemo(() => subtotal * 0.05, [subtotal])
    const shipping = useMemo(() => manifest.country === 'Pakistan' ? 250 : 5000, [manifest.country])
    const total = subtotal + tax + shipping

    const handleSystemInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setManifest({ ...manifest, [e.target.name]: e.target.value })
    }

    /**
     * verifySystemIntegrity: Exhaustive validation of the current manifest prior to committal.
     */
    const verifySystemIntegrity = (): string | null => {
        const faults: string[] = []
        if (!manifest.firstName?.trim()) faults.push('Manifest record: First name required')
        if (!manifest.lastName?.trim()) faults.push('Manifest record: Last name required')

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!manifest.email?.trim()) {
            faults.push('Security node: Email required')
        } else if (!emailRegex.test(manifest.email)) {
            faults.push('Security node: Invalid signature format')
        }

        const phoneRegex = /^(\+92|0|92)[0-9]{10}$/
        if (!manifest.phone?.trim()) {
            faults.push('Communications: Phone number required')
        } else if (manifest.country === 'Pakistan' && !phoneRegex.test(manifest.phone.replace(/[\s-]/g, ''))) {
            faults.push('Communications: Invalid protocol format')
        }

        if (!manifest.address?.trim()) faults.push('Logistic node: Address required')
        if (!manifest.city?.trim()) faults.push('Logistic node: City required')

        if (manifest.country === 'International' && !manifest.postalCode?.trim()) {
            faults.push('Logistic node: Postal code required for global propagation')
        }

        return faults.length > 0 ? faults[0] : null
    }

    const [isSystemLocked, setIsSystemLocked] = useState(false)

    /**
     * dispatchSystemCommittal: Orchestrates the final transmission of the state to the Kernel.
     */
    const dispatchSystemCommittal = async (e: React.FormEvent) => {
        e.preventDefault()

        if (isSystemLocked || isCommitting) {
            OmnoraLogger.warn("Attempted concurrent committal detected. Intercepted and blocked.")
            return
        }
        
        setIsSystemLocked(true)
        setIntegrityFault(null)
        setDeploymentRecord(null)

        if (entities.length === 0) {
            setIntegrityFault('System Integrity Fault: No entities staged')
            setIsSystemLocked(false)
            return
        }

        const fault = verifySystemIntegrity()
        if (fault) {
            OmnoraLogger.error(`Integrity Fault during verification: ${fault}`)
            setIntegrityFault(fault)
            showToast(fault, 'error')
            setIsSystemLocked(false)
            return
        }

        setIsCommitting(true)
        OmnoraLogger.info("Initiating system committal sequence...")

        try {
            const payload = {
                customerInfo: {
                    name: `${manifest.firstName} ${manifest.lastName}`,
                    email: manifest.email,
                    phone: manifest.phone
                },
                shippingAddress: {
                    address: manifest.address,
                    city: manifest.city,
                    state: manifest.state,
                    postalCode: manifest.postalCode,
                    country: manifest.country
                },
                paymentMethod: committalProtocol,
                items: entities.map(i => ({
                    productId: i.id,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity
                })),
                totalAmount: total,
                notes: manifest.notes
            }

            const res = await client.post('/orders', payload)

            if (res.data?.success && res.data?.order) {
                const { _id, orderNumber } = res.data.order
                OmnoraLogger.info(`Kernel Acceptance: Order #${orderNumber} provisioned.`)

                navigate(`/order-confirmation/${_id}`, {
                    state: {
                        order: res.data.order,
                        source: 'checkout'
                    }
                })

                localStorage.removeItem('cart')
                window.dispatchEvent(new Event('cart-updated'))
            } else {
                const msg = res.data?.error || 'Kernel rejection: Operation aborted'
                OmnoraLogger.error(`Kernel Rejection: ${msg}`)
                setIntegrityFault(msg)
                showToast(msg, 'error')
                setIsSystemLocked(false)
            }
        } catch (fault_err: unknown) {
            OmnoraLogger.error("Critical committal failure", fault_err)
            const msg = 'Kernel integrity fault. Transmission retry recommended.'
            setIntegrityFault(msg)
            showToast(msg, 'error')
            setIsSystemLocked(false)
        } finally {
            setIsCommitting(false)
        }
    }

    const getProtocolLabel = () => {
        const protocols: Record<string, string> = {
            cod: 'Cash on Delivery',
            meezan: 'Meezan Bank Transfer',
            jazzcash: 'JazzCash',
            easypaisa: 'EasyPaisa',
            payoneer: 'Payoneer'
        }
        return protocols[committalProtocol] || committalProtocol
    }

    return (
        <div className="checkout-luxury">
            <header className="checkout-hero-mini">
                <div className="container">
                    <span className="eyebrow" style={{ fontFamily: 'var(--font-mono)' }}>NODE_HYDRATION: FINAL</span>
                    <h1 className="h1 subtitle-serif">Secure Committal</h1>
                    <p className="text-muted italic">Finalizing state transition via the Omnora Kernel</p>
                </div>
            </header>

            <div className="checkout-container">
                <div className="breadcrumbs">
                    <ul className="breadcrumbs-list">
                        <li className="breadcrumbs-item">
                            <Link to="/" className="breadcrumbs-link">Home</Link>
                        </li>
                        <li className="breadcrumbs-item">
                            <Link to="/cart" className="breadcrumbs-link">Entity Staging</Link>
                        </li>
                        <li className="breadcrumbs-item" style={{ fontFamily: 'var(--font-mono)' }}>Committal</li>
                    </ul>
                </div>

                <div className="checkout-content">
                    <div className="checkout-form-container reveal" ref={formRef}>
                        <form id="checkoutForm" onSubmit={dispatchSystemCommittal} noValidate>

                            <div className="form-section reveal delay-100">
                                <h2 className="form-section-title">Manifest: Identity</h2>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="firstName">First Name</label>
                                        <input
                                            id="firstName"
                                            name="firstName"
                                            value={manifest.firstName}
                                            onChange={handleSystemInputChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="lastName">Last Name</label>
                                        <input
                                            id="lastName"
                                            name="lastName"
                                            value={manifest.lastName}
                                            onChange={handleSystemInputChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Security: Email Signature</label>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={manifest.email}
                                        onChange={handleSystemInputChange}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone">Communication Pipeline</label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        value={manifest.phone}
                                        onChange={handleSystemInputChange}
                                        className="form-input"
                                        placeholder="+92 300 1234567"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-section reveal delay-200">
                                <h2 className="form-section-title">Manifest: Logistics</h2>
                                <div className="form-group">
                                    <label htmlFor="address">Staging Address</label>
                                    <input
                                        id="address"
                                        name="address"
                                        value={manifest.address}
                                        onChange={handleSystemInputChange}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="city">Target City</label>
                                        <input
                                            id="city"
                                            name="city"
                                            value={manifest.city}
                                            onChange={handleSystemInputChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="state">Province/State</label>
                                        <input
                                            id="state"
                                            name="state"
                                            value={manifest.state}
                                            onChange={handleSystemInputChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="postalCode">Routing Code</label>
                                        <input
                                            id="postalCode"
                                            name="postalCode"
                                            value={manifest.postalCode}
                                            onChange={handleSystemInputChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="country">Geopolitical Namespace</label>
                                        <select
                                            id="country"
                                            name="country"
                                            value={manifest.country}
                                            onChange={handleSystemInputChange}
                                            className="form-input"
                                            required
                                        >
                                            <option value="Pakistan">Pakistan</option>
                                            <option value="International">International</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="notes">System Parameters (Notes)</label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        value={manifest.notes}
                                        onChange={handleSystemInputChange}
                                        className="form-input"
                                        rows={3}
                                        placeholder="Add specific system parameters..."
                                    />
                                </div>
                            </div>

                            <div className="form-section reveal delay-300">
                                <h2 className="form-section-title">Committal Protocol</h2>

                                <div className="payment-tabs" role="tablist">
                                    <button
                                        id="tab-local"
                                        type="button"
                                        role="tab"
                                        aria-selected={registryNamespace === 'local' ? 'true' : 'false'}
                                        aria-controls="local-payment-panel"
                                        className={`payment-tab ${registryNamespace === 'local' ? 'active' : ''}`}
                                        onClick={() => setRegistryNamespace('local')}
                                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
                                    >
                                        PROTOCOL::DOMESTIC
                                    </button>
                                    <button
                                        id="tab-international"
                                        type="button"
                                        role="tab"
                                        aria-selected={registryNamespace === 'international' ? 'true' : 'false'}
                                        aria-controls="international-payment-panel"
                                        className={`payment-tab ${registryNamespace === 'international' ? 'active' : ''}`}
                                        onClick={() => setRegistryNamespace('international')}
                                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
                                    >
                                        PROTOCOL::GLOBAL
                                    </button>
                                </div>

                                {registryNamespace === 'local' ? (
                                    <div id="local-payment-panel" className="payment-options" role="tabpanel" aria-labelledby="tab-local">
                                        {[
                                            { value: 'cod', name: 'COD_PROTOCOL', desc: 'Settle upon physical node delivery' },
                                            { value: 'meezan', name: 'BANK_TRANSFER_MEEZAN', desc: 'Kernel-to-Kernel bank transfer' },
                                            { value: 'jazzcash', name: 'MOBILE_JAZZCASH', desc: 'Instant mobile credit settlement' },
                                            { value: 'easypaisa', name: 'MOBILE_EASYPAISA', desc: 'Instant mobile credit settlement' }
                                        ].map(protocol => (
                                            <div key={protocol.value} className="payment-option">
                                                <label>
                                                    <div className="payment-option-header">
                                                        <input
                                                            type="radio"
                                                            name="committalProtocol"
                                                            value={protocol.value}
                                                            checked={committalProtocol === protocol.value}
                                                            onChange={(e) => setCommittalProtocol(e.target.value)}
                                                        />
                                                        <span className="payment-option-name" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{protocol.name}</span>
                                                    </div>
                                                    <span className="payment-option-description">{protocol.desc}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div id="international-payment-panel" className="payment-options" role="tabpanel" aria-labelledby="tab-international">
                                        <div className="payment-option">
                                            <label>
                                                <div className="payment-option-header">
                                                    <input
                                                        type="radio"
                                                        name="committalProtocol"
                                                        value="payoneer"
                                                        checked={committalProtocol === 'payoneer'}
                                                        onChange={(e) => setCommittalProtocol(e.target.value)}
                                                    />
                                                    <span className="payment-option-name" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>PAYONEER_GLOBAL</span>
                                                </div>
                                                <span className="payment-option-description">Secure global settlement via Payoneer</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {committalProtocol !== 'cod' && (
                                    <div className="payment-details animate-fade-in">
                                        <h3>Technical Instructions</h3>
                                        <div className="bank-details bank-details-wrapper">
                                            <div className="secure-icon-large">ðŸ”’</div>
                                            <p className="payment-highlight-text">
                                                Active Protocol: <strong className="text-royal">{getProtocolLabel()}</strong>.
                                            </p>
                                            <p className="payment-instruction-text">
                                                Complete committal securely. Precise settlement identifiers (Account/IBAN) will be generated upon kernel acceptance.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {integrityFault && (
                                <div style={{ color: 'var(--error)', marginBottom: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }} role="alert">
                                    [INTEGRITY_FAULT]: {integrityFault}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSystemLocked || isCommitting}
                                className="place-order-btn"
                                aria-label={`Dispatch committal for ${(total || 0).toLocaleString()} Credits`}
                                style={{ 
                                    opacity: isSystemLocked ? 0.7 : 1, 
                                    transition: 'opacity 0.2s',
                                    fontFamily: 'var(--font-mono)',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                {isCommitting ? 'COMMITTING_TO_KERNEL...' : `DISPATCH_COMMITTAL Â· ${(total || 0).toLocaleString()} Credits`}
                            </button>
                        </form>
                    </div>

                    <div className="order-summary-container reveal delay-200" ref={summaryRef}>
                        <h2 className="form-section-title">Registry Overview</h2>
                        <div className="summary-items">
                            {entities.map(node => (
                                <div key={node.id} className="summary-item">
                                    <span>{node.name} <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.6 }}>[Ã—{node.quantity}]</span></span>
                                    <span style={{ fontFamily: 'var(--font-mono)' }}>{(node.price * node.quantity).toLocaleString()} CR</span>
                                </div>
                            ))}
                        </div>
                        <div className="summary-totals">
                            <div className="summary-row">
                                <span>NET_SUBTOTAL</span>
                                <span style={{ fontFamily: 'var(--font-mono)' }}>{(subtotal || 0).toLocaleString()} CR</span>
                            </div>
                            <div className="summary-row">
                                <span>TAX_AGGREGATE (5%)</span>
                                <span style={{ fontFamily: 'var(--font-mono)' }}>{Number(tax || 0).toFixed(0).toLocaleString()} CR</span>
                            </div>
                            <div className="summary-row">
                                <span>LOGISTIC_FEE</span>
                                <span style={{ fontFamily: 'var(--font-mono)' }}>{(shipping || 0).toLocaleString()} CR</span>
                            </div>
                            <div className="summary-total">
                                <span>TOTAL_COMMITTAL</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{Number(total || 0).toFixed(0).toLocaleString()} CR</span>
                            </div>
                        </div>

                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            background: 'rgba(27, 54, 93, 0.05)',
                            border: '1px solid rgba(27, 54, 93, 0.2)',
                            fontSize: '0.75rem',
                            color: '#475569',
                            fontFamily: 'var(--font-mono)'
                        }}>
                            <p style={{ margin: 0 }}>
                                <strong style={{ color: 'var(--royal-blue)' }}>PROTOCOL:</strong> {getProtocolLabel().toUpperCase()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
