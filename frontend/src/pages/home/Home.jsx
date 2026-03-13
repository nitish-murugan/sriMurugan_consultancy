import { Link, useNavigate } from 'react-router-dom';
import {
  Bus,
  MapPin,
  Calendar,
  Shield,
  Users,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import Button from '../../components/Button';
import { Card, CardBody } from '../../components/Card';
import { useAuth } from '../../context/useAuth';
import './Home.css';

const features = [
  {
    icon: <Bus size={32} />,
    title: 'Premium Fleet',
    description: 'Modern AC buses with comfortable seating, WiFi, and entertainment systems for a pleasant journey.',
  },
  {
    icon: <MapPin size={32} />,
    title: 'Multiple Destinations',
    description: 'Explore top companies and industrial facilities across Tamil Nadu for educational visits.',
  },
  {
    icon: <Calendar size={32} />,
    title: 'Flexible Scheduling',
    description: 'Book visits on your preferred dates with multiple pickup points for convenience.',
  },
  {
    icon: <Shield size={32} />,
    title: 'Safety First',
    description: 'Fully insured vehicles with experienced drivers and proper permits for worry-free travel.',
  },
];

const stats = [
  { value: '500+', label: 'Successful Tours' },
  { value: '50+', label: 'Partner Companies' },
  { value: '10,000+', label: 'Happy Students' },
  { value: '30+', label: 'Cities Covered' },
];

const steps = [
  { step: 1, title: 'Choose Destination', desc: 'Select your preferred city and companies to visit' },
  { step: 2, title: 'Pick a Bus', desc: 'Browse our fleet and select suitable transport' },
  { step: 3, title: 'Enter Details', desc: 'Provide institution and participant information' },
  { step: 4, title: 'Confirm & Pay', desc: 'Review booking and complete payment securely' },
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStartBooking = () => {
    if (isAuthenticated) {
      navigate('/booking');
      return;
    }

    const goToLogin = window.confirm(
      'Please login or sign up to start booking.\n\nPress OK for Login or Cancel for Sign Up.'
    );
    navigate(goToLogin ? '/login' : '/register');
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content container">
          <div className="hero-badge">
            <Star size={16} /> Trusted by 100+ Institutions
          </div>
          <h1>Book Industrial Visits for Your Institution</h1>
          <p>
            Sri Murugan Tours offers premium bus services for educational and 
            industrial visits across Tamil Nadu. Easy booking, secure payments, 
            and memorable experiences.
          </p>
          <div className="hero-actions">
            <Button size="large" icon={ArrowRight} onClick={handleStartBooking}>
              Start Booking
            </Button>
            <Link to="/register">
              <Button variant="outline" size="large">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="var(--bg-secondary)"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Sri Murugan Tours?</h2>
            <p>We make industrial visits seamless, safe, and memorable</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <Card key={index} className="feature-card">
                <CardBody>
                  <div className="feature-icon">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="steps-section">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Book your industrial visit in 4 simple steps</p>
          </div>
          <div className="steps-grid">
            {steps.map((item) => (
              <div key={item.step} className="step-item">
                <div className="step-number">{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Plan Your Industrial Visit?</h2>
            <p>
              Join hundreds of institutions that trust Sri Murugan Tours 
              for their educational excursions.
            </p>
            <div className="cta-features">
              <div className="cta-feature">
                <CheckCircle size={20} />
                <span>Instant Confirmation</span>
              </div>
              <div className="cta-feature">
                <CheckCircle size={20} />
                <span>Secure Payments</span>
              </div>
              <div className="cta-feature">
                <CheckCircle size={20} />
                <span>24/7 Support</span>
              </div>
            </div>
            <Link to="/booking">
              <Button size="large" icon={ArrowRight}>
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <Bus size={32} />
              <span>Sri Murugan Tours</span>
            </div>
            <div className="footer-links">
              <Link to="/booking">Book Now</Link>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </div>
            <p className="footer-copyright">
              © {new Date().getFullYear()} Sri Murugan Tours. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
