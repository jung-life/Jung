/* eslint-disable */
const reactNative = require('react-native');

jest.mock('react-native', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    ...reactNative,
    StyleSheet: {
      create: () => ({}),
    },
    Text: View,
    View,
    TouchableOpacity: View,
    TouchableHighlight: View,
    TouchableWithoutFeedback: View,
    Image: View,
    ScrollView: View,
    FlatList: View,
    ActivityIndicator: View,
    Modal: View,
    StatusBar: View,
    Alert: {
      alert: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      select: () => null,
    },
    NativeModules: {
      ...reactNative.NativeModules,
      UIManager: {
        RCTView: {},
        blur: jest.fn(),
        focus: jest.fn(),
        measure: jest.fn(),
        updateView: jest.fn(),
        configureNextLayoutAnimation: jest.fn(),
      },
      KeyboardObserver: {
        addListener: jest.fn(),
        removeListeners: jest.fn(),
      },
      RNGestureHandlerModule: {
        State: {},
        attachGestureHandler: jest.fn(),
        createGestureHandler: jest.fn(),
        dropGestureHandler: jest.fn(),
        updateGestureHandler: jest.fn(),
      },
      StatusBarManager: {
        getHeight: jest.fn().mockReturnValue(20),
      },
      RNBranch: {
        addListener: jest.fn(),
        removeListeners: jest.fn(),
      },
      RNGoogleSignin: {
        configure: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
      },
    },
    findNodeHandle: jest.fn(),
  };
});
