// context/ScheduleContext.js
import React, { createContext, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ScheduleContext = createContext();

export const useSchedule = () => useContext(ScheduleContext);

export const ScheduleProvider = ({ children }) => {
  const [schedule, setSchedule] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [classColors, setClassColors] = useState({});
  
  const saveFilters = async (filters) => {
    setFilteredClasses(filters);
    await AsyncStorage.setItem('filteredClasses', JSON.stringify(filters));
  };
  
  const saveColors = async (colors) => {
    setClassColors(colors);
    await AsyncStorage.setItem('classColors', JSON.stringify(colors));
  };
  
  const loadPreferences = async () => {
    try {
      const storedFilters = await AsyncStorage.getItem('filteredClasses');
      const storedColors = await AsyncStorage.getItem('classColors');
      
      if (storedFilters) setFilteredClasses(JSON.parse(storedFilters));
      if (storedColors) setClassColors(JSON.parse(storedColors));
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };
  
  return (
    <ScheduleContext.Provider 
      value={{
        schedule,
        setSchedule,
        filteredClasses,
        saveFilters,
        classColors,
        saveColors,
        loadPreferences
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};
