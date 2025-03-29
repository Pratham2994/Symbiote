import React, { useState, useEffect } from 'react';
import Navbar from '../components/NavBar';
import Hero from '../components/HeroSection';
import Features from '../components/FeaturesSection';
import About from '../components/AboutSection';
import AuthModal from '../components/AuthModal';
import { AnimatePresence } from 'framer-motion';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState('login');

  useEffect(() => {
    const handleAuthEvent = (e) => {
      setAuthType(e.detail.type);
      setShowAuthModal(true);
    };

    document.addEventListener('openAuth', handleAuthEvent);
    return () => document.removeEventListener('openAuth', handleAuthEvent);
  }, []);

  const handleAuthClick = (type) => {
    setAuthType(type);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-ghost-lilac">
      <Navbar onAuthClick={handleAuthClick} />
      <Hero onAuthClick={handleAuthClick} />
      <Features />
      <About />
      
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal 
            type={authType} 
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
