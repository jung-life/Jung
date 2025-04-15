import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getItem, setItem } from './storageHandler';

const initializeApp = async () => {
  const authToken = await getItem('sb-osmhesmrvxusckjfxugr-auth-token');
  if (!authToken) {
    console.log('No auth token found, using in-memory storage.');
    await setItem('sb-osmhesmrvxusckjfxugr-auth-token', 'temporary-token');
  }
};

initializeApp();

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="auto" />
        {/* Example chat message */}
        <View style={styles.chatMessage}>
          <Image
            source={{ uri: 'https://example.com/avatar.png' }} // Avatar profile photo
            style={styles.avatar}
          />
          <Text style={styles.messageText}>Hello! How can I assist you today?</Text>
        </View>
        <View style={styles.chatMessageUser}>
          <Text style={styles.messageText}>I need help with my app.</Text>
          <Image
            source={{ uri: 'https://example.com/user.png' }} // User profile photo
            style={styles.avatar}
          />
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  chatMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  chatMessageUser: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  messageText: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    maxWidth: '70%',
  },
});