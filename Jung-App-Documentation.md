# Jung App Documentation

## Overview

Jung is a mobile application built with React Native and Expo that provides users with a therapeutic chat experience based on Jungian psychology and other psychological approaches. The app allows users to chat with various AI-powered therapist avatars, each with their own unique personality and therapeutic approach.

## Project Structure

The application follows a standard React Native project structure:

```
jung/
├── assets/                  # Static assets like images and icons
├── src/
│   ├── assets/              # Application-specific assets
│   ├── auth/                # Authentication-related code
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React context providers
│   ├── data/                # Static data files
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions and services
│   ├── navigation/          # Navigation configuration
│   ├── screens/             # Screen components
│   ├── store/               # State management
│   ├── types/               # TypeScript type definitions
│   └── App.tsx              # Main application component
├── app.json                 # Expo configuration
├── app.config.js            # Dynamic Expo configuration
└── package.json             # Project dependencies
```

## Core Technologies

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform for React Native
- **TypeScript**: Type-safe JavaScript
- **Supabase**: Backend-as-a-Service for authentication and database
- **React Navigation**: Navigation library
- **Tailwind CSS (twrnc)**: Utility-first CSS framework
- **OpenAI API**: AI service for generating therapist responses
- **Mixpanel**: Analytics tracking
- **i18next**: Internationalization
- **Zustand**: State management

## Authentication

The app uses Supabase for authentication, supporting both email/password and Google OAuth sign-in methods.

### AuthContext

The `AuthContext` provides authentication state and methods throughout the app:

- `user`: The current authenticated user
- `session`: The current authentication session
- `loading`: Loading state for authentication operations
- `isNewUser`: Flag to determine if the user has seen the disclaimer
- `signIn`: Method to sign in with email and password
- `signOut`: Method to sign out

### SupabaseContext

The `SupabaseContext` provides additional Supabase-related functionality:

- `isLoggedIn`: Authentication state
- `login`: Method to log in with email and password
- `logout`: Method to log out
- `getGoogleOAuthUrl`: Method to get the Google OAuth URL
- `setOAuthSession`: Method to set the OAuth session

## Navigation

The app uses React Navigation for screen navigation, with a stack navigator defined in `AppNavigator.tsx`.

### Navigation Structure

- **LandingScreen**: Initial screen for new users
- **Login**: Login screen
- **Register**: Registration screen
- **PostLoginScreen**: Screen shown after login
- **Home**: Main home screen
- **ConversationsScreen**: List of user conversations
- **Chat**: Chat interface with therapist avatars
- **AccountScreen**: User account settings
- **PrivacyPolicyScreen**: Privacy policy
- **TermsOfServiceScreen**: Terms of service
- **DisclaimerScreen**: Legal disclaimer
- **DailyMotivationScreen**: Daily motivation content

## AI Integration

The app integrates with OpenAI's API to generate therapist responses based on the selected avatar's personality.

### AI Service

The `aiService.ts` file contains the core AI functionality:

- `processAIRequest`: Sends user input to OpenAI API with rate limiting
- Anonymizes user input for privacy
- Encrypts responses before storing in the database

### Avatar Prompts

The `avatarPrompts.ts` file defines the different therapist avatars and their prompt templates:

- **Carl Jung**: Analytical psychology approach
- **Sigmund Freud**: Psychoanalytic approach
- **Alfred Adler**: Individual psychology approach
- **Carl Rogers**: Person-centered approach
- **Viktor Frankl**: Logotherapy approach
- **Abraham Maslow**: Humanistic psychology approach
- **Karen Horney**: Neo-Freudian approach
- **The Oracle**: Mystical, philosophical approach
- **Morpheus**: Challenging, thought-provoking approach

Each avatar has a defined:
- Name
- Personality traits
- Background
- Prompt template for AI responses

## Chat Functionality

The `ChatScreen.tsx` component provides the main chat interface:

- Displays conversation history
- Allows users to send messages
- Shows typing indicators
- Renders different avatars based on selection
- Formats messages differently for user vs. therapist
- Handles real-time updates via Supabase subscriptions

## UI Components

The app includes various reusable UI components:

- **GradientBackground**: Background with gradient effect
- **SymbolicBackground**: Background with symbolic patterns
- **SimpleAvatar**: Avatar display component
- **Avatar2D/3D**: Different avatar display styles
- **AnimatedTitle**: Animated text component
- **GradientText**: Text with gradient effect
- **TouchableJung**: Custom touchable component
- **Message**: Message display component
- **ChatMessage**: Chat message component
- **HamburgerMenu**: Navigation menu component
- **TherapistAvatar**: Avatar component for therapists

## Utilities and Services

The app includes various utility functions and services:

- **supabase.ts**: Supabase client configuration
- **secureStorage.ts**: Secure storage utilities
- **storage.ts**: General storage utilities
- **analytics.ts**: Mixpanel analytics integration
- **api.ts**: API service functions
- **i18n.ts**: Internationalization setup
- **imagePreloader.ts**: Image preloading utility
- **tailwind.ts**: Tailwind CSS configuration

## Security Features

The app implements several security features:

- **Secure Storage**: Uses Expo's SecureStore for sensitive data
- **Data Encryption**: Encrypts user data before storing
- **Text Anonymization**: Anonymizes user inputs before sending to AI
- **Supabase Security Policies**: Database security rules defined in migrations

## Internationalization

The app uses i18next for internationalization support, allowing for multiple language translations.

## Analytics

The app integrates Mixpanel for user analytics tracking, with a fallback implementation if Mixpanel fails to initialize.

## Testing

The project includes some component tests, such as `TouchableJung.test.tsx`, using React Native's testing utilities.

## Deployment

The app uses Expo Application Services (EAS) for building and deploying, with configuration in `eas.json`.

## Conclusion

Jung is a sophisticated mobile application that combines modern React Native development practices with AI integration to provide a therapeutic chat experience. The app's architecture follows best practices for state management, navigation, and component design, making it maintainable and extensible.
