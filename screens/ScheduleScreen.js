// screens/ScheduleScreen.js
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SectionList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSchedule } from '../context/ScheduleContext';
import UntisService from '../services/UntisService';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ScheduleScreen = () => {
  const { schedule, setSchedule, filteredClasses, classColors, loadPreferences } = useSchedule();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);
  const [organizedSchedule, setOrganizedSchedule] = useState([]);
  
  useEffect(() => {
    loadPreferences();
    loadAppSettings();
    fetchSchedule();
  }, []);
  
  useEffect(() => {
    organizeScheduleByDay();
  }, [schedule, filteredClasses, currentDate]);
  
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
    setLoading(true);
    try {
      // Calculate the start of the week (Sunday)
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      // Calculate end of week (Saturday of the next week)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 13); // Two weeks
      
      const startDate = formatDate(startOfWeek);
      const endDate = formatDate(endOfWeek);
      
      const data = await UntisService.getTimeTable(startDate, endDate);
      setSchedule(data);
      
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
        }
      } catch (cacheError) {
        console.error('Failed to load cached data:', cacheError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
  };
  
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };
  
  const organizeScheduleByDay = () => {
    if (schedule.length === 0) return;
    
    // Get start of the week for current date
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    // Filter out classes based on user preferences
    const filtered = filteredClasses.length > 0 
      ? schedule.filter(item => !filteredClasses.includes(item.su[0].name))
      : schedule;
    
    // Create an array for each day of the week
    const dayData = [];
    for (let i = 0; i < 14; i++) { // Two weeks
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dayFormatted = formatDate(day);
      
      // Filter classes for this day
      const dayClasses = filtered.filter(item => {
        return item.date.toString() === dayFormatted;
      });
      
      // Sort by start time
      dayClasses.sort((a, b) => a.startTime - b.startTime);
      
      if (dayClasses.length > 0 || i < 7) { // Always include first week
        dayData.push({
          title: formatDayTitle(day),
          data: dayClasses,
          date: day,
        });
      }
    }
    
    setOrganizedSchedule(dayData);
  };
  
  const formatDayTitle = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    
    // Check if this is today
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && 
                    date.getMonth() === today.getMonth() && 
                    date.getFullYear() === today.getFullYear();
    
    return `${dayName}, ${monthName} ${day}${isToday ? ' (Today)' : ''}`;
  };
  
  const formatTime = (timeString) => {
    const str = timeString.toString();
    const hours = str.length === 3 ? str.substring(0, 1) : str.substring(0, 2);
    const minutes = str.length === 3 ? str.substring(1, 3) : str.substring(2, 4);
    return `${hours}:${minutes}`;
  };
  
  const getClassColor = (className) => {
    return classColors[className] || '#e0e0e0';
  };
  
  const renderClassItem = ({ item }) => {
    if (!item.su || item.su.length === 0) return null;
    
    const className = item.su[0].name;
    const startTime = formatTime(item.startTime);
    const endTime = formatTime(item.endTime);
    const room = item.ro ? item.ro[0].name : 'No Room';
    const isCancelled = item.code === 'cancelled';
    const teacher = item.te ? item.te[0].name : 'No Teacher';
    
    return (
      <View 
        style={[
          styles.classCard, 
          { borderLeftColor: getClassColor(className) },
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
          <Text style={[styles.detailText, darkMode && styles.darkSubtext]}>
            {room} • {teacher}
          </Text>
        </View>
      </View>
    );
  };
  
  const renderSectionHeader = ({ section }) => (
    <View style={[styles.sectionHeader, darkMode && styles.darkSectionHeader]}>
      <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
        {section.title}
      </Text>
    </View>
  );
  
  const renderEmptyDay = () => (
    <View style={styles.emptyDayContainer}>
      <Icon name="event-busy" size={40} color={darkMode ? '#aaa' : '#ccc'} />
      <Text style={[styles.emptyDayText, darkMode && styles.darkSubtext]}>
        No classes scheduled for this day
      </Text>
    </View>
  );
  
  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
    fetchSchedule();
  };
  
  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, darkMode && styles.darkBackground]}>
        <ActivityIndicator size="large" color={darkMode ? '#81b0ff' : '#2196F3'} />
        <Text style={[styles.loadingText, darkMode && styles.darkText]}>
          Loading schedule...
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, darkMode && styles.darkBackground]}>
      <View style={[styles.navigationBar, darkMode && styles.darkNavBar]}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateWeek(-1)}
        >
          <Icon name="chevron-left" size={26} color={darkMode ? '#fff' : '#2196F3'} />
          <Text style={[styles.navButtonText, darkMode && styles.darkText]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.todayButton} onPress={() => {
          setCurrentDate(new Date());
          fetchSchedule();
        }}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateWeek(1)}
        >
          <Text style={[styles.navButtonText, darkMode && styles.darkText]}>
            Next
          </Text>
          <Icon name="chevron-right" size={26} color={darkMode ? '#fff' : '#2196F3'} />
        </TouchableOpacity>
      </View>
      
      <SectionList
        sections={organizedSchedule}
        renderItem={renderClassItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor={darkMode ? '#81b0ff' : '#2196F3'}
          />
        }
        renderSectionFooter={({ section }) => {
          return section.data.length === 0 ? renderEmptyDay() : null;
        }}
      />
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
  darkNavBar: {
    backgroundColor: '#1e1e1e',
    borderBottomColor: '#333',
  },
  darkSectionHeader: {
    backgroundColor: '#1e1e1e',
  },
  darkCard: {
    backgroundColor: '#2a2a2a',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubtext: {
    color: '#aaaaaa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  navButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
  todayButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  todayButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 20,
  },
  sectionHeader: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  classCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
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
  cancelledClass: {
    opacity: 0.7,
    backgroundColor: '#ffebee',
  },
  cancelledText: {
    textDecorationLine: 'line-through',
  },
  classTimeContainer: {
    padding: 15,
    justifyContent: 'center',
    width: 80,
  },
  classTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  classInfoContainer: {
    flex: 1,
    padding: 15,
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
  },
  className: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  detailText: {
    fontSize: 14,
    color: '#777',
  },
  emptyDayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0,0,0,0.02)',
    marginHorizontal: 10,
    marginTop: 4,
    marginBottom: 10,
    borderRadius: 8,
  },
  emptyDayText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
});

export default ScheduleScreen;
