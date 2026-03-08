// src/utils/authSync.js
// Production version - minimal logging

class AuthSyncManager {
  constructor() {
    this.channel = null;
    this.listeners = new Set();
    this.isProcessing = false;
    this.lastCookie = '';
    this.init();
  }

  init() {
    // Initialize BroadcastChannel
    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('auth-sync-channel');
      this.channel.onmessage = (event) => this.handleMessage(event.data);
    }

    // Storage event listener
    window.addEventListener('storage', this.handleStorageEvent);
    
    // Start cookie watcher
    this.startCookieWatcher();
  }

  /**
   * Cookie watcher - Checks every 200ms if session cookie changed
   * When it changes = someone logged in/out in another tab
   * Solution: Force page reload to show correct user
   */
  startCookieWatcher() {
    this.lastCookie = document.cookie;
    
    setInterval(() => {
      const currentCookie = document.cookie;
      
      if (currentCookie !== this.lastCookie) {
        this.lastCookie = currentCookie;
        
        // Force page reload to show new user data
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }, 200);
  }

  broadcast(type, data = {}, notifyCurrentTab = false) {
    const message = {
      type,
      data,
      timestamp: Date.now(),
      tabId: this.getTabId()
    };

    // BroadcastChannel
    if (this.channel) {
      this.channel.postMessage(message);
    }

    // localStorage
    const key = 'auth_sync_event';
    localStorage.setItem(key, JSON.stringify(message));
    setTimeout(() => localStorage.removeItem(key), 500);

    // Notify current tab if requested
    if (notifyCurrentTab) {
      this.notifyListeners(message);
    }
  }

  getTabId() {
    if (!window.__tabId) {
      window.__tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return window.__tabId;
  }

  handleMessage = (message) => {
    if (message.tabId === this.getTabId()) {
      return;
    }
    this.notifyListeners(message);
  }

  handleStorageEvent = (event) => {
    if (event.key === 'auth_sync_event' && event.newValue) {
      try {
        const message = JSON.parse(event.newValue);
        if (message.tabId === this.getTabId()) {
          return;
        }
        this.notifyListeners(message);
      } catch (e) {
        // Silent fail - parsing error
      }
    }
  }

  notifyListeners(message) {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    this.listeners.forEach(callback => {
      try {
        callback(message);
      } catch (e) {
        // Silent fail - listener error
      }
    });

    setTimeout(() => {
      this.isProcessing = false;
    }, 100);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  destroy() {
    if (this.channel) {
      this.channel.close();
    }
    window.removeEventListener('storage', this.handleStorageEvent);
    this.listeners.clear();
  }
}

export const authSync = new AuthSyncManager();