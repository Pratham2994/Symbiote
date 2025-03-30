import React from 'react';
import { motion } from 'framer-motion';
import { cardHover } from '../utils/animations';
import { features } from '../utils/data';

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-4 md:px-8 bg-gradient-to-b from-symbiote-purple/20 to-symbiote-purple/30">
      <div className="max-w-7xl mx-auto">
        <motion.h2 
          className="text-4xl font-bold text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Why Choose Symbiote?
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="p-6 rounded-xl bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              whileHover={cardHover}
            >
              <feature.icon className="w-12 h-12 text-venom-purple mb-4" />
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-ghost-lilac/70">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
