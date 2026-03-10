const THEME_KEY = 'valhalla-theme';

export const THEMES = {
  dark: {
    id: 'dark',
    name: 'Valhalla Dark',
    description: 'Nórdico oscuro con acentos turquesa y acero',
    preview: ['#050507', '#1C1F24', '#1fab97', '#C7CCD4'],
  },
  emerald: {
    id: 'emerald',
    name: 'Valhalla Emerald',
    description: 'Nórdico verde esmeralda profundo',
    preview: ['#071A17', '#12332D', '#22D3A6', '#9EDBD0'],
  },
};

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

export function setTheme(themeId) {
  if (!THEMES[themeId]) return;
  localStorage.setItem(THEME_KEY, themeId);
  applyTheme(themeId);
}

export function applyTheme(themeId) {
  const id = themeId || getTheme();
  document.documentElement.setAttribute('data-theme', id);
}

