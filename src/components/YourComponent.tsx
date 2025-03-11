import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const YourComponent = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = () => {
    navigation.navigate('DailyMotivationScreen');
  };

  return (
    <Button onPress={handlePress} title="Go to Daily Motivation" />
  );
}; 