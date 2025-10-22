import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <header className="landing-header">
          <h1>WishTrack</h1>
          <p>Your Smart Wishlist & Budget Tracker</p>
        </header>
        
        <section className="cta-section">
          <h2>Start Managing Your Wishlist Today</h2>
          <p>Sign in to sync your targets across all devices</p>
          <Link to="/app" className="cta-button">Get Started</Link>
        </section>
        
        <section className="features">
          <div className="feature-card">
            <h3>🎯 Set Targets</h3>
            <p>Create and organize your wishlist items with specific target prices</p>
          </div>
          <div className="feature-card">
            <h3>💰 Track Budget</h3>
            <p>Monitor your savings progress and see how much more you need</p>
          </div>
          <div className="feature-card">
            <h3>📊 View History</h3>
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