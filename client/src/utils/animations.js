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

export const navbarScroll = {
  scrolled: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 4px 6px -1px rgba(167, 68, 195, 0.1)',
    transition: { duration: 0.3 }
  },
  default: {
    backgroundColor: 'transparent',
    transition: { duration: 0.3 }
  }
};

export const navLinkHover = {
  default: { width: '0%' },
  hover: { width: '100%' },
  active: { width: '100%' },
  transition: { duration: 0.3 }
};
export const toastStyles = `
  .Toastify__toast-container {
    top: 20px !important;
  }
  .Toastify__toast-icon svg {
    fill: #8B5CF6 !important;
  }
  .Toastify__toast--success .Toastify__toast-icon svg {
    fill: #8B5CF6 !important;
  }
  .Toastify__toast--error .Toastify__toast-icon svg {
    fill: #8B5CF6 !important;
  }
  .Toastify__progress-bar {
    background: #8B5CF6 !important;
  }
  .Toastify__progress-bar--success {
    background: #8B5CF6 !important;
  }
  .Toastify__progress-bar--error {
    background: #8B5CF6 !important;
  }
  .Toastify__toast {
    background: #0B0B0B !important;
    border: 1px solid rgba(139, 92, 246, 0.2) !important;
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.1) !important;
    color: #E5E7EB !important;
  }
  .Toastify__close-button {
    color: #8B5CF6 !important;
    opacity: 0.7;
  }
  .Toastify__close-button:hover {
    opacity: 1;
  }
`;