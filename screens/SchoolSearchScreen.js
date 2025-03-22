// screens/SchoolSearchScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import UntisService from '../services/UntisService';


const SchoolSearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.length > 2) {
        performSearch(searchQuery);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const results = await UntisService.searchSchools(query);
      setSearchResults(results);
    } catch (error) {
      setError('Failed to fetch schools. Please try again.');
      console.error('School search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // In SchoolSearchScreen.js
const cacheSchools = async (school) => {
    try {
      const recentSchools = await AsyncStorage.getItem('recentSchools') || '[]';
      const updatedSchools = [
        school,
        ...JSON.parse(recentSchools).filter(s => s.id !== school.id)
      ].slice(0, 5);
      
      await AsyncStorage.setItem('recentSchools', JSON.stringify(updatedSchools));
    } catch (error) {
      console.error('Failed to cache school:', error);
    }
  };
  
  // Update handleSchoolSelect
  const handleSchoolSelect = async (school) => {
    await cacheSchools(school);
    navigation.navigate('Login', school);
  };  

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for your school..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {loading && <ActivityIndicator size="large" style={styles.loader} />}
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.schoolItem}
            onPress={() => handleSchoolSelect(item)}
          >
            <Text style={styles.schoolName}>{item.name}</Text>
            <Text style={styles.schoolDetails}>
              {item.city} • {item.serverUrl}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && searchQuery.length > 2 && !error && (
            <Text style={styles.noResultsText}>No schools found</Text>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    height: 50,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  schoolItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  schoolDetails: {
    fontSize: 14,
    color: '#666',
  },
  loader: {
    marginVertical: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});

export default SchoolSearchScreen;
