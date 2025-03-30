import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Code2 } from 'lucide-react';

const Navbar = ({ onAuthClick }) => {
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ['rgba(11, 11, 11, 0)', 'rgba(11, 11, 11, 0.8)']
  );

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollY.onChange(latest => {
      setIsScrolled(latest > 20);
    });
    return () => unsubscribe();
  }, [scrollY]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.nav
      style={{ backgroundColor }}
      className={`fixed w-full z-50 transition-all duration-300 backdrop-blur-sm ${
        isScrolled ? 'shadow-lg shadow-venom-purple/10' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Code2 className="w-8 h-8 text-venom-purple" />
            <span className="text-xl font-bold bg-gradient-to-r from-venom-purple to-ghost-lilac bg-clip-text text-transparent">
              Symbiote
            </span>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            {[
              { name: 'Home', id: 'hero' },
              { name: 'Features', id: 'features' },
              { name: 'About Us', id: 'about' }
            ].map((item, index) => (
              <motion.button
                key={item.name}
                onClick={() => scrollToSection(item.id)}
                className="relative text-ghost-lilac/80 hover:text-venom-purple transition-colors group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-venom-purple transition-all duration-300 group-hover:w-full" />
              </motion.button>
            ))}
          </div>

          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={() => onAuthClick('login')}
              className="px-4 py-2 text-ghost-lilac/80 hover:text-venom-purple transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => onAuthClick('signup')}
              className="px-4 py-2 bg-venom-purple rounded-lg text-ghost-lilac shadow-neon hover:shadow-lg hover:bg-venom-purple/90 transition-all"
            >
              Sign up
            </button>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
