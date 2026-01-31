/**
 * Visitor Tracker
 * Tracks unique visitors and their approximate locations
 * Uses localStorage for persistence and a free IP geolocation API
 */

const VisitorTracker = {
  STORAGE_KEY: 'visitor_tracker_data',
  
  /**
   * Initialize the tracker
   */
  init: async function() {
    const visitorData = await this.trackVisitor();
    this.updateTrackerDisplay(visitorData);
    return visitorData;
  },

  /**
   * Track current visitor
   */
  trackVisitor: async function() {
    let data = this.getData();
    
    // Check if this is a unique visitor (using fingerprint)
    const fingerprint = this.generateFingerprint();
    const existingVisitor = data.visitors.find(v => v.fingerprint === fingerprint);
    
    if (!existingVisitor) {
      // Get location data
      const location = await this.getLocation();
      
      const visitor = {
        fingerprint: fingerprint,
        timestamp: new Date().toISOString(),
        location: location
      };
      
      data.visitors.push(visitor);
      data.totalVisits++;
      data.uniqueVisitors = data.visitors.length;
      
      this.saveData(data);
    } else {
      // Update last visit time for returning visitor
      existingVisitor.lastVisit = new Date().toISOString();
      data.totalVisits++;
      this.saveData(data);
    }
    
    return data;
  },

  /**
   * Generate a simple browser fingerprint
   */
  generateFingerprint: function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  },

  /**
   * Get visitor location using free IP geolocation API
   */
  getLocation: async function() {
    try {
      // Using ipapi.co free tier
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        return {
          city: data.city || 'Unknown',
          region: data.region || '',
          country: data.country_name || 'Unknown',
          countryCode: data.country_code || '',
          lat: data.latitude || 0,
          lon: data.longitude || 0
        };
      }
    } catch (error) {
      console.log('Location lookup failed, using default');
    }
    
    // Default/fallback location
    return {
      city: 'Unknown',
      region: '',
      country: 'Unknown',
      countryCode: '',
      lat: 0,
      lon: 0
    };
  },

  /**
   * Get stored data
   */
  getData: function() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.log('Error reading tracker data');
    }
    
    return {
      visitors: [],
      totalVisits: 0,
      uniqueVisitors: 0,
      createdAt: new Date().toISOString()
    };
  },

  /**
   * Save data to localStorage
   */
  saveData: function(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.log('Error saving tracker data');
    }
  },

  /**
   * Update the tracker display element
   */
  updateTrackerDisplay: function(data) {
    const dot = document.querySelector('.tracker-dot');
    if (dot) {
      dot.title = `${data.uniqueVisitors} unique visitors`;
    }
  },

  /**
   * Get all visitor locations for the globe
   */
  getVisitorLocations: function() {
    const data = this.getData();
    return data.visitors
      .filter(v => v.location && v.location.lat !== 0)
      .map(v => ({
        lat: v.location.lat,
        lon: v.location.lon,
        city: v.location.city,
        country: v.location.country,
        timestamp: v.timestamp
      }));
  },

  /**
   * Get statistics
   */
  getStats: function() {
    const data = this.getData();
    return {
      uniqueVisitors: data.uniqueVisitors,
      totalVisits: data.totalVisits,
      locations: this.getVisitorLocations().length
    };
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => VisitorTracker.init());
} else {
  VisitorTracker.init();
}
