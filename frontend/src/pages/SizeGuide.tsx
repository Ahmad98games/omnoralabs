import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

export default function SizeGuide() {
    return (
        <div className="legal-page-luxury reveal">
            <div className="container">
                <div className="legal-header-lux">
                    <span className="eyebrow">MEASUREMENT PROTOCOLS</span>
                    <h1 className="subtitle-serif">Entity Standards</h1>
                    <p className="description-small italic">System specifications for modular assets</p>
                </div>

                <div className="legal-content-lux">
                    <section className="legal-section-lux">
                        <p className="legal-text-lux">
                            Within the Omnora Kernel, each entity follows strict volumetric protocols to ensure seamless integration across multi-tenant environments.
                        </p>

                        <div className="luxury-table-container">
                            <table className="luxury-table">
                                <thead>
                                    <tr>
                                        <th>NODE LEVEL</th>
                                        <th>WIDTH (UNITS)</th>
                                        <th>CAPACITY (FLOPS)</th>
                                        <th>LATENCY (MS)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>ALPHA</td>
                                        <td>32.5</td>
                                        <td>25.5</td>
                                        <td>0.5</td>
                                    </tr>
                                    <tr>
                                        <td>BETA</td>
                                        <td>34.5</td>
                                        <td>27.5</td>
                                        <td>0.8</td>
                                    </tr>
                                    <tr>
                                        <td>GAMMA</td>
                                        <td>36.5</td>
                                        <td>29.5</td>
                                        <td>1.2</td>
                                    </tr>
                                    <tr>
                                        <td>DELTA</td>
                                        <td>39.0</td>
                                        <td>32.0</td>
                                        <td>1.5</td>
                                    </tr>
                                    <tr>
                                        <td>OMEGA</td>
                                        <td>42.0</td>
                                        <td>35.0</td>
                                        <td>2.0</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="legal-section-lux mt-12">
                            <h2 className="section-title-serif">System Synchronization</h2>
                            <p className="legal-text-lux">
                                If your entity configuration does not synchronize with the kernel, our engineering team is available for audit. We strive for zero-latency integration.
                            </p>
                            <div className="mt-12">
                                <Link to="/collection" className="btn-luxury-outline">
                                    Explore Catalog
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
