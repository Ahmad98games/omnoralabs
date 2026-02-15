import { Link } from 'react-router-dom';
import { Home, ShoppingBag } from 'lucide-react';
import './NotFound.css';

export default function NotFound() {
    return (
        <div className="not-found-luxury reveal">
            <div className="container">
                <div className="not-found-content">
                    <h1 className="error-code-lux font-serif">404</h1>
                    <span className="eyebrow">LOST IN THE ARCHIVE</span>
                    <h2 className="subtitle-serif">Piece Not Found</h2>
                    <p className="description-small italic mt-4 mb-8">
                        The selection you are seeking cannot be located within our current collection. <br />
                        It may have been moved to the private archives or retired.
                    </p>

                    <div className="not-found-actions">
                        <Link to="/" className="btn-luxury-action">
                            <Home size={16} /> RETURN TO ATELIER
                        </Link>
                        <Link to="/collection" className="btn-luxury-outline">
                            <ShoppingBag size={16} /> EXPLORE COLLECTION
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
