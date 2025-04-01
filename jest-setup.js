// Optional: Mock any global modules or functions needed for tests
// For example, mocking react-native-reanimated:
// jest.mock('react-native-reanimated', () => {
//   const Reanimated = require('react-native-reanimated/mock');
//   Reanimated.default.call = () => {}; // Mock the 'call' function if needed
//   return Reanimated;
// });

// Mock react-native-gesture-handler
// jest.mock('react-native-gesture-handler', () => {
//   const View = require('react-native/Libraries/Components/View/View');
//   return {
//     Swipeable: View,
//     DrawerLayout: View,
//     State: {},
//     ScrollView: View,
//     Slider: View,
//     Switch: View,
//     TextInput: View,
//     ToolbarAndroid: View,
//     ViewPagerAndroid: View,
//     DrawerLayoutAndroid: View,
//     WebView: View,
//     NativeViewGestureHandler: View,
//     TapGestureHandler: View,
//     FlingGestureHandler: View,
//     ForceTouchGestureHandler: View,
//     LongPressGestureHandler: View,
//     PanGestureHandler: View,
//     PinchGestureHandler: View,
//     RotationGestureHandler: View,
//     /* Buttons */
//     RawButton: View,
//     BaseButton: View,
//     RectButton: View,
//     BorderlessButton: View,
//     /* Other */
//     FlatList: View,
//     gestureHandlerRootHOC: jest.fn(),
//     Directions: {},
//   };
// });

// Mock other libraries as needed, e.g., async-storage, navigation, etc.
// jest.mock('@react-native-async-storage/async-storage', () =>
//   require('@react-native-async-storage/async-storage/jest/async-storage-mock')
// );

// jest.mock('@react-navigation/native', () => {
//   const actualNav = jest.requireActual('@react-navigation/native');
//   return {
//     ...actualNav,
//     useNavigation: () => ({
//       navigate: jest.fn(),
//       dispatch: jest.fn(),
//     }),
//     useRoute: () => ({
//       params: {},
//     }),
//   };
// });

// Silence console logs/errors if they are too noisy during tests
// global.console = {
//   ...console,
//   // log: jest.fn(),
//   // warn: jest.fn(),
//   // error: jest.fn(),
// };
