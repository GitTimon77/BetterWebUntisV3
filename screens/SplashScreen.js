// screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const SplashScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  useEffect(() => {
    checkAuthentication();
  }, []);
  
  const checkAuthentication = async () => {
    try {
      // Check if user is already logged in
      const sessionInfo = await AsyncStorage.getItem('sessionInfo');
      const credentials = await AsyncStorage.getItem('credentials');
      
      // Wait for a minimum time to show splash screen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (sessionInfo && credentials) {
        // User is logged in, go to Home
        navigation.replace('Home');
      } else {
        // User is not logged in, go to Login
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Error during authentication check:', error);
      navigation.replace('Login');
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image 
        source={require('../assets/images/app_icon.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.title, { color: theme.text }]}>Your Schedule</Text>
      <ActivityIndicator 
        size="large" 
        color={theme.primary} 
        style={styles.loader} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  }
});

export default SplashScreen;
