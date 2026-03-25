import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

export default function SizeGuide() {
    return (
        <div className="legal-page-luxury reveal">
            <div className="container">
                <div className="legal-header-lux">
                    <span className="eyebrow">MEASUREMENT PROTOCOLS</span>
                    <h1 className="subtitle-serif">Asset Specifications</h1>
                    <p className="description-small italic">Determine the ideal node configuration</p>
                </div>

                <div className="legal-content-lux">
                    <section className="legal-section-lux">
                        <p className="legal-text-lux">
                            At Omnora Labs, each asset is engineered to ensure the highest standards of system integrity. Please use the guide below to determine your ideal node configuration within our registry.
                        </p>

                        <div className="luxury-table-container">
                            <table className="luxury-table">
                                <thead>
                                    <tr>
                                        <th>NODE TYPE</th>
                                        <th>COMPUTE (CORE)</th>
                                        <th>MEMORY (GB)</th>
                                        <th>LATENCY (MS)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>XS</td>
                                        <td>32.5</td>
                                        <td>25.5</td>
                                        <td>35.5</td>
                                    </tr>
                                    <tr>
                                        <td>S</td>
                                        <td>34.5</td>
                                        <td>27.5</td>
                                        <td>37.5</td>
                                    </tr>
                                    <tr>
                                        <td>M</td>
                                        <td>36.5</td>
                                        <td>29.5</td>
                                        <td>39.5</td>
                                    </tr>
                                    <tr>
                                        <td>L</td>
                                        <td>39.0</td>
                                        <td>32.0</td>
                                        <td>42.0</td>
                                    </tr>
                                    <tr>
                                        <td>XL</td>
                                        <td>42.0</td>
                                        <td>35.0</td>
                                        <td>45.0</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="legal-section-lux mt-12">
                            <h2 className="section-title-serif">Modifications & Scaling</h2>
                            <p className="legal-text-lux">
                                If your selection does not meet your operational expectations, our technical support is available to assist with re-configurations. We strive to ensure every builder feels perfected in their Omnora environment.
                            </p>
                            <div className="mt-12">
                                <Link to="/collection" className="btn-luxury-outline">
                                    Continue Deploying
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
