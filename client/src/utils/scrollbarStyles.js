export const scrollbarStyles = `
  /* Global scrollbar styles */
  ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  
  /* Only show scrollbar when content is scrollable */
  ::-webkit-scrollbar-track {
    background: rgba(11, 11, 11, 0.8);
    display: none;
  }
  
  ::-webkit-scrollbar-thumb {
    background: rgba(216, 180, 254, 0.5);
    border-radius: 2px;
    display: none;
  }
  
  /* Show scrollbar only when content is scrollable */
  *:hover::-webkit-scrollbar-track,
  *:hover::-webkit-scrollbar-thumb {
    display: block;
  }
  
  /* Only show scrollbar on elements that can scroll */
  *:not(:hover)::-webkit-scrollbar-track,
  *:not(:hover)::-webkit-scrollbar-thumb {
    display: none;
  }
  
  /* Show scrollbar when actually scrolling */
  *::-webkit-scrollbar-thumb:vertical:hover,
  *::-webkit-scrollbar-thumb:horizontal:hover,
  *::-webkit-scrollbar-thumb:vertical:active,
  *::-webkit-scrollbar-thumb:horizontal:active {
    display: block;
  }
  
  /* Ensure scrollbar space is not reserved when not needed */
  html {
    scrollbar-gutter: auto;
  }
  
  /* Hide scrollbar for specific elements that should not show it */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`; 