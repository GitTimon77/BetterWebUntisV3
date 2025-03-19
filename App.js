// App.js
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ScheduleProvider } from './context/ScheduleContext';
import AppNavigator from './navigation/AppNavigator';
import NotificationService from './services/NotificationService';

const AppContent = () => {
  const { theme, darkMode } = useTheme();
  
  useEffect(() => {
    const setupNotifications = async () => {
      await NotificationService.initialize();
    };
    
    setupNotifications();
  }, []);
  
  return (
    <>
      <StatusBar 
        barStyle={theme.statusBar} 
        backgroundColor={darkMode ? '#000000' : '#ffffff'} 
      />
      <AppNavigator />
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <ScheduleProvider>
        <AppContent />
      </ScheduleProvider>
    </ThemeProvider>
  );
};

export default App;
