// screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSchedule } from '../context/ScheduleContext';
import UntisService from '../services/UntisService';
import Icon from 'react-native-vector-icons/MaterialIcons';

const HomeScreen = ({ navigation }) => {
  const { setSchedule, loadPreferences } = useSchedule();
  const [refreshing, setRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userName, setUserName] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  
  useEffect(() => {
    loadUserInfo();
    loadPreferences();
    fetchSchedule();
    
    const focusListener = navigation.addListener('focus', () => {
      loadAppSettings();
    });
    
    return () => {
      focusListener();
    };
  }, [navigation]);
  
  const loadUserInfo = async () => {
    try {
      const sessionInfo = await AsyncStorage.getItem('sessionInfo');
      if (sessionInfo) {
        const parsedInfo = JSON.parse(sessionInfo);
        setUserName(parsedInfo.userName || 'User');
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };
  
  const loadAppSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setDarkMode(parsedSettings.darkMode || false);
      }
    } catch (error) {
      console.error('Failed to load app settings:', error);
    }
  };
  
  const fetchSchedule = async () => {
    setRefreshing(true);
    try {
      // Format dates for current week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 14);
      
      const startDate = formatDate(startOfWeek);
      const endDate = formatDate(endOfWeek);
      
      const data = await UntisService.getTimeTable(startDate, endDate);
      setSchedule(data);
      
      // Save last update time
      const now = new Date();
      setLastUpdate(now);
      await AsyncStorage.setItem('lastUpdate', now.toISOString());
      
      // Get today's classes
      const todayFormatted = formatDate(today);
      const todayClasses = data.filter(item => {
        const itemDate = item.date.toString();
        return itemDate === todayFormatted;
      });
      
      setTodayClasses(todayClasses);
      
      // Cache the schedule data
      await AsyncStorage.setItem('cachedSchedule', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      
      // Try to use cached data if available
      try {
        const cachedData = await AsyncStorage.getItem('cachedSchedule');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setSchedule(parsedData);
          Alert.alert(
            'Offline Mode',
            'Could not connect to server. Using cached data.'
          );
        } else {
          Alert.alert(
            'Error',
            'Failed to fetch schedule and no cached data available.'
          );
        }
      } catch (cacheError) {
        console.error('Failed to load cached data:', cacheError);
      }
    } finally {
      setRefreshing(false);
    }
  };
  
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };
  
  const formatTime = (timeString) => {
    // Convert Untis time format (e.g., 800 for 8:00) to readable format
    const str = timeString.toString();
    const hours = str.length === 3 ? str.substring(0, 1) : str.substring(0, 2);
    const minutes = str.length === 3 ? str.substring(1, 3) : str.substring(2, 4);
    return `${hours}:${minutes}`;
  };
  
  const renderTodayClasses = () => {
    if (todayClasses.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="event-busy" size={50} color={darkMode ? '#aaa' : '#777'} />
          <Text style={[styles.emptyText, darkMode && styles.darkText]}>
            No classes scheduled for today
          </Text>
        </View>
      );
    }
    
    // Sort classes by start time
    const sortedClasses = [...todayClasses].sort((a, b) => a.startTime - b.startTime);
    
    return sortedClasses.map((item, index) => {
      const className = item.su[0].name;
      const startTime = formatTime(item.startTime);
      const endTime = formatTime(item.endTime);
      const room = item.ro ? item.ro[0].name : 'No Room';
      const isCancelled = item.code === 'cancelled';
      
      return (
        <View 
          key={index} 
          style={[
            styles.classCard, 
            darkMode && styles.darkCard,
            isCancelled && styles.cancelledClass
          ]}
        >
          <View style={styles.classTimeContainer}>
            <Text style={[styles.classTime, darkMode && styles.darkText]}>
              {startTime} - {endTime}
            </Text>
          </View>
          <View style={styles.classInfoContainer}>
            <Text 
              style={[
                styles.className, 
                darkMode && styles.darkText,
                isCancelled && styles.cancelledText
              ]}
            >
              {className} {isCancelled && '(Cancelled)'}
            </Text>
            <Text style={[styles.roomText, darkMode && styles.darkSubtext]}>
              {room}
            </Text>
          </View>
        </View>
      );
    });
  };
  
  return (
    <View style={[styles.container, darkMode && styles.darkBackground]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchSchedule}
            colors={['#2196F3']}
            tintColor={darkMode ? '#81b0ff' : '#2196F3'}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, darkMode && styles.darkText]}>
              Hello, {userName}!
            </Text>
            <Text style={[styles.subtitle, darkMode && styles.darkSubtext]}>
              {lastUpdate 
                ? `Last updated: ${lastUpdate.toLocaleString()}` 
                : 'Pull down to refresh'}
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
            Today's Schedule
          </Text>
          <View style={styles.classesContainer}>
            {renderTodayClasses()}
          </View>
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.scheduleButton]}
            onPress={() => navigation.navigate('Schedule')}
          >
            <Icon name="calendar-today" size={24} color="#fff" />
            <Text style={styles.buttonText}>View Full Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.settingsButton]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="settings" size={24} color="#fff" />
            <Text style={styles.buttonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkBackground: {
    backgroundColor: '#121212',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubtext: {
    color: '#aaaaaa',
  },
  darkCard: {
    backgroundColor: '#2a2a2a',
  },
  header: {
    padding: 20,
    marginTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  classesContainer: {
    marginTop: 10,
  },
  classCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    overflow: 'hidden',
  },
  cancelledClass: {
    opacity: 0.7,
    backgroundColor: '#ffebee',
  },
  cancelledText: {
    textDecorationLine: 'line-through',
  },
  classTimeContainer: {
    backgroundColor: '#2196F3',
    padding: 12,
    justifyContent: 'center',
    width: 85,
  },
  classTime: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  classInfoContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  className: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  roomText: {
    fontSize: 14,
    color: '#777',
    marginTop: 3,
  },
  buttonsContainer: {
    padding: 15,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  scheduleButton: {
    backgroundColor: '#2196F3',
  },
  settingsButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default HomeScreen;
