import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, HandPlatter, Package, Flower } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import Carousel from '../components/Carousel';
import './Home.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface CategoryCardProps {
  to: string;
  title: string;
  subtitle: string;
  backgroundClass: string;
}

interface IngredientCategoryProps {
  title: string;
  items: string[];
}

// ============================================================================
// CHILD COMPONENTS
// ============================================================================

const ValueCard: React.FC<ValueCardProps> = ({ icon, title, description }) => (
  <div className="value-card">
    <div className="value-card__icon">{icon}</div>
    <h3 className="value-card__title">{title}</h3>
    <p className="value-card__description">{description}</p>
  </div>
);

const CategoryCard: React.FC<CategoryCardProps> = ({ to, title, subtitle, backgroundClass }) => (
  <Link to={to} className="category-card">
    <div className="category-card__overlay" />
    <div className="category-card__background">
      <div className={`category-card__bg-image ${backgroundClass}`} />
    </div>
    <div className="category-card__content">
      <h3 className="category-card__title">{title}</h3>
      <span className="category-card__subtitle">{subtitle}</span>
    </div>
  </Link>
);

const IngredientCategory: React.FC<IngredientCategoryProps> = ({ title, items }) => (
  <div className="ingredient-card">
    <h3 className="ingredient-card__title">{title}</h3>
    <ul className="ingredient-card__list">
      {items.map((item, index) => (
        <li key={index} className="ingredient-card__item">
          <span className="ingredient-card__bullet">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Home() {
  const [email, setEmail] = useState<string>('');
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const { showToast } = useToast();

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    setIsSubscribing(true);

    try {
      await client.post('/newsletter/subscribe', { email });
      showToast('Successfully subscribed to the newsletter!', 'success');
      setEmail('');
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to subscribe. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero__background" />
        <div className="hero__content container">
          <span className="hero__badge">Handcrafted Luxury</span>
          <h1 className="hero__title">
            Experience the Art of <br /> Luxurious Self Care
          </h1>
          <p className="hero__subtitle">
            Discover handcrafted bath bombs made with organic essential oils to soothe your body 
            and elevate your daily ritual into a sanctuary.
          </p>
          <div className="hero__actions">
            <Link to="/collection" className="btn btn--primary">
              Shop Collections <ArrowRight size={20} />
            </Link>
            <Link to="/about" className="btn btn--secondary">
              Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="carousel-section container">
        <Carousel />
      </section>

      {/* Value Propositions */}
      <section className="values container">
        <div className="section-header">
          <h2 className="section-header__title">Why Choose Omnora?</h2>
        </div>
        <div className="values__grid">
          <ValueCard
            icon={<Flower size={32} />}
            title="Natural & Organic"
            description="Pure, plant-based botanicals, free from harsh chemicals."
          />
          <ValueCard
            icon={<HandPlatter size={32} />}
            title="Artisan Crafted"
            description="Lovingly made in small batches, ensuring consistent quality."
          />
          <ValueCard
            icon={<Package size={32} />}
            title="Secure Delivery"
            description="Free shipping on orders over $50. Discreetly packaged."
          />
          <ValueCard
            icon={<Sparkles size={32} />}
            title="Sensory Escape"
            description="Luxurious scents designed for deep relaxation."
          />
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories container">
        <div className="section-header section-header--flex">
          <h2 className="section-header__title">Find Your Sanctuary</h2>
          <Link to="/collection" className="section-header__link">
            View All Categories <ArrowRight size={16} />
          </Link>
        </div>
        <div className="categories__grid">
          <CategoryCard
            to="/collection?category=Relaxation"
            title="Unwind"
            subtitle="Lavender & Chamomile"
            backgroundClass="bg--unwind"
          />
          <CategoryCard
            to="/collection?category=Energy"
            title="Revitalize"
            subtitle="Citrus & Peppermint"
            backgroundClass="bg--energy"
          />
          <CategoryCard
            to="/collection?category=Skincare"
            title="Nourish"
            subtitle="Oatmeal & Shea Butter"
            backgroundClass="bg--nourish"
          />
        </div>
      </section>

      {/* Ingredients Section */}
      <section className="ingredients">
        <div className="container">
          <div className="section-header">
            <h2 className="section-header__title">Omnora Crafting Ingredients</h2>
            <p className="section-header__subtitle">
              We use a precise blend of high-quality ingredients to ensure the perfect fizz, 
              fragrance, and skin-softening effect.
            </p>
          </div>

          <div className="ingredients__grid">
            <IngredientCategory
              title="Base Ingredients"
              items={[
                "Baking Soda (Sodium Bicarbonate)",
                "Citric Acid (Fine Grain)",
                "Cornstarch",
                "Epsom Salt or Fine Sea Salt"
              ]}
            />
            <IngredientCategory
              title="Binders & Stabilizers"
              items={[
                "Sweet Almond Oil or Coconut Oil",
                "Polysorbate 80 (Stain Prevention)",
                "Witch Hazel (Moisture Control)"
              ]}
            />
            <IngredientCategory
              title="Color & Fragrance"
              items={[
                "Cosmetic-Grade Mica Powders",
                "Skin-safe Fragrance Oils",
                "Essential Oils"
              ]}
            />
            <IngredientCategory
              title="Luxury Additives"
              items={[
                "SLSA (Rich Foam)",
                "Kaolin Clay (Silkiness)",
                "Vitamin E Oil",
                "Dried Flower Petals"
              ]}
            />
          </div>

          <div className="ingredients__safety">
            <h4 className="ingredients__safety-title">Preservation & Safety Note</h4>
            <ul className="ingredients__safety-list">
              <li>
                <strong>Sanitation:</strong> Isopropyl Alcohol utilized for mold sanitization.
              </li>
              <li>
                <strong>Safety:</strong> Protective gear used during manufacturing.
              </li>
              <li>
                <strong>Longevity:</strong> Preservatives used responsibly where necessary.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter">
        <div className="container">
          <div className="newsletter__content">
            <h2 className="newsletter__title">Join the Omnora Sanctuary</h2>
            <p className="newsletter__description">
              Subscribe for exclusive scent previews, self-care tips, and 15% off your first order.
            </p>
            <form className="newsletter__form" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                className="newsletter__input"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubscribing}
              />
              <button 
                type="submit" 
                className="btn btn--primary newsletter__submit"
                disabled={isSubscribing}
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}