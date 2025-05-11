import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Linking,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import tw from '../lib/tailwind';
import { ArrowLeft, House, Link as LinkIcon, FlowerLotus, Brain, Person, Heart, EnvelopeSimple, GoogleLogo, AppleLogo, Lifebuoy, FirstAidKit, Moon } from 'phosphor-react-native'; // Added Lifebuoy, FirstAidKit, Moon

// Define resource data
const resources = [
  {
    title: 'Guided Meditation (Headspace)',
    description: 'Learn mindfulness and meditation techniques.',
    url: 'https://www.headspace.com/',
    icon: <Brain size={24} color="#6A8EAE" weight="light" />, // Example icon
    color: 'bg-conversation/10 border-conversation/30',
    textColor: 'text-conversation'
  },
  {
    title: 'Yoga With Adriene',
    description: 'Free yoga videos for all levels.',
    url: 'https://yogawithadriene.com/',
    icon: <FlowerLotus size={24} color="#97C1A9" weight="light" />, // Use FlowerLotus instead of Yoga
    color: 'bg-motivation/10 border-motivation/30',
    textColor: 'text-motivation'
  },
   {
    title: 'National Alliance on Mental Illness (NAMI)',
    description: 'Information, support groups, and resources for mental health conditions.',
    url: 'https://www.nami.org/',
    icon: <Heart size={24} color="#A8DADC" weight="light" />, // Example icon - reusing Heart
    color: 'bg-soothing-blue/10 border-soothing-blue/30',
    textColor: 'text-soothing-blue'
  },
  {
    title: 'Crisis Text Line',
    description: 'Free, 24/7 text support for those in crisis.',
    url: 'https://www.crisistextline.org/',
    icon: <Lifebuoy size={24} color="#F47C7C" weight="light" />, 
    color: 'bg-red-100/50 border-red-300/50', // Example new style
    textColor: 'text-red-700'
  },
  {
    title: 'SAMHSA National Helpline',
    description: 'Treatment referral and information service.',
    url: 'https://www.samhsa.gov/find-help/national-helpline',
    icon: <FirstAidKit size={24} color="#87CEEB" weight="light" />, 
    color: 'bg-sky-100/50 border-sky-300/50', // Example new style
    textColor: 'text-sky-700'
  },
  {
    title: 'Calm App',
    description: 'App for sleep, meditation, and relaxation.',
    url: 'https://www.calm.com/',
    icon: <Moon size={24} color="#483D8B" weight="light" />, 
    color: 'bg-indigo-100/50 border-indigo-300/50', // Example new style
    textColor: 'text-indigo-700'
  },
  // Add more popular links as needed
];

const loginButtons = [
  {
    title: 'Login with Email',
    icon: <EnvelopeSimple size={24} color="#6A8EAE" weight="light" />,
  },
  {
    title: 'Login with Google',
    icon: <GoogleLogo size={24} color="#DB4437" weight="light" />,
  },
  {
    title: 'Login with Apple',
    icon: <AppleLogo size={24} color="#000000" weight="light" />,
  },
];

const SelfHelpResourcesScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  const handleLinkPress = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(`Don't know how to open this URL: ${url}`);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.05} />
        
        {/* Custom header removed, will rely on AppNavigator's header options */}
        {/*
        <View style={tw`p-4 border-b border-gray-200/30 flex-row items-center`}>
          <TouchableOpacity 
            style={tw`p-2 mr-2`}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color="#4A3B78" />
          </TouchableOpacity>
          <Text style={tw`text-xl font-bold text-center text-jung-deep flex-1`}>
            Self-Help Resources
          </Text>
          <View style={tw`w-10`} />
        </View>
        */}
        
        <ScrollView style={tw`flex-1 px-4 pt-4`}>
          <Text style={tw`text-lg text-gray-700 mb-6 px-2`}>
            Explore these external resources for additional support and well-being practices.
          </Text>

          {resources.map((resource, index) => (
            <TouchableOpacity
              key={index}
              style={tw`rounded-xl p-4 w-full mb-4 flex-row items-start shadow-sm border ${resource.color} bg-white/80`}
              onPress={() => handleLinkPress(resource.url)}
            >
              <View style={tw`mr-4 mt-1`}>
                 {resource.icon}
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-base font-semibold ${resource.textColor} mb-1`}>{resource.title}</Text>
                <Text style={tw`text-sm text-gray-600 leading-snug`}>{resource.description}</Text>
              </View>
              <View style={tw`ml-2 mt-1`}>
                 <LinkIcon size={18} color="#A0AEC0" />
              </View>
            </TouchableOpacity>
          ))}
          
           {/* Add some padding at the bottom of the scroll view */}
           <View style={tw`h-24`} /> 
        </ScrollView>

        {/* Home Button Footer */}
        <View style={tw`absolute bottom-0 left-0 right-0 flex-row justify-center p-4 bg-white/80 border-t border-gray-200`}>
          <TouchableOpacity 
            style={tw`p-3 bg-jung-purple-light rounded-full`}
            onPress={() => navigation.navigate('PostLoginScreen')}
          >
            <House size={28} color="#4A3B78" weight="fill" />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </GradientBackground>
  );
};

export default SelfHelpResourcesScreen;
