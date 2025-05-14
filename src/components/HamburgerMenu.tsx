import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
// Remove useNavigation import
import { List, SignOut, Shield, FileText, Info } from 'phosphor-react-native'; // Removed Smiley
// Remove direct supabase import
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook
// Remove RootStackNavigationProp import if no longer needed directly
import * as NavigationService from '../navigation/navigationService'; // Import the navigation service
import tw from '../lib/tailwind';

interface HamburgerMenuProps {
  showLogout?: boolean;
}

// Define a type for menu items
type MenuItem = {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  textStyle?: object; // Make textStyle optional
};

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ showLogout = true }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { signOut } = useAuth(); // Use the signOut method from AuthContext

  const handleLogout = async () => {
    try {
      console.log('Signing out user...');
      setMenuVisible(false); // Close menu first
      
      // Use the signOut method from AuthContext
      await signOut();
      
      // The navigation will be handled by the App-enhanced.tsx component
      // which will detect the auth state change and render the appropriate screens
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const menuItems: MenuItem[] = [ // Apply the MenuItem type here
    {
      title: 'Account Settings',
      icon: <Shield size={20} color="#4A3B78" />,
      onPress: () => {
        setMenuVisible(false);
        console.log('HamburgerMenu: Navigate to AccountScreen pressed');
        NavigationService.navigate('AccountScreen'); // Use service
      },
    },
    {
      title: 'Privacy Policy',
      icon: <FileText size={20} color="#4A3B78" />,
      onPress: () => {
        setMenuVisible(false);
        console.log('HamburgerMenu: Navigate to PrivacyPolicyScreen pressed');
        NavigationService.navigate('PrivacyPolicyScreen'); // Use service
      },
    },
    {
      title: 'Terms of Service',
      icon: <Info size={20} color="#4A3B78" />,
      onPress: () => {
        setMenuVisible(false);
        console.log('HamburgerMenu: Navigate to TermsOfServiceScreen pressed');
        NavigationService.navigate('TermsOfServiceScreen'); // Use service
      },
    },
    // Mood Tracker menu item removed as requested
    {
      title: 'Disclaimer',
      icon: <Info size={20} color="#4A3B78" />,
      onPress: () => {
        setMenuVisible(false);
        console.log('HamburgerMenu: Navigate to DisclaimerScreen pressed');
        NavigationService.navigate('DisclaimerScreen'); // Use service
      },
    },
  ];

  if (showLogout) {
    menuItems.push({
      title: 'Logout',
      icon: <SignOut size={20} color="#E53E3E" />,
      onPress: handleLogout,
      textStyle: { color: '#E53E3E' },
    });
  }

  return (
    <>
      <TouchableOpacity
        style={tw`p-2`}
        onPress={() => setMenuVisible(true)}
        accessible={true}
        accessibilityLabel="Open menu"
        accessibilityRole="button"
      >
        <Text style={{ fontSize: 0 }}>
          <View>
            <List size={24} color="#4A3B78" weight="bold" />
          </View>
        </Text>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={tw`flex-1 bg-black bg-opacity-30`}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={tw`absolute top-16 right-4 bg-white rounded-lg shadow-lg w-64 overflow-hidden`}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={tw`flex-row items-center p-4 border-b border-gray-100`}
                onPress={item.onPress}
              >
                <View style={tw`mr-3`}>
                  <Text style={{ fontSize: 0 }}>
                    <View>
                      {item.icon}
                    </View>
                  </Text>
                </View>
                <Text style={[tw`text-base`, item.textStyle]}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};
