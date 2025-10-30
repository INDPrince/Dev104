/**
 * Theme Manager - Class-wise Theme Switching
 * Dynamically changes colors, manifest, and icons based on selected class
 */

const THEMES = {
  '10th': {
    primary: '#2563EB',
    secondary: '#1E40AF',
    light: '#DBEAFE',
    gradient: 'from-blue-600 to-blue-400',
    name: 'Blue',
    iconPath: '/icons/class10'
  },
  '11th': {
    primary: '#10B981',
    secondary: '#059669',
    light: '#D1FAE5',
    gradient: 'from-green-600 to-emerald-400',
    name: 'Green',
    iconPath: '/icons/class11'
  },
  '12th': {
    primary: '#EC4899',
    secondary: '#DB2777',
    light: '#FCE7F3',
    gradient: 'from-pink-600 to-rose-400',
    name: 'Pink',
    iconPath: '/icons/class12'
  }
};

// Apply theme
export const applyTheme = (classId) => {
  const theme = THEMES[classId];
  if (!theme) {
    console.warn(`⚠️ Theme not found for ${classId}, using default`);
    return;
  }
  
  console.log(`🎨 Applying ${theme.name} theme for ${classId}`);
  
  // Update CSS variables
  document.documentElement.style.setProperty('--theme-primary', theme.primary);
  document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
  document.documentElement.style.setProperty('--theme-light', theme.light);
  
  // Update meta theme-color
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute('content', theme.primary);
  
  // Update manifest link (switch to class-specific manifest)
  let manifestLink = document.querySelector('link[rel="manifest"]');
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.setAttribute('rel', 'manifest');
    document.head.appendChild(manifestLink);
  }
  manifestLink.setAttribute('href', `/manifest-${classId}.json`);
  
  // Save to localStorage
  localStorage.setItem('selectedTheme', classId);
  localStorage.setItem('themeColor', theme.primary);
  
  console.log(`✅ Theme applied: ${theme.name} (${classId})`);
};

// Get current theme
export const getCurrentTheme = () => {
  return localStorage.getItem('selectedTheme') || '11th'; // Default to 11th
};

// Get theme config
export const getThemeConfig = (classId) => {
  return THEMES[classId] || THEMES['11th'];
};

// Get all themes
export const getAllThemes = () => {
  return THEMES;
};

// Initialize theme on app load
export const initializeTheme = () => {
  const savedTheme = getCurrentTheme();
  applyTheme(savedTheme);
  console.log(`🚀 Initialized with theme: ${savedTheme}`);
};

// Switch theme with animation
export const switchTheme = (classId) => {
  // Add transition class to body
  document.body.classList.add('theme-transitioning');
  
  // Apply new theme
  applyTheme(classId);
  
  // Remove transition class after animation
  setTimeout(() => {
    document.body.classList.remove('theme-transitioning');
  }, 300);
};

// Get gradient class for Tailwind
export const getGradientClass = (classId) => {
  const theme = THEMES[classId];
  return theme ? theme.gradient : THEMES['11th'].gradient;
};
