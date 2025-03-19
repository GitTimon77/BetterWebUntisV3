// screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  FlatList, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSchedule } from '../context/ScheduleContext';
import UntisService from '../services/UntisService';
import ColorPicker from 'react-native-wheel-color-picker';

const SettingsScreen = ({ navigation }) => {
  const { 
    filteredClasses, 
    saveFilters, 
    classColors, 
    saveColors, 
    loadPreferences 
  } = useSchedule();
  
  // State variables
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  
  // App settings
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // minutes
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [showCancelledClasses, setShowCancelledClasses] = useState(true);
  
  useEffect(() => {
    loadPreferences();
    fetchAllClasses();
    loadAppSettings();
  }, []);
  
  const loadAppSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setDarkMode(parsedSettings.darkMode || false);
        setNotificationsEnabled(parsedSettings.notificationsEnabled || true);
        setAutoRefresh(parsedSettings.autoRefresh || true);
        setRefreshInterval(parsedSettings.refreshInterval || 30);
        setCacheEnabled(parsedSettings.cacheEnabled || true);
        setShowCancelledClasses(parsedSettings.showCancelledClasses || true);
      }
    } catch (error) {
      console.error('Failed to load app settings:', error);
    }
  };
  
  const saveAppSettings = async () => {
    try {
      const settings = {
        darkMode,
        notificationsEnabled,
        autoRefresh,
        refreshInterval,
        cacheEnabled,
        showCancelledClasses
      };
      await AsyncStorage.setItem('appSettings', JSON.stringify(settings));
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Failed to save app settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };
  
  const fetchAllClasses = async () => {
    setLoading(true);
    try {
      // Get the current date
      const today = new Date();
      const startDate = formatDate(today);
      const endDate = formatDate(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000));
      
      const data = await UntisService.getTimeTable(startDate, endDate);
      
      // Extract unique class names
      const uniqueClasses = new Set();
      data.forEach(item => {
        if (item.su && item.su.length > 0) {
          uniqueClasses.add(item.su[0].name);
        }
      });
      
      const classes = Array.from(uniqueClasses).sort();
      setAllClasses(classes);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      Alert.alert('Error', 'Failed to load classes. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };
  
  const toggleClassFilter = (className) => {
    const newFilters = filteredClasses.includes(className)
      ? filteredClasses.filter(c => c !== className)
      : [...filteredClasses, className];
    
    saveFilters(newFilters);
  };
  
  const openColorPicker = (className) => {
    setSelectedClass(className);
    setSelectedColor(classColors[className] || '#ffffff');
    setColorPickerVisible(true);
  };
  
  const saveClassColor = () => {
    if (selectedClass) {
      const newColors = { ...classColors, [selectedClass]: selectedColor };
      saveColors(newColors);
      setColorPickerVisible(false);
      setSelectedClass(null);
    }
  };
  
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear stored credentials and session
              await AsyncStorage.removeItem('sessionInfo');
              await AsyncStorage.removeItem('credentials');
              
              // Redirect to login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Keep credentials but clear cached schedule data
              await AsyncStorage.removeItem('cachedSchedule');
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              console.error('Failed to clear cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  const renderClassItem = ({ item }) => {
    const isFiltered = filteredClasses.includes(item);
    const color = classColors[item] || '#e0e0e0';
    
    return (
      <View style={[styles.classItem, darkMode && styles.darkItem]}>
        <View style={[styles.colorIndicator, { backgroundColor: color }]} />
        <Text style={[styles.className, darkMode && styles.darkText]}>{item}</Text>
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.colorButton}
            onPress={() => openColorPicker(item)}
          >
            <Text style={styles.colorButtonText}>Color</Text>
          </TouchableOpacity>
          <Switch
            value={!isFiltered}
            onValueChange={() => toggleClassFilter(item)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
          />
        </View>
      </View>
    );
  };
  
  const renderSetting = (title, value, onToggle, description) => (
    <View style={[styles.settingItem, darkMode && styles.darkItem]}>
      <View>
        <Text style={[styles.settingTitle, darkMode && styles.darkText]}>{title}</Text>
        {description && (
          <Text style={[styles.settingDescription, darkMode && styles.darkSubtext]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: '#81b0ff' }}
      />
    </View>
  );
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, darkMode && styles.darkBackground]}>
        <ActivityIndicator size="large" color={darkMode ? '#81b0ff' : '#2196F3'} />
        <Text style={[styles.loadingText, darkMode && styles.darkText]}>
          Loading settings...
        </Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={[styles.container, darkMode && styles.darkBackground]}>
      {/* General Settings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
          General Settings
        </Text>
        
        {renderSetting(
          'Dark Mode',
          darkMode,
          setDarkMode,
          'Enable dark theme throughout the app'
        )}
        
        {renderSetting(
          'Notifications',
          notificationsEnabled,
          setNotificationsEnabled,
          'Get notified about schedule changes'
        )}
        
        {renderSetting(
          'Auto Refresh',
          autoRefresh,
          setAutoRefresh,
          `Automatically refresh schedule every ${refreshInterval} minutes`
        )}
        
        {renderSetting(
          'Enable Caching',
          cacheEnabled,
          setCacheEnabled,
          'Store schedule data for offline access'
        )}
        
        {renderSetting(
          'Show Cancelled Classes',
          showCancelledClasses,
          setShowCancelledClasses,
          'Display cancelled classes in the schedule'
        )}
      </View>
      
      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
          Data Management
        </Text>
        
        <TouchableOpacity
          style={[styles.button, styles.dataButton]}
          onPress={clearCache}
        >
          <Text style={styles.buttonText}>Clear Cache</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={fetchAllClasses}
        >
          <Text style={styles.buttonText}>Refresh Class List</Text>
        </TouchableOpacity>
      </View>
      
      {/* Class Filters Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
          Class Filters
        </Text>
        <Text style={[styles.sectionDescription, darkMode && styles.darkSubtext]}>
          Toggle classes to show or hide them in your schedule.
          Customize colors to personalize your view.
        </Text>
        
        <FlatList
          data={allClasses}
          renderItem={renderClassItem}
          keyExtractor={item => item}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
      
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
          Account
        </Text>
        
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* Save Button */}
      <TouchableOpacity
        style={[styles.button, styles.saveButton]}
        onPress={saveAppSettings}
      >
        <Text style={styles.buttonText}>Save Settings</Text>
      </TouchableOpacity>
      
      {/* Color Picker Modal */}
      <Modal
        visible={colorPickerVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.colorPickerContainer}>
            <Text style={styles.colorPickerTitle}>
              Choose color for {selectedClass}
            </Text>
            
            <ColorPicker
              color={selectedColor}
              onColorChange={setSelectedColor}
              thumbSize={30}
              sliderSize={30}
              noSnap={true}
              row={false}
              swatches={false}
              style={styles.colorPicker}
            />
            
            <View style={styles.colorPreview}>
              <Text style={styles.colorPreviewText}>Preview:</Text>
              <View 
                style={[
                  styles.colorPreviewBox, 
                  { backgroundColor: selectedColor }
                ]} 
              />
            </View>
            
            <View style={styles.colorPickerButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setColorPickerVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={saveClassColor}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
    marginHorizontal: 10,
    marginTop: 10,
  },
  darkItem: {
    backgroundColor: '#2a2a2a',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubtext: {
    color: '#aaaaaa',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },
  listContainer: {
    marginTop: 10,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  className: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 10,
  },
  colorButtonText: {
    fontSize: 12,
    color: '#333',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  logoutButton: {
    backgroundColor: '#F44336',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
  },
  dataButton: {
    backgroundColor: '#FF9800',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
    flex: 1,
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  colorPicker: {
    height: 200,
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  colorPreviewText: {
    fontSize: 16,
    marginRight: 10,
  },
  colorPreviewBox: {
    width: 50,
    height: 30,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  colorPickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

export default SettingsScreen;
