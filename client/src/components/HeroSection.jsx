import React from 'react';
import { motion } from 'framer-motion';

const HeroSection = ({ onAuthClick }) => {
  return (
    <section id="hero" className="relative pt-32 pb-16 px-4 md:px-8 bg-gradient-to-b from-void-black to-symbiote-purple/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-venom-purple to-symbiote-purple bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Build Your Dream Hackathon Team
            </motion.h1>
            <motion.p 
              className="text-xl mb-8 text-ghost-lilac/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Connect with talented Somaiya students, form powerful teams, and create winning projects together.
            </motion.p>
            <motion.div 
              className="flex gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button 
                onClick={() => onAuthClick('signup')}
                className="px-8 py-3 bg-venom-purple rounded-lg font-semibold shadow-neon hover:shadow-lg hover:bg-venom-purple/90 transition-all"
              >
                Get Started
              </button>
            </motion.div>
          </div>
          <motion.div className="relative">
            <motion.img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" 
              alt="Team Collaboration"
              className="rounded-2xl"
              initial={{ y: 0, filter: 'brightness(1)' }}
              animate={{ 
                y: [0, -5, 0],
                filter: 'brightness(1.2)'
              }}
              transition={{ 
                y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                filter: { duration: 1, ease: "easeOut" }
              }}
              style={{ boxShadow: '0px 0px 20px rgba(167,68,195,0.7)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-void-black/80 to-transparent rounded-2xl" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
