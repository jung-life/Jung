import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Switch, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../lib/tailwind'; // Assuming tailwind is set up

const DAILY_REMINDER_STORAGE_KEY = '@JungApp:dailyReminderEnabled';
const NOTIFICATION_ID = 'daily-reminder-notification';

const inspirationalQuotes = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn’t just find you. You have to go out and get it.",
  "The harder you work for something, the greater you’ll feel when you achieve it.",
  "Dream bigger. Do bigger.",
  "Don’t stop when you’re tired. Stop when you’re done.",
  "Wake up with determination. Go to bed with satisfaction."
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const SettingsScreen = () => {
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState({ hour: 9, minute: 0 }); // Default 9:00 AM

  const getRandomQuote = () => {
    return inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please enable notifications in your settings to receive daily reminders.');
      return false;
    }
    return true;
  };

  const scheduleDailyNotification = async (hour: number, minute: number) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      setIsReminderEnabled(false); // Turn toggle off if permission denied
      await AsyncStorage.setItem(DAILY_REMINDER_STORAGE_KEY, 'false');
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync(); // Cancel any existing ones first

    const quote = getRandomQuote();
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "☀️ Good Morning from Jung!",
          body: `How are you doing today? ${quote}`,
          data: { navigateTo: 'Home' }, // Example data to handle tap
        },
        trigger: {
          hour: hour,
          minute: minute,
          repeats: true,
          channelId: 'default',
        } as Notifications.NotificationTriggerInput, // Type assertion
        identifier: NOTIFICATION_ID,
      });
      console.log(`Daily notification scheduled for ${hour}:${minute.toString().padStart(2, '0')} with ID: ${NOTIFICATION_ID}`);
      Alert.alert('Reminders On', `Daily reminders scheduled for ${hour}:${minute.toString().padStart(2, '0')}.`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Could not schedule daily reminder.');
      setIsReminderEnabled(false);
      await AsyncStorage.setItem(DAILY_REMINDER_STORAGE_KEY, 'false');
    }
  };

  const cancelDailyNotification = async () => {
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
    console.log('Daily notification cancelled.');
    Alert.alert('Reminders Off', 'Daily reminders have been turned off.');
  };

  // Load saved preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const savedState = await AsyncStorage.getItem(DAILY_REMINDER_STORAGE_KEY);
        if (savedState !== null) {
          const enabled = savedState === 'true';
          setIsReminderEnabled(enabled);
          // If it was enabled, re-verify scheduled notification (optional, good for robustness)
          // For simplicity, we rely on the user toggling to re-schedule if needed after app updates/reinstalls.
        }
      } catch (e) {
        console.error('Failed to load reminder preference.', e);
      }
    };
    loadPreference();
  }, []);

  const handleToggleReminder = async (value: boolean) => {
    setIsReminderEnabled(value);
    try {
      await AsyncStorage.setItem(DAILY_REMINDER_STORAGE_KEY, value.toString());
      if (value) {
        await scheduleDailyNotification(notificationTime.hour, notificationTime.minute);
      } else {
        await cancelDailyNotification();
      }
    } catch (e) {
      console.error('Failed to save reminder preference.', e);
      Alert.alert('Error', 'Could not save reminder preference.');
      // Revert UI state if save fails
      setIsReminderEnabled(!value);
    }
  };
  
  // Basic time picker mock - in a real app, use a proper date/time picker component
  const showTimePicker = () => {
    // This is a placeholder. A real app would use a modal with a time picker.
    // For now, let's just cycle through a few preset times for demonstration.
    const presetTimes = [
      { hour: 0, minute: 10 },   // 12:08 AM (for your current test)
      { hour: 9, minute: 0 },   // 9:00 AM
      { hour: 12, minute: 30 }, // 12:30 PM
      { hour: 17, minute: 0 },  // 5:00 PM
      { hour: 22, minute: 0 },  // 10:00 PM
    ];
    // Ensure findIndex handles the case where notificationTime might not be in presetTimes initially
    let currentIndex = presetTimes.findIndex(t => t.hour === notificationTime.hour && t.minute === notificationTime.minute);
    if (currentIndex === -1) { // If current time not in presets, start cycle from before the first.
        currentIndex = presetTimes.length -1; // This will make nextIndex = 0
    }
    const nextIndex = (currentIndex + 1) % presetTimes.length;
    const newTime = presetTimes[nextIndex];
    setNotificationTime(newTime);

    if (isReminderEnabled) {
      // Re-schedule with new time
      scheduleDailyNotification(newTime.hour, newTime.minute);
      Alert.alert("Time Changed & Rescheduled", `Reminder time updated to ${newTime.hour}:${newTime.minute.toString().padStart(2, '0')}. Notification has been rescheduled.`);
    } else {
      Alert.alert("Time Changed", `Reminder time updated to ${newTime.hour}:${newTime.minute.toString().padStart(2, '0')}. Enable reminders to use this new time.`);
    }
  };


  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`p-6`}>
        <Text style={tw`text-2xl font-bold text-jung-deep mb-8`}>Settings</Text>

        <View style={tw`bg-white p-4 rounded-lg shadow mb-6`}>
          <View style={tw`flex-row justify-between items-center mb-2`}>
            <Text style={tw`text-lg font-medium text-gray-700`}>Daily Reminders</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isReminderEnabled ? '#4A3B78' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={handleToggleReminder}
              value={isReminderEnabled}
            />
          </View>
          <Text style={tw`text-sm text-gray-500`}>
            Receive a daily notification to check in and get inspired.
          </Text>
        </View>

        {isReminderEnabled && (
          <View style={tw`bg-white p-4 rounded-lg shadow mb-6`}>
            <Text style={tw`text-lg font-medium text-gray-700 mb-2`}>Reminder Time</Text>
            <TouchableOpacity onPress={showTimePicker} style={tw`bg-jung-purple-light p-3 rounded-md`}>
              <Text style={tw`text-jung-purple text-center font-medium`}>
                {`Current: ${notificationTime.hour}:${notificationTime.minute.toString().padStart(2, '0')}`} (Tap to change)
              </Text>
            </TouchableOpacity>
            <Text style={tw`text-xs text-gray-500 mt-2`}>
              Note: This is a simplified time picker. For precise time selection, a dedicated component would be used.
            </Text>
          </View>
        )}
        
        {/* Placeholder for more settings */}
        <View style={tw`mt-8`}>
            <Text style={tw`text-sm text-gray-400 text-center`}>More settings coming soon...</Text>
        </View>

      </View>
    </SafeAreaView>
  );
};

export default SettingsScreen;
