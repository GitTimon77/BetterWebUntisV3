// services/NotificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.notificationsEnabled = true;
  }
  
  async initialize() {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }
      
      await this.loadPreferences();
      return true;
    }
    
    return false;
  }
  
  async loadPreferences() {
    try {
      const preferences = await AsyncStorage.getItem('notificationPreferences');
      if (preferences) {
        const { enabled } = JSON.parse(preferences);
        this.notificationsEnabled = enabled;
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }
  
  async savePreferences(enabled) {
    try {
      this.notificationsEnabled = enabled;
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify({ enabled }));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }
  
  async scheduleClassReminder(classItem, minutesBefore = 15) {
    if (!this.notificationsEnabled) return;
    
    try {
      const className = classItem.su[0].name;
      const startTime = classItem.startTime.toString();
      const hours = startTime.length === 3 ? parseInt(startTime.substring(0, 1)) : parseInt(startTime.substring(0, 2));
      const minutes = startTime.length === 3 ? parseInt(startTime.substring(1, 3)) : parseInt(startTime.substring(2, 4));
      
      const classDate = new Date(
        classItem.date.toString().substring(0, 4),
        parseInt(classItem.date.toString().substring(4, 6)) - 1,
        classItem.date.toString().substring(6, 8),
        hours,
        minutes
      );
      
      // Set notification time to 15 minutes before the class
      const notificationTime = new Date(classDate);
      notificationTime.setMinutes(notificationTime.getMinutes() - minutesBefore);
      
      // Don't schedule if the time is in the past
      if (notificationTime <= new Date()) return;
      
      const uniqueId = `${classItem.date}${classItem.startTime}${className}`;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Class reminder: ${className}`,
          body: `Your class starts in ${minutesBefore} minutes`,
          data: { classItem },
        },
        trigger: notificationTime,
        identifier: uniqueId,
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }
  
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
  
  async scheduleClassNotifications(schedule) {
    if (!this.notificationsEnabled) return;
    
    // First cancel any existing notifications
    await this.cancelAllNotifications();
    
    // Schedule new notifications
    for (const classItem of schedule) {
      await this.scheduleClassReminder(classItem);
    }
  }
}

export default new NotificationService();
