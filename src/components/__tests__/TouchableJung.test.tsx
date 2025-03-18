import { render, fireEvent } from '@testing-library/react-native';
import TouchableJung from '../TouchableJung';

test('TouchableJung calls onPress when clicked', () => {
  const onPress = jest.fn();
  const { getByTestId } = render(
    <TouchableJung onPress={onPress} testID="touchable-jung">
      <Text>Test</Text>
    </TouchableJung>
  );
  fireEvent.press(getByTestId('touchable-jung'));
  expect(onPress).toHaveBeenCalled();
}); 