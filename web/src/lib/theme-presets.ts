export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors?: string[]; // for UI preview in Auto
  primary?: string;
  secondary?: string;
  accent?: string;
  fontTitle?: string;
  fontBody?: string;
  darkBackground?: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'auto', name: 'Auto-Detect', description: 'AI automatically selects the best bespoke palette for your topic.', colors: ['#6366F1', '#3B82F6', '#EC4899'] },
  { id: 'deep-tech', name: 'Deep Tech', description: 'Midnight blue, digital cobalt, and electric neon teal. Modern.', primary: '#0A0E27', secondary: '#1B2FFF', accent: '#00F5C4', fontTitle: 'Arial', fontBody: 'Calibri', darkBackground: true },
  { id: 'luxury-finance', name: 'Luxury Finance', description: 'Rich dark espresso, champagne, and warm gold accents. Corporate.', primary: '#1A0A00', secondary: '#C9A84C', accent: '#F5EDD6', fontTitle: 'Georgia', fontBody: 'Calibri', darkBackground: true },
  { id: 'clean-saas', name: 'Clean SaaS', description: 'Deep obsidian, energetic indigo, and bright sky blue. Premium.', primary: '#0A0F2C', secondary: '#3D5AF1', accent: '#00D4FF', fontTitle: 'Calibri', fontBody: 'Calibri', darkBackground: true },
  { id: 'climate-green', name: 'Climate/ESG', description: 'Deep moss green, vibrant emerald, and fresh mint. Clean.', primary: '#0B3D2E', secondary: '#3CB371', accent: '#E8F5E9', fontTitle: 'Garamond', fontBody: 'Calibri', darkBackground: true },
  { id: 'creative-agency', name: 'Creative Agency', description: 'Warm energetic coral, turquoise, and brilliant off-white.', primary: '#FF6B6B', secondary: '#4ECDC4', accent: '#F7FFF7', fontTitle: 'Trebuchet MS', fontBody: 'Calibri', darkBackground: true },
  { id: 'cyber-neon', name: 'Cyber Neon', description: 'Deep slate, high-voltage pink, and electric cyber blue. High impact.', primary: '#0F172A', secondary: '#EC4899', accent: '#3B82F6', fontTitle: 'Arial Black', fontBody: 'Arial', darkBackground: true },
  { id: 'minimal-light', name: 'Minimal Light', description: 'Ultra-clean slate gray background with pure dark graphite text.', primary: '#F8FAFC', secondary: '#64748B', accent: '#0F172A', fontTitle: 'Arial', fontBody: 'Calibri', darkBackground: false }
];
