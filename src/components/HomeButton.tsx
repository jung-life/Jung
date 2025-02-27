import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { RootStackNavigationProp } from "../navigation/types";
import tw from "../lib/tailwind";

interface HomeButtonProps {
  destination?: string;
  color?: string;
  size?: number;
}

const HomeButton = ({ 
  destination = "Conversations", 
  color = "#4A3B78", 
  size = 28 
}: HomeButtonProps) => {
  const navigation = useNavigation<RootStackNavigationProp>();
  
  return (
    <TouchableOpacity 
      style={tw`p-3 bg-white rounded-full shadow-md border border-gray-200`}
      onPress={() => navigation.navigate(destination as any)}
    >
      <Ionicons name="home" size={size} color={color} />
    </TouchableOpacity>
  );
};

export default HomeButton; 