import React from "react";
import { TouchableOpacity } from "react-native";
import { SafePhosphorIcon } from "./SafePhosphorIcon";
import { useNavigation } from "@react-navigation/native";
import { RootStackNavigationProp } from "../navigation/types";
import tw from "../lib/tailwind";

interface HomeButtonProps {
  destination?: string;
  color?: string;
  size?: number;
}

const HomeButton = ({
  destination = "PostLoginScreen",
  color = "#4A3B78",
  size = 22
}: HomeButtonProps) => {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <TouchableOpacity
      style={tw`p-2 ml-1`}
      onPress={() => navigation.navigate(destination as any)}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <SafePhosphorIcon iconType="House" size={size} color={color} weight="fill" />
    </TouchableOpacity>
  );
};

export default HomeButton; 