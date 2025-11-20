import { sessionStorageHelper } from '../utils/storage';

class LocationService {
  constructor() {
    this.storageKey = 'vocalink_browser_location';
    this.location = this.loadFromStorage();
    this.pending = null;
    this.timeoutMs = 5000;
  }

  loadFromStorage() {
    try {
      if (!sessionStorageHelper.available) {
        return null;
      }
      const stored = sessionStorageHelper.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load cached location:', error);
      return null;
    }
  }

  saveToStorage(location) {
    try {
      if (!sessionStorageHelper.available) {
        return;
      }
      sessionStorageHelper.setItem(this.storageKey, JSON.stringify(location));
    } catch (error) {
      console.warn('Failed to cache location:', error);
    }
  }

  async captureLocation() {
    if (this.location) {
      return this.location;
    }

    if (this.pending) {
      return this.pending;
    }

    if (typeof navigator === 'undefined' || typeof navigator.geolocation === 'undefined') {
      return null;
    }

    this.pending = new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(null);
      }, this.timeoutMs);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timer);
          const coords = {
            latitude: Number(position.coords.latitude.toFixed(6)),
            longitude: Number(position.coords.longitude.toFixed(6)),
            accuracy: Number(position.coords.accuracy.toFixed(2)),
            timestamp: position.timestamp
          };
          this.location = coords;
          this.saveToStorage(coords);
          resolve(coords);
        },
        () => {
          clearTimeout(timer);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5 * 60 * 1000,
          timeout: this.timeoutMs,
        }
      );
    }).finally(() => {
      this.pending = null;
    });

    return this.pending;
  }

  getLocationHeader() {
    return this.location ? JSON.stringify(this.location) : null;
  }
}

export default new LocationService();
