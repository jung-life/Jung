import TermsOfServiceScreen from '../src/screens/TermsOfServiceScreen'; // Ensure the correct path

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      {/* ...existing code... */}
      <Stack.Screen
        name="TermsOfServiceScreen"
        component={TermsOfServiceScreen}
      />
      {/* ...existing code... */}
    </Stack.Navigator>
  );
}
