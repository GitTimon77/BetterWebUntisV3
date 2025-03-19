// context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, lightTheme, darkTheme } from '../theme/theme';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState(lightTheme);
  
  useEffect(() => {
    loadThemePreference();
    
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme === 'dark') {
        setTheme(darkTheme);
        setDarkMode(true);
      } else {
        setTheme(lightTheme);
        setDarkMode(false);
      }
    });
    
    return () => subscription.remove();
  }, []);
  
  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('themePreference');
      if (storedTheme !== null) {
        const isThemeDark = JSON.parse(storedTheme);
        setDarkMode(isThemeDark);
        setTheme(isThemeDark ? darkTheme : lightTheme);
      } else {
        // Use system theme as default
        const systemTheme = Appearance.getColorScheme();
        setDarkMode(systemTheme === 'dark');
        setTheme(systemTheme === 'dark' ? darkTheme : lightTheme);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };
  
  const toggleTheme = async () => {
    try {
      const newDarkMode = !darkMode;
      setDarkMode(newDarkMode);
      setTheme(newDarkMode ? darkTheme : lightTheme);
      await AsyncStorage.setItem('themePreference', JSON.stringify(newDarkMode));
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };
  
  return (
    <ThemeContext.Provider value={{ theme, darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
