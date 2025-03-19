// utils/dateUtils.js
export const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };
  
  export const formatDayTitle = (date) => {
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
  
  export const formatTime = (timeString) => {
    const str = timeString.toString();
    const hours = str.length === 3 ? str.substring(0, 1) : str.substring(0, 2);
    const minutes = str.length === 3 ? str.substring(1, 3) : str.substring(2, 4);
    return `${hours}:${minutes}`;
  };
  
  export const getStartOfWeek = (date) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - date.getDay());
    return newDate;
  };
  