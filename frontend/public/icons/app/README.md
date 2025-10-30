# QuizMaster App Icons

Professional app icons generated using Python Pillow library.

## Design Details

- **Primary Color**: #10B981 (Green - theme color)
- **Accent Color**: #3B82F6 (Blue)
- **Design Elements**: 
  - Large 'Q' letter in center (represents QuizMaster)
  - Gradient background
  - Decorative checkmark (represents quiz completion)
  - Small circle accent
  - Rounded corners for modern look

## Generated Sizes

### PWA App Icons
- 72x72px
- 96x96px
- 128x128px
- 144x144px
- 152x152px
- 192x192px
- 384x384px
- 512x512px

### Favicons
- 16x16px
- 32x32px
- favicon.ico (multi-resolution)

## Usage

Icons are referenced in:
- `/public/manifest.json` - PWA manifest
- `/public/index.html` - Favicon and apple-touch-icon

## Regeneration

To regenerate icons, run:
```bash
python /app/generate_icons.py
```

## Notes

- All icons are optimized for size
- Icons use transparent backgrounds with rounded corners
- Compatible with all modern browsers and PWA standards
- Generated using Pillow (PIL) library - no manual SVG to PNG conversion
