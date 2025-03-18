import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { List, SignOut, Shield, FileText, Info } from 'phosphor-react-native';
import { supabase } from '../lib/supabase';
import { RootStackNavigationProp } from '../navigation/types';
import tw from '../lib/tailwind';

interface HamburgerMenuProps {
  showLogout?: boolean;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ showLogout = true }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation<RootStackNavigationProp>();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'LandingScreen' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    {
      title: 'Account Settings',
      icon: <Shield size={20} color="#4A3B78" />,
      onPress: () => {
        setMenuVisible(false);
        navigation.navigate('AccountScreen');
      },
    },
    {
      title: 'Privacy Policy',
      icon: <FileText size={20} color="#4A3B78" />,
      onPress: () => {
        setMenuVisible(false);
        navigation.navigate('PrivacyPolicyScreen');
      },
    },
    {
      title: 'Terms of Service',
      icon: <Info size={20} color="#4A3B78" />,
      onPress: () => {
        setMenuVisible(false);
        navigation.navigate('TermsOfServiceScreen');
      },
    },
    {
      title: 'Disclaimer',
      icon: <Info size={20} color="#4A3B78" />,
      onPress: () => {
        setMenuVisible(false);
        navigation.navigate('DisclaimerScreen');
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
        <List size={24} color="#4A3B78" weight="bold" />
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
                <View style={tw`mr-3`}>{item.icon}</View>
                <Text style={[tw`text-base`, item.textStyle]}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}; 