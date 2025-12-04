import { useState } from 'react'
import { Link } from 'react-router-dom'
import './FAQ.css'

// ----------------------------------------------------
// 1. FOOTER COMPONENT DEFINITION (Correctly placed)
// ----------------------------------------------------
const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-bottom"> {/* <-- This class will now center the text */}
        &copyright; {new Date().getFullYear()} Omnora. All rights reserved. |Operated and Developed By Ahmad Mahboob
      </div>
    </div>
  </footer>
);

// ----------------------------------------------------
// 2. MAIN FAQ COMPONENT
// ----------------------------------------------------
export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  const faqs = [
    {
      question: "How do I return or exchange an item?",
      answer: (
        <>
          <p>To initiate a return or exchange:</p>
          <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Contact our customer service team to request a return authorization.</li>
            <li>Pack the item(s) securely in their original packaging.</li>
            <li>Include the return form that was provided with your order.</li>
            <li>Ship the package to the address provided by our customer service team.</li>
          </ol>
          <p style={{ marginTop: '0.5rem' }}>For exchanges, please specify the item you wish to receive instead. If there is a price difference, we will contact you regarding additional payment or refund.</p>
        </>
      )
    },
    {
      question: "Who pays for return shipping?",
      answer: "Return shipping costs are the responsibility of the customer, except in cases where the item is defective or we made an error in your order. In these cases, we will provide a prepaid shipping label or reimburse your shipping costs."
    },
    {
      question: "How long does it take to process a refund?",
      answer: "Refunds are processed within 7-14 days of receiving your returned items. The refund will be issued to the original payment method used for the purchase. Please note that it may take an additional 3-5 business days for the refund to appear in your account, depending on your bank or credit card issuer."
    }
  ];

  return (
    <> 
        <div className="faq-page">
            <header className="faq-hero">
                <div className="faq-hero-content">
                    <h1 className="faq-hero-title">Elevate Your Every Bath</h1>
                    <p className="faq-hero-subtitle">Handmade bath bombs for luxury self-care: Clean, calming, skin-loving. Timeless Omnora ritual, now yours.</p>
                    <Link to="/collection" className="luxury-button" style={{ marginTop: '1.5rem', display: 'inline-block' }}>Shop Bath Bombs</Link>
                </div>
            </header>

            <div className="faq-container">
                <div className="breadcrumbs" style={{ marginBottom: '2rem' }}>
                    <ul className="breadcrumbs-list">
                        <li className="breadcrumbs-item"><Link to="/" className="breadcrumbs-link">Home</Link></li>
                        <li className="breadcrumbs-item">FAQ</li>
                    </ul>
                </div>

                <div className="legal-section">
                    <div className="legal-header">
                        <h2 className="legal-heading">Note For Sure!</h2>
                    </div>
                    <h3 className="legal-subheading">As we dont have any big customer base yet, we are unable to offer extensive FAQs at this time.</h3>
                    <div className="legal-body">
                        <ul>
                            <li>We appreciate your understanding and support as we grow our business.</li>
                            <li>If you have any specific questions or concerns, please feel free to reach out to us directly.</li>
                        </ul>
                        <div className="legal-note" style={{ marginTop: '1rem', fontStyle: 'italic' }}>
                            <p>Every thing is orignally develeped By invidual developers. so if you have any questions or feedback, please let us know.</p>
                            <p>Or use our <Link to="/contact" style={{ color: 'var(--primary-color)' }}>contact form</Link> and let us know your thoughts.</p>
                        </div>
                    </div>
                </div>

                <div className="faq-list">
                    <h2 className="legal-heading" style={{ marginBottom: '1.5rem' }}>Frequently Asked Questions</h2>
                    {faqs.map((faq, index) => (
                        <div key={index} className={`faq-item ${activeIndex === index ? 'active' : ''}`}>
                            <button className="faq-question" onClick={() => toggleFAQ(index)}>
                                {faq.question}
                                <span className="faq-icon">▼</span>
                            </button>
                            <div className="faq-answer">
                                {typeof faq.answer === 'string' ? <p>{faq.answer}</p> : faq.answer}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="faq-contact">
                    <h2 className="legal-heading">If you Have Any Questions?</h2>
                    <p>If you couldn't find the answer to your question, please don't hesitate to contact us:</p>
                    <ul className="contact-info-list">
                        <li>Email: <a href="mailto:omnorainfo28@gmail.com">omnorainfo28@gmail.com</a></li>
                        <li>Phone: +92 3334355475 (Monday to Saturday, 11am - 9pm PKT)</li>
                        <li>Or use our <Link to="/contact">contact form</Link></li>
                    </ul>
                </div>
            </div>

        </div>


        
        {/* Footer is rendered correctly here */}
        <Footer />
    </>
  )

}