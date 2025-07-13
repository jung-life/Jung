import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '../lib/tailwind';

interface DisclaimerRejectionModalProps {
  visible: boolean;
  onReconsider: () => void;
  onConfirmReject: () => void;
  loading: boolean;
}

const { width, height } = Dimensions.get('window');

export const DisclaimerRejectionModal: React.FC<DisclaimerRejectionModalProps> = ({
  visible,
  onReconsider,
  onConfirmReject,
  loading,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-60`}>
        <View style={[
          tw`bg-white rounded-3xl mx-6 p-6 shadow-2xl`,
          { maxWidth: width * 0.9, maxHeight: height * 0.8 }
        ]}>
          {/* Header with icon */}
          <View style={tw`items-center mb-4`}>
            <View style={tw`w-16 h-16 bg-jung-purple-light rounded-full items-center justify-center mb-3`}>
              <Ionicons name="heart" size={32} color="#4A3B78" />
            </View>
            <Text style={tw`text-2xl font-bold text-jung-purple text-center`}>
              We Understand
            </Text>
          </View>

          {/* Main message */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-lg text-gray-700 text-center leading-6 mb-4`}>
              Your privacy and comfort are incredibly important to us. We completely respect your choice.
            </Text>
            
            <View style={tw`bg-jung-purple-light rounded-2xl p-4 mb-4`}>
              <View style={tw`flex-row items-start mb-3`}>
                <Ionicons name="shield-checkmark" size={20} color="#4A3B78" style={tw`mt-1 mr-2`} />
                <Text style={tw`text-jung-purple font-semibold flex-1`}>
                  Your data stays private and secure
                </Text>
              </View>
              <View style={tw`flex-row items-start mb-3`}>
                <Ionicons name="people" size={20} color="#4A3B78" style={tw`mt-1 mr-2`} />
                <Text style={tw`text-jung-purple font-semibold flex-1`}>
                  Join thousands finding clarity and growth
                </Text>
              </View>
              <View style={tw`flex-row items-start`}>
                <Ionicons name="time" size={20} color="#4A3B78" style={tw`mt-1 mr-2`} />
                <Text style={tw`text-jung-purple font-semibold flex-1`}>
                  Start your journey in just a few minutes
                </Text>
              </View>
            </View>

            <Text style={tw`text-base text-gray-600 text-center leading-5`}>
              If you change your mind in the future, we'll be here to support your journey of self-reflection and personal growth.
            </Text>
          </View>

          {/* Action buttons */}
          <View style={tw`flex-row justify-between`}>
            <TouchableOpacity
              style={tw`flex-1 bg-gray-100 rounded-xl py-4 px-4 mr-2 items-center border border-gray-200`}
              onPress={onConfirmReject}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <>
                  <Text style={tw`text-gray-600 font-semibold text-base mb-1`}>
                    Take me back
                  </Text>
                  <Text style={tw`text-gray-500 text-xs`}>
                    to login
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={tw`flex-1 bg-jung-purple rounded-xl py-4 px-4 ml-2 items-center shadow-lg`}
              onPress={onReconsider}
              disabled={loading}
            >
              <Text style={tw`text-white font-bold text-base mb-1`}>
                Let me reconsider
              </Text>
              <Text style={tw`text-indigo-200 text-xs`}>
                I'll read it again
              </Text>
            </TouchableOpacity>
          </View>

          {/* Small footer */}
          <Text style={tw`text-xs text-gray-400 text-center mt-4`}>
            Thank you for considering Jung ✨
          </Text>
        </View>
      </View>
    </Modal>
  );
};
