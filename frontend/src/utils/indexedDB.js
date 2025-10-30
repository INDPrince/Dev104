/**
 * IndexedDB Storage System for Offline Data
 * Handles local storage of class data, user preferences, and download queue
 */

const DB_NAME = 'QuizMasterDB';
const DB_VERSION = 1;

// Object stores
const STORES = {
  CLASS_DATA: 'classData',
  USER_PREFS: 'userPreferences',
  DOWNLOAD_QUEUE: 'downloadQueue'
};

// Open database
export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('❌ IndexedDB error:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      console.log('✅ IndexedDB opened successfully');
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      console.log('🔧 Upgrading IndexedDB...');
      const db = event.target.result;
      
      // Create stores
      if (!db.objectStoreNames.contains(STORES.CLASS_DATA)) {
        db.createObjectStore(STORES.CLASS_DATA, { keyPath: 'classId' });
        console.log('✅ Created classData store');
      }
      
      if (!db.objectStoreNames.contains(STORES.USER_PREFS)) {
        db.createObjectStore(STORES.USER_PREFS, { keyPath: 'key' });
        console.log('✅ Created userPreferences store');
      }
      
      if (!db.objectStoreNames.contains(STORES.DOWNLOAD_QUEUE)) {
        db.createObjectStore(STORES.DOWNLOAD_QUEUE, { keyPath: 'id', autoIncrement: true });
        console.log('✅ Created downloadQueue store');
      }
    };
  });
};

// Save class data
export const saveClassData = async (classId, metadata, chunks) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.CLASS_DATA], 'readwrite');
    const store = transaction.objectStore(STORES.CLASS_DATA);
    
    const data = {
      classId,
      metadata,
      chunks,
      installedAt: Date.now()
    };
    
    await new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log(`✅ Saved ${classId} data to IndexedDB`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving class data:', error);
    throw error;
  }
};

// Get class data
export const getClassData = async (classId) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.CLASS_DATA], 'readonly');
    const store = transaction.objectStore(STORES.CLASS_DATA);
    
    return new Promise((resolve, reject) => {
      const request = store.get(classId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Error getting class data:', error);
    return null;
  }
};

// Check if class is installed
export const isClassInstalled = async (classId) => {
  try {
    const data = await getClassData(classId);
    return !!data;
  } catch (error) {
    console.error('❌ Error checking install status:', error);
    return false;
  }
};

// Get all installed classes
export const getInstalledClasses = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.CLASS_DATA], 'readonly');
    const store = transaction.objectStore(STORES.CLASS_DATA);
    
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Error getting installed classes:', error);
    return [];
  }
};

// Save user preference
export const savePreference = async (key, value) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.USER_PREFS], 'readwrite');
    const store = transaction.objectStore(STORES.USER_PREFS);
    
    await new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log(`✅ Saved preference: ${key}`, value);
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving preference:', error);
    throw error;
  }
};

// Get user preference
export const getPreference = async (key) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.USER_PREFS], 'readonly');
    const store = transaction.objectStore(STORES.USER_PREFS);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Error getting preference:', error);
    return null;
  }
};

// Delete class data
export const deleteClassData = async (classId) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.CLASS_DATA], 'readwrite');
    const store = transaction.objectStore(STORES.CLASS_DATA);
    
    await new Promise((resolve, reject) => {
      const request = store.delete(classId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log(`🗑️ Deleted ${classId} data from IndexedDB`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting class data:', error);
    throw error;
  }
};

// Get storage usage info
export const getStorageInfo = async () => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = quota > 0 ? ((usage / quota) * 100).toFixed(2) : 0;
      
      return {
        usage,
        quota,
        percentUsed,
        usageMB: (usage / (1024 * 1024)).toFixed(2),
        quotaMB: (quota / (1024 * 1024)).toFixed(2)
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting storage info:', error);
    return null;
  }
};

// Clear all data
export const clearAllData = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.CLASS_DATA, STORES.USER_PREFS], 'readwrite');
    
    await Promise.all([
      new Promise((resolve, reject) => {
        const request = transaction.objectStore(STORES.CLASS_DATA).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise((resolve, reject) => {
        const request = transaction.objectStore(STORES.USER_PREFS).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]);
    
    console.log('🗑️ Cleared all IndexedDB data');
    return { success: true };
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
};
