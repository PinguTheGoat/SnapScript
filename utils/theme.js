import { createContext, useContext } from 'react';

export const themes = {
  light: {
    PRIMARY: '#3B3BDB',
    BACKGROUND: '#EEF0FA',
    CARD_BG: '#FFFFFF',
    CARD_BORDER: '#E8E8E8',
    TEXT_PRIMARY: '#1A1A1A',
    TEXT_MUTED: '#888888',
    TEXT_HINT: '#AAAAAA',
    DIVIDER: '#F0F0F0',
    NAV_BG: '#FFFFFF',
    NAV_BORDER: '#E5E5E5',
    NAV_INACTIVE: '#999999',
    NAV_ACTIVE_PILL: '#EEF0FA',
    PILL_ACTIVE_BG: '#3B3BDB',
    PILL_ACTIVE_TEXT: '#FFFFFF',
    PILL_GHOST_BG: '#FFFFFF',
    PILL_GHOST_BORDER: '#DDDDEE',
    PILL_GHOST_TEXT: '#555577',
    GHOST_BG: '#FFFFFF',
    GHOST_BORDER: '#E0E0E0',
    PREF_SECTION_BG: '#FFFFFF',
    PREF_ROW_BORDER: '#F3F3F3',
    PREF_LABEL: '#999999',
    ICON_BADGE_PURPLE: '#EDE9FE',
    ICON_BADGE_TEAL: '#E0F2F1',
    ICON_BADGE_AMBER: '#FEF3C7',
    ICON_BADGE_BLUE: '#E0EFFE',
    ICON_COLOR_PURPLE: '#6D28D9',
    ICON_COLOR_TEAL: '#0D9488',
    ICON_COLOR_AMBER: '#D97706',
    ICON_COLOR_BLUE: '#2563EB',
    AUTH_INNER_BG: '#F9F9F9',
    AUTH_INNER_BORDER: '#E8E8E8',
    CONFBAR_BG: '#E5E7EB',
    FILTER_ERR_BG: '#FEE2E2',
    FILTER_ERR_TEXT: '#DC2626',
    FILTER_WARN_BG: '#FEF9C3',
    FILTER_WARN_TEXT: '#B45309',
    SUCCESS: '#16A34A',
    SUCCESS_BG: '#DCFCE7',
    SUCCESS_BORDER: '#86EFAC',
    ERROR: '#DC2626',
    ERROR_BG: '#FEE2E2',
    WARNING: '#F59E0B',
    WARNING_BG: '#FEF9C3',
    SCRIM: 'rgba(0, 0, 0, 0.24)',
    SCRIM_STRONG: 'rgba(0, 0, 0, 0.42)',
    IDE_BG: '#0D1117',
    IDE_HEADER: '#161B22',
    IDE_LINENUMS: '#484F58',
    IDE_DEFAULT: '#C9D1D9',
    IDE_KEYWORD: '#FF7B72',
    IDE_FUNCTION: '#D2A8FF',
    IDE_NUMBER: '#79C0FF',
    IDE_STRING: '#A5D6FF',
    ON_PRIMARY: '#FFFFFF',
  },
  dark: {
    PRIMARY: '#3B3BDB',
    BACKGROUND: '#12121E',
    CARD_BG: '#1E1E2E',
    CARD_BORDER: '#333344',
    TEXT_PRIMARY: '#E2E2F0',
    TEXT_MUTED: '#666677',
    TEXT_HINT: '#444455',
    DIVIDER: '#252535',
    NAV_BG: '#1E1E2E',
    NAV_BORDER: '#333344',
    NAV_INACTIVE: '#666677',
    NAV_ACTIVE_PILL: '#2A2A3A',
    PILL_ACTIVE_BG: '#3B3BDB',
    PILL_ACTIVE_TEXT: '#FFFFFF',
    PILL_GHOST_BG: '#1E1E2E',
    PILL_GHOST_BORDER: '#3A3A4A',
    PILL_GHOST_TEXT: '#9999BB',
    GHOST_BG: '#1E1E2E',
    GHOST_BORDER: '#333344',
    PREF_SECTION_BG: '#1E1E2E',
    PREF_ROW_BORDER: '#2A2A3A',
    PREF_LABEL: '#555566',
    ICON_BADGE_PURPLE: '#2D1F5E',
    ICON_BADGE_TEAL: '#0F2E2D',
    ICON_BADGE_AMBER: '#2D1F00',
    ICON_BADGE_BLUE: '#0F1F3D',
    ICON_COLOR_PURPLE: '#A78BFA',
    ICON_COLOR_TEAL: '#2DD4BF',
    ICON_COLOR_AMBER: '#FCD34D',
    ICON_COLOR_BLUE: '#60A5FA',
    AUTH_INNER_BG: '#161622',
    AUTH_INNER_BORDER: '#2E2E3E',
    CONFBAR_BG: '#2A2A3A',
    FILTER_ERR_BG: '#2D1515',
    FILTER_ERR_TEXT: '#F87171',
    FILTER_WARN_BG: '#2D2500',
    FILTER_WARN_TEXT: '#FBBF24',
    SUCCESS: '#16A34A',
    SUCCESS_BG: '#052E16',
    SUCCESS_BORDER: '#166534',
    ERROR: '#F87171',
    ERROR_BG: '#2D1515',
    WARNING: '#FBBF24',
    WARNING_BG: '#2D2500',
    SCRIM: 'rgba(0, 0, 0, 0.24)',
    SCRIM_STRONG: 'rgba(0, 0, 0, 0.42)',
    IDE_BG: '#0D1117',
    IDE_HEADER: '#161B22',
    IDE_LINENUMS: '#484F58',
    IDE_DEFAULT: '#C9D1D9',
    IDE_KEYWORD: '#FF7B72',
    IDE_FUNCTION: '#D2A8FF',
    IDE_NUMBER: '#79C0FF',
    IDE_STRING: '#A5D6FF',
    ON_PRIMARY: '#FFFFFF',
  },
};

export const ThemeContext = createContext(themes.light);

export const useTheme = () => useContext(ThemeContext);

export function getEditorLanguage(language) {
  if (language === 'python') return 'python';
  if (language === 'cpp') return 'cpp';
  if (language === 'c') return 'c';
  return 'plaintext';
}

export function getFilenameForLanguage(language) {
  if (language === 'python') return 'main.py';
  if (language === 'cpp') return 'main.cpp';
  if (language === 'c') return 'main.c';
  return 'main.txt';
}

export function getLanguageDisplayName(language) {
  if (language === 'python') return 'Python';
  if (language === 'cpp') return 'C++';
  if (language === 'c') return 'C';
  return 'Unknown';
}

export function getEditorSyntaxStyle(theme) {
  return {
    hljs: {
      backgroundColor: theme.IDE_BG,
      color: theme.IDE_DEFAULT,
    },
    'hljs-comment': { color: theme.IDE_LINENUMS },
    'hljs-keyword': { color: theme.IDE_KEYWORD },
    'hljs-literal': { color: theme.IDE_NUMBER },
    'hljs-number': { color: theme.IDE_NUMBER },
    'hljs-string': { color: theme.IDE_STRING },
    'hljs-built_in': { color: theme.IDE_KEYWORD },
    'hljs-title': { color: theme.IDE_FUNCTION },
    'hljs-function': { color: theme.IDE_FUNCTION },
    'hljs-name': { color: theme.IDE_FUNCTION },
    'hljs-attr': { color: theme.IDE_FUNCTION },
    'hljs-symbol': { color: theme.IDE_FUNCTION },
    'hljs-meta': { color: theme.IDE_NUMBER },
  };
}
