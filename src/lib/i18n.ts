import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        welcome: 'Welcome',
        newChat: 'New Chat',
      },
    },
  },
  lng: 'en',
});

export default i18n; 