import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
  deviceInfo: {
    isDevice: boolean;
    platform: string;
    deviceName?: string;
  };
}

class EnhancedDebugger {
  private logs: DebugLog[] = [];
  private maxLogs = 1000;
  private debugKey = 'jung_debug_logs';

  constructor() {
    this.loadStoredLogs();
  }

  private async loadStoredLogs() {
    try {
      const stored = await AsyncStorage.getItem(this.debugKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load debug logs:', error);
    }
  }

  private async saveLogs() {
    try {
      // Keep only recent logs
      const recentLogs = this.logs.slice(-this.maxLogs);
      await AsyncStorage.setItem(this.debugKey, JSON.stringify(recentLogs));
      this.logs = recentLogs;
    } catch (error) {
      console.error('Failed to save debug logs:', error);
    }
  }

  private addLog(level: 'info' | 'warn' | 'error', category: string, message: string, data?: any) {
    const log: DebugLog = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      deviceInfo: {
        isDevice: Constants.isDevice,
        platform: Platform.OS,
        deviceName: Constants.deviceName
      }
    };

    this.logs.push(log);

    // Console log with emoji for easy filtering
    const emoji = level === 'error' ? '🚨' : level === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [${category}] ${message}`, data || '');

    // Save periodically
    if (this.logs.length % 10 === 0) {
      this.saveLogs();
    }
  }

  // Supabase-specific debugging
  supabaseError(operation: string, error: any, context?: any) {
    this.addLog('error', 'supabase', `${operation} failed`, {
      error: error?.message || error,
      code: error?.code,
      details: error?.details,
      context
    });
  }

  supabaseSuccess(operation: string, data?: any) {
    this.addLog('info', 'supabase', `${operation} succeeded`, data);
  }

  // Authentication debugging
  authAttempt(method: string, details?: any) {
    this.addLog('info', 'auth', `Attempting ${method} authentication`, details);
  }

  authSuccess(method: string, userId?: string) {
    this.addLog('info', 'auth', `${method} authentication successful`, { userId });
  }

  authFailure(method: string, error: any) {
    this.addLog('error', 'auth', `${method} authentication failed`, {
      error: error?.message || error,
      code: error?.code
    });
  }

  // Environment debugging
  environmentCheck(results: Record<string, boolean>) {
    const missing = Object.entries(results)
      .filter(([_, present]) => !present)
      .map(([key]) => key);

    if (missing.length > 0) {
      this.addLog('error', 'environment', 'Missing environment variables', { missing });
    } else {
      this.addLog('info', 'environment', 'All environment variables present');
    }
  }

  // Storage debugging
  storageOperation(operation: string, key: string, success: boolean, error?: any) {
    if (success) {
      this.addLog('info', 'storage', `${operation} ${key} succeeded`);
    } else {
      this.addLog('error', 'storage', `${operation} ${key} failed`, { error: error?.message });
    }
  }

  // Network debugging
  networkRequest(url: string, method: string, success: boolean, responseTime?: number, error?: any) {
    this.addLog(success ? 'info' : 'error', 'network', `${method} ${url}`, {
      success,
      responseTime,
      error: error?.message
    });
  }

  // Get logs for analysis
  async getLogs(category?: string, level?: 'info' | 'warn' | 'error', limit?: number): Promise<DebugLog[]> {
    await this.loadStoredLogs();

    let filtered = this.logs;

    if (category) {
      filtered = filtered.filter(log => log.category === category);
    }

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered.reverse(); // Most recent first
  }

  // Export logs for sharing
  async exportLogs(): Promise<string> {
    await this.loadStoredLogs();

    const summary = {
      deviceInfo: {
        isDevice: Constants.isDevice,
        platform: Platform.OS,
        deviceName: Constants.deviceName,
        appVersion: Constants.expoConfig?.version
      },
      logCount: this.logs.length,
      recentErrors: this.logs
        .filter(log => log.level === 'error')
        .slice(-20)
        .map(log => ({
          timestamp: log.timestamp,
          category: log.category,
          message: log.message,
          error: log.data?.error
        })),
      authEvents: this.logs
        .filter(log => log.category === 'auth')
        .slice(-10),
      supabaseEvents: this.logs
        .filter(log => log.category === 'supabase')
        .slice(-10)
    };

    return JSON.stringify(summary, null, 2);
  }

  // Clear logs
  async clearLogs() {
    this.logs = [];
    await AsyncStorage.removeItem(this.debugKey);
    console.log('🧹 Debug logs cleared');
  }

  // Performance timing
  startTiming(operation: string) {
    const start = Date.now();
    return {
      end: (success: boolean, error?: any) => {
        const duration = Date.now() - start;
        this.addLog(success ? 'info' : 'error', 'performance', `${operation} took ${duration}ms`, {
          duration,
          success,
          error: error?.message
        });
      }
    };
  }
}

// Global logger instance
export const appLogger = new EnhancedDebugger();

// Convenience functions
export const logSupabaseError = (operation: string, error: any, context?: any) => {
  appLogger.supabaseError(operation, error, context);
};

export const logSupabaseSuccess = (operation: string, data?: any) => {
  appLogger.supabaseSuccess(operation, data);
};

export const logAuthEvent = (method: string, success: boolean, details?: any) => {
  if (success) {
    appLogger.authSuccess(method, details?.userId);
  } else {
    appLogger.authFailure(method, details?.error || details);
  }
};

export default appLogger;