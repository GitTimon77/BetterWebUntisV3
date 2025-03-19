// components/ClassCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ClassCard = ({ classItem, color }) => {
  const { theme } = useTheme();
  const isCancelled = classItem.code === 'cancelled';
  
  const formatTime = (timeString) => {
    const str = timeString.toString();
    const hours = str.length === 3 ? str.substring(0, 1) : str.substring(0, 2);
    const minutes = str.length === 3 ? str.substring(1, 3) : str.substring(2, 4);
    return `${hours}:${minutes}`;
  };
  
  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.card,
          borderLeftColor: color || theme.primary,
          opacity: isCancelled ? 0.7 : 1,
          borderColor: theme.border
        }
      ]}
    >
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: theme.text }]}>
          {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
        </Text>
      </View>
      
      <View style={[styles.infoContainer, { borderLeftColor: theme.border }]}>
        <Text 
          style={[
            styles.classText, 
            { 
              color: theme.text,
              textDecorationLine: isCancelled ? 'line-through' : 'none' 
            }
          ]}
        >
          {classItem.su[0].name} {isCancelled ? '(Cancelled)' : ''}
        </Text>
        <Text style={[styles.detailText, { color: theme.subtext }]}>
          {classItem.ro ? classItem.ro[0].name : 'No Room'} • 
          {classItem.te ? classItem.te[0].name : 'No Teacher'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    borderLeftWidth: 5,
  },
  timeContainer: {
    padding: 15,
    justifyContent: 'center',
    width: 80,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoContainer: {
    flex: 1,
    padding: 15,
    borderLeftWidth: 1,
  },
  classText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
  },
  detailText: {
    fontSize: 14,
  },
});

export default ClassCard;
