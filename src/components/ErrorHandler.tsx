import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import tw from '../lib/tailwind';
import { supabase } from '../lib/supabase';

export type ErrorType = 
  | 'network'
  | 'database'
  | 'realtime'
  | 'authentication'
  | 'permission'
  | 'storage'
  | 'api'
  | 'unknown';

export interface AppError {
  id: string;
  type: ErrorType;
  message: string;
  originalError?: any;
  timestamp: Date;
  context?: string;
  recoverable: boolean;
  userMessage: string;
  actionLabel?: string;
  action?: () => void;
}

interface ErrorHandlerProps {
  children: React.ReactNode;
}

interface ErrorBannerProps {
  error: AppError;
  onDismiss: () => void;
  onAction?: () => void;
}

// Error classification and user-friendly messaging
export const classifyError = (error: any, context?: string): AppError => {
  const timestamp = new Date();
  const id = `error_${timestamp.getTime()}`;
  
  let type: ErrorType = 'unknown';
  let userMessage = 'An unexpected error occurred. Please try again.';
  let recoverable = true;
  let actionLabel: string | undefined;
  let action: (() => void) | undefined;

  // Analyze error message and type
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('realtime') || lowerMessage.includes('channel_error')) {
    type = 'realtime';
    userMessage = 'Live updates are temporarily unavailable. Your messages will still be saved.';
    actionLabel = 'Continue Offline';
    recoverable = true;
  } else if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    type = 'network';
    userMessage = 'Network connection issue. Please check your internet connection.';
    actionLabel = 'Retry';
    recoverable = true;
  } else if (lowerMessage.includes('database') || lowerMessage.includes('postgres')) {
    type = 'database';
    userMessage = 'Database temporarily unavailable. Please try again in a moment.';
    actionLabel = 'Retry';
    recoverable = true;
  } else if (lowerMessage.includes('auth') || lowerMessage.includes('unauthorized')) {
    type = 'authentication';
    userMessage = 'Session expired. Please log in again.';
    actionLabel = 'Log In';
    recoverable = true;
    action = async () => {
      if (supabase) {
        await supabase.auth.signOut();
      }
    };
  } else if (lowerMessage.includes('permission') || lowerMessage.includes('forbidden')) {
    type = 'permission';
    userMessage = 'Permission denied. Please check your account settings.';
    actionLabel = 'Contact Support';
    recoverable = false;
  } else if (lowerMessage.includes('storage') || lowerMessage.includes('bucket')) {
    type = 'storage';
    userMessage = 'File storage temporarily unavailable. Please try again later.';
    actionLabel = 'Retry';
    recoverable = true;
  } else if (lowerMessage.includes('api') || lowerMessage.includes('openai')) {
    type = 'api';
    userMessage = 'AI service temporarily unavailable. Please try again in a moment.';
    actionLabel = 'Retry';
    recoverable = true;
  }

  return {
    id,
    type,
    message: errorMessage,
    originalError: error,
    timestamp,
    context,
    recoverable,
    userMessage,
    actionLabel,
    action
  };
};

// Error Banner Component
const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onDismiss, onAction }) => {
  const getErrorIcon = (type: ErrorType) => {
    switch (type) {
      case 'network':
        return 'CloudLightning';
      case 'database':
      case 'realtime':
        return 'FloppyDisk';
      case 'authentication':
        return 'User';
      case 'permission':
        return 'User';
      case 'storage':
        return 'FloppyDisk';
      case 'api':
        return 'Brain';
      default:
        return 'X';
    }
  };

  const getErrorColor = (type: ErrorType) => {
    switch (type) {
      case 'realtime':
        return 'bg-yellow-100 border-yellow-300';
      case 'network':
      case 'database':
      case 'api':
        return 'bg-orange-100 border-orange-300';
      case 'authentication':
      case 'permission':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getTextColor = (type: ErrorType) => {
    switch (type) {
      case 'realtime':
        return 'text-yellow-800';
      case 'network':
      case 'database':
      case 'api':
        return 'text-orange-800';
      case 'authentication':
      case 'permission':
        return 'text-red-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <View style={tw`mx-4 mb-3 p-4 rounded-lg border ${getErrorColor(error.type)}`}>
      <View style={tw`flex-row items-start`}>
        <SafePhosphorIcon 
          iconType={getErrorIcon(error.type)} 
          size={20} 
          color={getTextColor(error.type).replace('text-', '#')} 
          weight="fill"
          style={tw`mr-3 mt-0.5`}
        />
        <View style={tw`flex-1`}>
          <Text style={tw`font-semibold ${getTextColor(error.type)} mb-1`}>
            {error.type === 'realtime' ? 'Live Updates Paused' : 
             error.type === 'network' ? 'Connection Issue' :
             error.type === 'database' ? 'Service Temporarily Down' :
             error.type === 'authentication' ? 'Session Expired' :
             error.type === 'permission' ? 'Access Denied' :
             error.type === 'storage' ? 'Storage Issue' :
             error.type === 'api' ? 'AI Service Issue' :
             'Something Went Wrong'}
          </Text>
          <Text style={tw`text-sm ${getTextColor(error.type)} mb-3`}>
            {error.userMessage}
          </Text>
          <View style={tw`flex-row items-center justify-between`}>
            {error.actionLabel && (
              <TouchableOpacity
                style={tw`bg-jung-purple px-4 py-2 rounded-lg`}
                onPress={() => {
                  if (error.action) {
                    error.action();
                  } else if (onAction) {
                    onAction();
                  }
                }}
              >
                <Text style={tw`text-white font-medium text-sm`}>
                  {error.actionLabel}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={tw`p-2`}
              onPress={onDismiss}
            >
              <SafePhosphorIcon iconType="X" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// Global Error Context
interface ErrorContextType {
  errors: AppError[];
  addError: (error: any, context?: string) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

const ErrorContext = React.createContext<ErrorContextType | null>(null);

export const useErrorHandler = () => {
  const context = React.useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within ErrorHandler');
  }
  return context;
};

// Main Error Handler Component
export const ErrorHandler: React.FC<ErrorHandlerProps> = ({ children }) => {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = (error: any, context?: string) => {
    const appError = classifyError(error, context);
    
    // Don't add duplicate errors
    const isDuplicate = errors.some(e => 
      e.type === appError.type && 
      e.message === appError.message &&
      Date.now() - e.timestamp.getTime() < 5000 // Within 5 seconds
    );
    
    if (!isDuplicate) {
      setErrors(prev => [appError, ...prev.slice(0, 2)]); // Keep max 3 errors
      
      // Auto-dismiss non-critical errors after 10 seconds
      if (appError.type === 'realtime') {
        setTimeout(() => {
          removeError(appError.id);
        }, 10000);
      }
    }
  };

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  // Note: Realtime error handling would be implemented here
  // Currently, realtime errors are handled manually where they occur

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
      {/* Render error banners */}
      <View style={tw`absolute top-0 left-0 right-0 z-50`}>
        {errors.map(error => (
          <ErrorBanner
            key={error.id}
            error={error}
            onDismiss={() => removeError(error.id)}
            onAction={() => {
              // Default retry action
              if (error.type === 'network' || error.type === 'database' || error.type === 'api') {
                // Could trigger a retry mechanism here
                removeError(error.id);
              }
            }}
          />
        ))}
      </View>
    </ErrorContext.Provider>
  );
};

// Hook for easy error reporting
export const useErrorReporting = () => {
  const { addError } = useErrorHandler();
  
  const reportError = (error: any, context?: string) => {
    console.error(`Error in ${context}:`, error);
    addError(error, context);
  };

  return { reportError };
};
