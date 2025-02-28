import { create } from 'twrnc';

// create the customized version...
const tw = create(require('../../tailwind.config.js'));

// Update your tailwind config with a more refined palette
const jungianPalette = {
  'jung-purple': '#4A3B78',      // Primary - represents the unconscious
  'jung-purple-light': '#9D94BC', // Secondary
  'jung-gold': '#D4AF37',        // Accent - represents the Self/individuation
  'jung-shadow': '#2C2C2C',      // Dark elements - represents the Shadow
  'jung-anima': '#E6D7B9',       // Warm neutral - feminine energy
  'jung-animus': '#536878',      // Cool neutral - masculine energy
  'jung-bg': '#F9F7F4',          // Background - clean but not stark white
  'jung-text': '#333333',        // Text color - softer than black
}

// Add these colors to your tailwind config

export default tw; 