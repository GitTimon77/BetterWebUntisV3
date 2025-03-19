// theme/theme.js
import { Appearance } from 'react-native';

const defaultMode = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

export const lightTheme = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333333',
  subtext: '#777777',
  primary: '#2196F3',
  accent: '#4CAF50',
  danger: '#F44336',
  warning: '#FF9800',
  border: '#e0e0e0',
  statusBar: 'dark-content'
};

export const darkTheme = {
  background: '#121212',
  card: '#2a2a2a',
  text: '#ffffff',
  subtext: '#aaaaaa',
  primary: '#81b0ff',
  accent: '#66bb6a',
  danger: '#ef5350',
  warning: '#ffb74d',
  border: '#444444',
  statusBar: 'light-content'
};

export const getTheme = (mode = defaultMode) => {
  return mode === 'dark' ? darkTheme : lightTheme;
};
