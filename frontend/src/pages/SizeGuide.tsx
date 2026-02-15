import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

export default function SizeGuide() {
    return (
        <div className="legal-page-luxury reveal">
            <div className="container">
                <div className="legal-header-lux">
                    <span className="eyebrow">MEASUREMENT PROTOCOLS</span>
                    <h1 className="subtitle-serif">Size Guide</h1>
                    <p className="description-small italic">Find your perfect artisanal fit</p>
                </div>

                <div className="legal-content-lux">
                    <section className="legal-section-lux">
                        <p className="legal-text-lux">
                            At Gold She Garments, each piece is handcrafted to ensure the highest standards of elegance. Please use the guide below to determine your ideal size within our atelier.
                        </p>

                        <div className="luxury-table-container">
                            <table className="luxury-table">
                                <thead>
                                    <tr>
                                        <th>SIZE</th>
                                        <th>BUST (INCHES)</th>
                                        <th>WAIST (INCHES)</th>
                                        <th>HIP (INCHES)</th>
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
                            <h2 className="section-title-serif">Exchanges & Fitting</h2>
                            <p className="legal-text-lux">
                                If your selection does not meet your fitting expectations, our concierge is available to assist with exchanges. We strive to ensure every client feels perfected in their GSG attire.
                            </p>
                            <div className="mt-12">
                                <Link to="/collection" className="btn-luxury-outline">
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
