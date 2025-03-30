import React from 'react';
import { motion } from 'framer-motion';
import { team } from '../utils/data';
import { cardHover } from '../utils/animations';

const AboutSection = () => {
  return (
    <section id="about" className="py-20 px-4 md:px-8 bg-gradient-to-b from-symbiote-purple/30 to-void-black">
      <div className="max-w-7xl mx-auto">
        <motion.h2 
          className="text-4xl font-bold text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Meet Our Team
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              className="p-6 rounded-xl bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={cardHover}
            >
              <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
              <p className="text-ghost-lilac/70">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
