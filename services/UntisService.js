// services/UntisService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class UntisService {
  constructor() {
    this.baseURL = 'https://webuntis.com/WebUntis/jsonrpc.do';
    this.client = null;
    this.sessionInfo = null;
  }

  async searchSchools(query) {
    try {
      const response = await axios.get('https://mobile.webuntis.com/WebUntis/schoolquery2.do', {
        params: {
          search: query,
          client: 'ReactNativeApp'
        }
      });
      
      return response.data.schools.map(school => ({
        id: school.id,
        name: school.displayName,
        city: school.city,
        serverUrl: school.server
      }));
    } catch (error) {
      throw new Error('Failed to search schools');
    }
  }

  async initialize(schoolInfo, username, password) {
    this.client = axios.create({
      baseURL: schoolInfo.serverUrl,
      params: { school: schoolInfo.schoolId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return this.login(username, password);
  }

  async login(username, password) {
    try {
      console.log(this.client)

      const response = await this.client.post('', {
        id: 'unique-id',
        method: 'authenticate',
        params: {
          user: username,
          password: password,
          client: 'ReactNativeApp'
        },
        jsonrpc: '2.0'
      });
      
      if (response.data.result && response.data.result.sessionId) {
        this.sessionInfo = response.data.result;
        await AsyncStorage.setItem('sessionInfo', JSON.stringify(this.sessionInfo));
        
        // Save credentials (encrypted in a real app)
        await AsyncStorage.setItem('credentials', JSON.stringify({
          school: this.client.defaults.params.school,
          username,
          password
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  async getTimeTable(startDate, endDate, classId) {
    if (!this.sessionInfo) {
      const storedSession = await AsyncStorage.getItem('sessionInfo');
      if (storedSession) {
        this.sessionInfo = JSON.parse(storedSession);
      } else {
        // Try to auto login if credentials are saved
        const credentials = await AsyncStorage.getItem('credentials');
        if (credentials) {
          const { school, username, password } = JSON.parse(credentials);
          await this.initialize(school, username, password);
        } else {
          throw new Error('Not authenticated');
        }
      }
    }

    try {
      const elementType = classId ? 1 : 5; // 1 for class, 5 for student
      const elementId = classId || this.sessionInfo.personId || this.sessionInfo.klasseId;
      
      const response = await this.client.post('', {
        id: 'unique-id',
        method: 'getTimetable',
        params: {
          options: {
            startDate: startDate,
            endDate: endDate,
            element: {
              id: elementId,
              type: elementType
            },
            showLsText: true,
            showStudentgroup: true,
            showInfo: true,
            showSubstText: true
          }
        },
        jsonrpc: '2.0'
      }, {
        headers: {
          'Cookie': `JSESSIONID=${this.sessionInfo.sessionId}`
        }
      });
      
      return response.data.result || [];
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Session expired, try to login again
        const credentials = await AsyncStorage.getItem('credentials');
        if (credentials) {
          const { school, username, password } = JSON.parse(credentials);
          const success = await this.initialize(school, username, password);
          if (success) {
            // Try the request again
            return this.getTimeTable(startDate, endDate, classId);
          }
        }
      }
      console.error('Failed to fetch timetable:', error);
      throw error;
    }
  }
  
  async getSubjects() {
    if (!this.sessionInfo) {
      const storedSession = await AsyncStorage.getItem('sessionInfo');
      if (storedSession) {
        this.sessionInfo = JSON.parse(storedSession);
      } else {
        throw new Error('Not authenticated');
      }
    }

    try {
      const response = await this.client.post('', {
        id: 'unique-id',
        method: 'getSubjects',
        params: {},
        jsonrpc: '2.0'
      }, {
        headers: {
          'Cookie': `JSESSIONID=${this.sessionInfo.sessionId}`
        }
      });
      
      return response.data.result || [];
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      throw error;
    }
  }
  
  async logout() {
    try {
      if (this.sessionInfo && this.sessionInfo.sessionId) {
        await this.client.post('', {
          id: 'unique-id',
          method: 'logout',
          params: {},
          jsonrpc: '2.0'
        }, {
          headers: {
            'Cookie': `JSESSIONID=${this.sessionInfo.sessionId}`
          }
        });
      }
      
      // Clear stored data
      this.sessionInfo = null;
      await AsyncStorage.removeItem('sessionInfo');
      
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }
}

export default new UntisService();
