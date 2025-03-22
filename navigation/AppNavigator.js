// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import SplashScreen from '../screens/SplashScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SchoolSearch">
        <Stack.Screen 
          name="SchoolSearch" 
          component={SchoolSearchScreen}
          options={{ title: 'Select Your School' }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={({ route }) => ({ 
            title: route.params.schoolName 
          })}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Your Schedule' }}
        />
        <Stack.Screen 
          name="Schedule" 
          component={ScheduleScreen} 
          options={{ title: 'Weekly Schedule' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Settings' }}
        />
        <Stack.Screen 
            name="Splash" 
            component={SplashScreen} 
            options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
