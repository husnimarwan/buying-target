import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import '../App.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <header className="landing-header">
          <div className="logo-container">
            <img src={logo} alt="WishTrack Logo" className="logo" />
          </div>
        </header>
        <p>Your Smart Wishlist & Budget Tracker</p>
        
          <section className="cta-section">
          <h2>Start Managing Your Wishlist Today</h2>
          <p>Sign in to sync your targets across all devices</p>
          <Link to="/app" className="cta-button">Get Started</Link>
        </section>
        
        <section className="features">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Set Targets</h3>
            <p>Create and organize your wishlist items with specific target prices</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Track Budget</h3>
            <p>Monitor your savings progress and see how much more you need</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>View History</h3>
            <p>Keep track of your contributions with detailed history logs</p>
          </div>
        </section>
      </div>
      
      <footer className="landing-footer">
        <p>&copy; 2025 WishTrack. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;