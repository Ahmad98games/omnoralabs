import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, HandPlatter, Package, Flower, MessageSquare } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import Carousel from '../components/Carousel';
import PosterGallery from '../components/PosterGallery';
import heroVideo from '../components/home/hero_video.mp4';

// Assets
import bakingSodaImg from '../assets/ingredients/baking_soda.png';
import citricAcidImg from '../assets/ingredients/citric_acid.png';
import epsomSaltImg from '../assets/ingredients/epsom_salt.png';
import polysorbateImg from '../assets/ingredients/polysorbate_80.png';
import foodColorImg from '../assets/ingredients/food_color.png';
import coconutOilImg from '../assets/ingredients/coconut_oil.png';
import roseImg from '../assets/ingredients/rose.jpg';

import './OmnoraFinal.css';

// --- TYPES ---
interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface CategoryCardProps {
  to: string;
  title: string;
  subtitle: string;
  bgImage: string; // Changed to direct image URL for flexibility
}

interface IngredientCardProps {
  image: string;
  name: string;
  description?: string;
}

// --- SUB-COMPONENTS ---
const ValueCard: React.FC<ValueCardProps> = ({ icon, title, description }) => (
  <div className="value-card-magnum">
    <div className="vc-icon">{icon}</div>
    <h3 className="vc-title">{title}</h3>
    <p className="vc-desc">{description}</p>
  </div>
);

const CategoryCard: React.FC<CategoryCardProps> = ({ to, title, subtitle, bgImage }) => (
  <Link to={to} className="cat-card-magnum">
    <div className="cat-bg">
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }} 
      />
    </div>
    <div className="cat-content">
      <h3 className="cat-title">{title}</h3>
      <span className="cat-sub">{subtitle}</span>
    </div>
  </Link>
);

const IngredientCard: React.FC<IngredientCardProps> = ({ image, name, description }) => (
  <div className="ing-card-visual">
    <div className="ing-img-container">
      <img src={image} alt={name} loading="lazy" />
    </div>
    <h3 className="ing-name">{name}</h3>
    {description && <p className="ing-desc">{description}</p>}
  </div>
);

// --- MAIN COMPONENT ---
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
      showToast('Welcome to the inner circle.', 'success');
      setEmail('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Subscription failed.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="home-magnum">
      <div className="noise-layer" />

      {/* 1. HERO SECTION */}
      <section className="hero-magnum">
        <div className="hero-backdrop">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="hero-video"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          {/* Overlay gradient is handled in CSS */}
        </div>

        <div className="container hero-content">
          <span className="hero-badge">Handcrafted Luxury</span>
          <h1 className="hero-title">
            Relax & <br />
            <i>Unwind</i>
          </h1>
          <p className="hero-subtitle">
            Experience the void. Handmade bath bombs crafted with organic ingredients for your personal sanctuary.
          </p>
          <div className="btn-group">
            <Link to="/collection" className="btn-cinema">
              Shop Now <ArrowRight size={20} />
            </Link>
            <Link to="/about" className="btn-ghost">
              The Story
            </Link>
          </div>
        </div>
      </section>

      {/* 2. CAROUSEL SECTION */}
      <section className="section-pad">
        <div className="container">
          <Carousel />
        </div>
      </section>

      {/* 3. CATEGORIES (Horizontal Scroll) */}
      <section className="section-pad">
        <div className="container header-row">
          <h2 className="section-title">Our Collections</h2>
          <Link to="/collection" className="link-view-all">View All →</Link>
        </div>

        <div className="cat-scroll-container">
          <div className="spacer-start" />
          
          <CategoryCard
            to="/collection?category=Relaxation"
            title="Unwind"
            subtitle="Lavender & Chamomile"
            bgImage="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800"
          />
          <CategoryCard
            to="/collection?category=Energy"
            title="Revitalize"
            subtitle="Citrus & Peppermint"
            bgImage="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800"
          />
          <CategoryCard
            to="/collection?category=Skincare"
            title="Nourish"
            subtitle="Oatmeal & Shea Butter"
            bgImage="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800"
          />
          
          <div className="spacer-end" />
        </div>
      </section>

      {/* 4. POSTER GALLERY */}
      <PosterGallery />

      {/* 5. VALUE PROPS */}
      <section className="section-pad container">
        <h2 className="section-title center-text">Why Choose Us?</h2>
        <div className="values-grid">
          <ValueCard icon={<Flower size={32} />} title="Natural & Safe" description="Simple, skin-safe ingredients you can trust." />
          <ValueCard icon={<HandPlatter size={32} />} title="Handmade" description="Hand-pressed in small batches for quality." />
          <ValueCard icon={<Package size={32} />} title="Secure Delivery" description="Protective packaging ensures arrival intact." />
          <ValueCard icon={<Sparkles size={32} />} title="Aromatic Bliss" description="Fragrances that linger and transform your mood." />
        </div>
      </section>

      {/* 6. INGREDIENTS */}
      <section className="section-pad">
        <div className="container">
          <div className="ing-header">
            <h2 className="section-title">Transparency Protocol</h2>
            <p className="section-desc">Exactly what goes into our products. No hidden chemicals.</p>
          </div>

          <div className="ingredients-grid-visual">
            <IngredientCard image={bakingSodaImg} name="Baking Soda" description="Sodium Bicarbonate base" />
            <IngredientCard image={citricAcidImg} name="Citric Acid" description="Creates the fizz reaction" />
            <IngredientCard image={epsomSaltImg} name="Epsom Salt" description="Muscle relaxation" />
            <IngredientCard image={polysorbateImg} name="Polysorbate 80" description="Oil emulsifier (Tween 80)" />
            <IngredientCard image={foodColorImg} name="Food Color" description="Vibrant & skin-safe" />
            <IngredientCard image={coconutOilImg} name="Coconut Oil" description="Deep moisturizing" />
            <IngredientCard image={roseImg} name="Natural Essence" description="Premium fragrance oils" />
          </div>

          <div className="safety-notice">
            <strong>Safety First:</strong> Isopropyl alcohol is used for sterilization during the crafting process.
          </div>
        </div>

        {/* 7. REVIEWS PLACEHOLDER */}
        <div className="container reviews-section">
          <div className="reviews-placeholder">
            <MessageSquare size={32} className="review-icon" />
            <h3>Client Feedback Module</h3>
            <p>
              We are currently aggregating reviews from our early adopters. 
              <br />
              <span className="highlight">Transparency is key.</span> Real screenshots and verified testimonials will be deployed here soon.
            </p>
          </div>
        </div>
      </section>

      {/* 8. NEWSLETTER */}
      <section className="newsletter-magnum">
        <div className="container">
          <h2 className="section-title">Stay in the Loop</h2>
          <p className="nl-desc">Subscribe for new scent drops and exclusive offers.</p>

          <form className="nl-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              className="nl-input"
              placeholder="email@address.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubscribing}
            />
            <button type="submit" className="nl-btn" disabled={isSubscribing}>
              {isSubscribing ? 'Processing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}