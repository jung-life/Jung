import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';

let reactotron;

if (__DEV__) {
  reactotron = Reactotron
    .configure({
      name: 'Jung App',
    })
    .useReactNative({
      asyncStorage: false, // there are more options to the async storage.
      networking: {
        // optionally, you can turn it off with false.
        ignoreUrls: /symbolicate/
      },
      editor: false, // there are more options to editor
      errors: { veto: (stackFrame) => false }, // or turn it off with false
      overlay: false, // just turning off overlay
    })
    .use(reactotronRedux())
    .connect();

  // Let's clear Reactotron on every time we load the app
  reactotron.clear();

  // Reactotron logging
  console.tron = reactotron;
} else {
  // Release builds
  console.tron = {
    log: () => {},
    warn: () => {},
    error: () => {},
    display: () => {},
    image: () => {},
  };
}

export default reactotron;