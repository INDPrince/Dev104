/**
 * Pre-defined Theme Configuration
 * 5 themes for different classes with complete hex codes
 */

export const PREDEFINED_THEMES = [
  {
    id: 'blue',
    name: 'Blue Ocean',
    primary: '#2563EB',
    secondary: '#1E40AF',
    light: '#DBEAFE',
    gradient: 'from-blue-600 to-blue-400',
    bgGradient: 'from-blue-50 via-blue-100 to-cyan-50',
    iconColor: '#2563EB'
  },
  {
    id: 'green',
    name: 'Emerald Forest',
    primary: '#10B981',
    secondary: '#059669',
    light: '#D1FAE5',
    gradient: 'from-green-600 to-emerald-400',
    bgGradient: 'from-emerald-50 via-teal-50 to-cyan-50',
    iconColor: '#10B981'
  },
  {
    id: 'pink',
    name: 'Rose Garden',
    primary: '#EC4899',
    secondary: '#DB2777',
    light: '#FCE7F3',
    gradient: 'from-pink-600 to-rose-400',
    bgGradient: 'from-pink-50 via-rose-50 to-red-50',
    iconColor: '#EC4899'
  },
  {
    id: 'purple',
    name: 'Purple Dream',
    primary: '#9333EA',
    secondary: '#7C3AED',
    light: '#F3E8FF',
    gradient: 'from-purple-600 to-violet-400',
    bgGradient: 'from-purple-50 via-violet-50 to-fuchsia-50',
    iconColor: '#9333EA'
  },
  {
    id: 'orange',
    name: 'Sunset Orange',
    primary: '#F97316',
    secondary: '#EA580C',
    light: '#FFEDD5',
    gradient: 'from-orange-600 to-amber-400',
    bgGradient: 'from-orange-50 via-amber-50 to-yellow-50',
    iconColor: '#F97316'
  }
];

/**
 * Get theme by ID
 */
export const getThemeById = (themeId) => {
  return PREDEFINED_THEMES.find(t => t.id === themeId) || PREDEFINED_THEMES[1]; // Default: green
};

/**
 * Get theme by primary color
 */
export const getThemeByColor = (color) => {
  return PREDEFINED_THEMES.find(t => t.primary.toLowerCase() === color.toLowerCase()) || null;
};

/**
 * Apply theme to document
 */
export const applyTheme = (theme) => {
  if (!theme) return;
  
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
};

/**
 * Create custom theme from hex code
 */
export const createCustomTheme = (primaryHex) => {
  // Simple lighter/darker variants
  return {
    id: 'custom',
    name: 'Custom',
    primary: primaryHex,
    secondary: primaryHex,
    light: primaryHex + '20', // Add transparency
    gradient: 'from-gray-600 to-gray-400',
    bgGradient: 'from-gray-50 via-gray-100 to-slate-50',
    iconColor: primaryHex
  };
};
