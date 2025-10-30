import html2canvas from 'html2canvas';

/**
 * Generate PWA icons for a class with stylish Q logo
 * @param {string} className - Class name (e.g., '10th')
 * @param {string} themeColor - Primary theme color hex
 * @param {string} themeName - Theme name for styling
 */
export const generateClassIcon = async (className, themeColor, themeName) => {
  // Create temporary div for icon rendering
  const iconContainer = document.createElement('div');
  iconContainer.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 512px;
    height: 512px;
    background: linear-gradient(135deg, ${themeColor} 0%, ${adjustColor(themeColor, -20)} 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 120px;
    box-shadow: inset 0 0 100px rgba(255,255,255,0.2);
  `;

  // Add stylish Q
  const qLetter = document.createElement('div');
  qLetter.style.cssText = `
    font-family: 'Arial Black', 'Impact', sans-serif;
    font-size: 280px;
    font-weight: 900;
    color: white;
    text-shadow: 0 8px 24px rgba(0,0,0,0.3);
    line-height: 1;
    margin-top: -30px;
  `;
  qLetter.textContent = 'Q';

  // Add class label
  const classLabel = document.createElement('div');
  classLabel.style.cssText = `
    font-family: 'Arial', sans-serif;
    font-size: 48px;
    font-weight: 700;
    color: white;
    margin-top: -40px;
    text-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  classLabel.textContent = className;

  iconContainer.appendChild(qLetter);
  iconContainer.appendChild(classLabel);
  document.body.appendChild(iconContainer);

  // Generate canvas
  const canvas = await html2canvas(iconContainer, {
    backgroundColor: null,
    scale: 1,
    logging: false
  });

  // Cleanup
  document.body.removeChild(iconContainer);

  return canvas.toDataURL('image/png');
};

/**
 * Adjust color brightness
 */
const adjustColor = (color, amount) => {
  const clamp = (val) => Math.min(Math.max(val, 0), 255);
  const num = parseInt(color.replace('#', ''), 16);
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 0x00FF) + amount);
  const b = clamp((num & 0x0000FF) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

/**
 * Generate all icon sizes for PWA
 */
export const generateAllIconSizes = async (className, themeColor, themeName) => {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const icons = {};

  // Generate base 512px icon
  const baseIcon = await generateClassIcon(className, themeColor, themeName);

  // For simplicity, use the same icon for all sizes
  // In production, you'd resize properly
  sizes.forEach(size => {
    icons[size] = baseIcon;
  });

  return icons;
};

/**
 * Save icon to localStorage (temporary storage)
 */
export const saveIconToStorage = (className, iconData) => {
  localStorage.setItem(`icon_${className}`, iconData);
};

/**
 * Get icon from storage
 */
export const getIconFromStorage = (className) => {
  return localStorage.getItem(`icon_${className}`);
};
