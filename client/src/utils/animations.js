// animations.js
export const floatingAnimation = {
  y: [0, -20, 0],
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
};

export const brightnessAnimation = {
  filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
};

// Updated cardHover: tween with zero duration ensures immediate revert on hover exit
export const cardHover = {
  scale: 1.05,
  boxShadow: '0px 0px 20px rgba(167,68,195,0.7)',
  transition: { type: 'tween', duration: 0 }
};
