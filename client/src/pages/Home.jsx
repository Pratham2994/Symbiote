import React from 'react';
import Navbar from '../components/NavBar';
import Hero from '../components/HeroSection';
import Features from '../components/FeaturesSection';
import About from '../components/AboutSection';

export default function Home() {
  const handleAuthClick = (action) => {
    console.log('Auth action:', action);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-ghost-lilac">
      <Navbar onAuthClick={handleAuthClick} />
      <Hero onAuthClick={handleAuthClick} />
      <Features />
      <About />
    </div>
  );
}
