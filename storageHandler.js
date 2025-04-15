import AsyncStorage from '@react-native-async-storage/async-storage';

const inMemoryStorage = {};

export const getItem = async (key) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn(`Storage getItem error for key ${key}:`, error);
    return inMemoryStorage[key] || null;
  }
};

export const setItem = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Storage setItem error for key ${key}:`, error);
    inMemoryStorage[key] = value;
  }
};
