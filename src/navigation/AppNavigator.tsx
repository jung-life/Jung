import { AccountScreen } from '../screens/AccountScreen';

Account: undefined;

<Stack.Navigator screenOptions={{ headerShown: false }}>
  {!user ? (
    <>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </>
  ) : isNewUser ? (
    <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
  ) : (
    <>
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </>
  )}
</Stack.Navigator> 