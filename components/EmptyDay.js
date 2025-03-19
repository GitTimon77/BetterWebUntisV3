// components/EmptyDay.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

const EmptyDay = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
      <Icon name="event-busy" size={40} color={theme.subtext} />
      <Text style={[styles.text, { color: theme.subtext }]}>
        No classes scheduled for this day
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginHorizontal: 10,
    marginTop: 4,
    marginBottom: 10,
    borderRadius: 8,
  },
  text: {
    fontSize: 14,
    marginTop: 10,
  },
});

export default EmptyDay;
