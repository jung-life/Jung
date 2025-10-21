import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import tw from '../lib/tailwind';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { SafePhosphorIcon } from '../components/SafePhosphorIcon';
import { voiceAnalyticsService } from '../services/voiceAnalyticsService';
import * as secureStore from '../lib/secureStorage';

interface VoiceNote {
  id: string;
  title: string;
  timestamp: number;
  duration: number;
  uri: string;
  mood?: string;
  tags?: string[];
  reflection?: string;
}

const VOICE_NOTES_STORAGE_KEY = 'voiceNotes';

const VoiceNotesScreen = () => {
  const navigation = useNavigation();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [pendingRecording, setPendingRecording] = useState<{ uri: string; duration: number } | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');

  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  const moods = [
    { name: 'Reflective', icon: 'Brain', color: 'text-blue-500' },
    { name: 'Inspired', icon: 'Lightbulb', color: 'text-yellow-500' },
    { name: 'Grateful', icon: 'Heart', color: 'text-pink-500' },
    { name: 'Excited', icon: 'Sparkle', color: 'text-orange-500' },
    { name: 'Calm', icon: 'Wind', color: 'text-cyan-500' },
    { name: 'Curious', icon: 'MagnifyingGlass', color: 'text-purple-500' },
  ];

  useEffect(() => {
    loadVoiceNotes();
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  const loadVoiceNotes = async () => {
    try {
      const stored = await secureStore.getItem(VOICE_NOTES_STORAGE_KEY);
      if (stored) {
        setVoiceNotes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load voice notes:', error);
    }
  };

  const saveVoiceNotes = async (notes: VoiceNote[]) => {
    try {
      await secureStore.saveItem(VOICE_NOTES_STORAGE_KEY, JSON.stringify(notes));
      setVoiceNotes(notes);
    } catch (error) {
      console.error('Failed to save voice notes:', error);
    }
  };

  const startRecording = async () => {
    try {
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (permissionResponse.status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission to record voice notes.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        setPendingRecording({ uri, duration: recordingDuration });
        setShowTitleModal(true);
      }

      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    }
  };

  const saveRecording = async () => {
    if (!pendingRecording) return;

    const newNote: VoiceNote = {
      id: Date.now().toString(),
      title: noteTitle.trim() || `Voice Note ${new Date().toLocaleDateString()}`,
      timestamp: Date.now(),
      duration: pendingRecording.duration,
      uri: pendingRecording.uri,
      mood: selectedMood || undefined,
    };

    const updatedNotes = [newNote, ...voiceNotes];
    await saveVoiceNotes(updatedNotes);

    setShowTitleModal(false);
    setPendingRecording(null);
    setNoteTitle('');
    setSelectedMood('');
    Alert.alert('Success', 'Voice note saved successfully!');
  };

  const playSound = async (note: VoiceNote) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: note.uri });
      setSound(newSound);
      setCurrentPlayingId(note.id);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          setCurrentPlayingId(null);
        }
      });

      await newSound.playAsync();
    } catch (error) {
      console.error('Failed to play sound:', error);
      Alert.alert('Error', 'Failed to play voice note.');
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
      setCurrentPlayingId(null);
    }
  };

  const deleteNote = async (noteId: string) => {
    Alert.alert(
      'Delete Voice Note',
      'Are you sure you want to delete this voice note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedNotes = voiceNotes.filter(note => note.id !== noteId);
            await saveVoiceNotes(updatedNotes);
          }
        }
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMoodIcon = (mood: string) => {
    const moodData = moods.find(m => m.name === mood);
    return moodData ? { icon: moodData.icon, color: moodData.color } : null;
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.08} />

        {/* Header */}
        <View style={tw`flex-row items-center justify-between px-4 py-3`}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <SafePhosphorIcon iconType="ArrowLeft" size={24} color="#2D2B55" weight="bold" />
          </TouchableOpacity>
          <Text style={tw`text-xl font-bold text-jung-deep`}>Voice Notes</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('VoiceInsightsScreen' as any)}
            style={tw`p-2`}
          >
            <SafePhosphorIcon iconType="TrendUp" size={24} color="#2D2B55" weight="bold" />
          </TouchableOpacity>
        </View>

        <ScrollView style={tw`flex-1 px-4`}>
          {/* Recording Section */}
          <View style={tw`bg-white/80 rounded-xl p-6 mb-6 shadow-sm`}>
            <Text style={tw`text-lg font-bold text-jung-deep mb-4 text-center`}>
              Record Your Insights
            </Text>

            <View style={tw`items-center mb-4`}>
              <TouchableOpacity
                style={tw`w-20 h-20 rounded-full items-center justify-center ${isRecording ? 'bg-red-500' : 'bg-jung-purple'} shadow-lg`}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <SafePhosphorIcon
                  iconType={isRecording ? "Stop" : "Microphone"}
                  size={32}
                  color="white"
                  weight="fill"
                />
              </TouchableOpacity>

              {isRecording && (
                <View style={tw`mt-3 items-center`}>
                  <Text style={tw`text-red-500 font-bold text-lg`}>
                    {formatDuration(recordingDuration)}
                  </Text>
                  <Text style={tw`text-gray-600 text-sm`}>Recording...</Text>
                </View>
              )}
            </View>

            <Text style={tw`text-center text-gray-600 text-sm`}>
              {isRecording ? 'Tap to stop recording' : 'Tap to start recording your thoughts'}
            </Text>
          </View>

          {/* Voice Notes List */}
          <Text style={tw`text-lg font-bold text-jung-deep mb-4`}>
            Your Voice Notes ({voiceNotes.length})
          </Text>

          {voiceNotes.length === 0 ? (
            <View style={tw`bg-white/60 rounded-xl p-8 items-center`}>
              <SafePhosphorIcon iconType="Microphone" size={48} color="#9CA3AF" weight="light" />
              <Text style={tw`text-gray-500 text-center mt-4`}>
                No voice notes yet. Start recording your insights!
              </Text>
            </View>
          ) : (
            voiceNotes.map((note) => {
              const moodData = note.mood ? getMoodIcon(note.mood) : null;
              const isCurrentlyPlaying = currentPlayingId === note.id && isPlaying;

              return (
                <View key={note.id} style={tw`bg-white/80 rounded-xl p-4 mb-3 shadow-sm`}>
                  <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Text style={tw`font-bold text-jung-deep flex-1`} numberOfLines={1}>
                      {note.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => deleteNote(note.id)}
                      style={tw`ml-2 p-1`}
                    >
                      <SafePhosphorIcon iconType="Trash" size={16} color="#EF4444" weight="light" />
                    </TouchableOpacity>
                  </View>

                  <View style={tw`flex-row items-center justify-between mb-3`}>
                    <Text style={tw`text-gray-600 text-sm`}>
                      {new Date(note.timestamp).toLocaleDateString()} • {formatDuration(note.duration)}
                    </Text>
                    {moodData && (
                      <View style={tw`flex-row items-center`}>
                        <SafePhosphorIcon
                          iconType={moodData.icon as any}
                          size={16}
                          color={moodData.color.replace('text-', '')}
                          weight="light"
                        />
                        <Text style={tw`text-xs ${moodData.color} ml-1`}>{note.mood}</Text>
                      </View>
                    )}
                  </View>

                  {/* Advanced Recording Insights */}
                  <View style={tw`bg-gray-50 rounded-lg p-3 mb-3`}>
                    <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>Recording Insights:</Text>
                    {(() => {
                      const noteIndex = voiceNotes.findIndex(n => n.id === note.id);
                      const analysis = voiceAnalyticsService.analyzeRecordingInsights(note, voiceNotes, noteIndex);

                      return (
                        <View>
                          {/* Category and Context */}
                          <View style={tw`flex-row items-center mb-2`}>
                            <Text style={tw`text-xs text-jung-purple font-medium mr-2`}>
                              {analysis.category === 'spontaneous' ? '⚡ Spontaneous' :
                               analysis.category === 'routine' ? '📋 Routine' :
                               analysis.category === 'intensive' ? '🎯 Intensive' : '💡 Breakthrough'}
                            </Text>
                            <Text style={tw`text-xs text-gray-500`}>•</Text>
                            <Text style={tw`text-xs text-gray-600 ml-2`}>
                              {analysis.timeContext === 'morning-clarity' ? '🌅 Morning Clarity' :
                               analysis.timeContext === 'midday-processing' ? '☀️ Midday Processing' :
                               analysis.timeContext === 'evening-reflection' ? '🌆 Evening Reflection' : '🌙 Late Night Deep'}
                            </Text>
                          </View>

                          {/* Behavior Pattern */}
                          <Text style={tw`text-xs text-blue-600 mb-1 font-medium`}>
                            {analysis.behaviorPattern}
                          </Text>

                          {/* Growth Indicators */}
                          {analysis.personalGrowthIndicators.map((indicator, idx) => (
                            <Text key={idx} style={tw`text-xs text-green-600 mb-1`}>
                              {indicator}
                            </Text>
                          ))}

                          {/* Contextual Insights */}
                          {analysis.contextualInsights.map((insight, idx) => (
                            <Text key={idx} style={tw`text-xs text-gray-600 mb-1`}>
                              • {insight}
                            </Text>
                          ))}

                          {/* Recommendations */}
                          {analysis.recommendations.length > 0 && (
                            <View style={tw`mt-2 pt-2 border-t border-gray-200`}>
                              <Text style={tw`text-xs font-medium text-gray-700 mb-1`}>Suggestions:</Text>
                              {analysis.recommendations.map((rec, idx) => (
                                <Text key={idx} style={tw`text-xs text-jung-purple mb-1`}>
                                  {rec}
                                </Text>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })()}
                  </View>

                  <TouchableOpacity
                    style={tw`flex-row items-center justify-center py-2 px-4 bg-jung-purple/10 rounded-lg`}
                    onPress={isCurrentlyPlaying ? stopPlayback : () => playSound(note)}
                  >
                    <SafePhosphorIcon
                      iconType={isCurrentlyPlaying ? "Pause" : "Play"}
                      size={20}
                      color="#2D2B55"
                      weight="fill"
                    />
                    <Text style={tw`text-jung-deep font-medium ml-2`}>
                      {isCurrentlyPlaying ? 'Stop' : 'Play'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Save Recording Modal */}
        <Modal visible={showTitleModal} transparent animationType="slide">
          <View style={tw`flex-1 bg-black/50 justify-center px-4`}>
            <View style={tw`bg-white rounded-xl p-6`}>
              <Text style={tw`text-lg font-bold text-jung-deep mb-4`}>Save Voice Note</Text>

              <TextInput
                style={tw`border border-gray-300 rounded-lg p-3 mb-4`}
                placeholder="Enter a title for your voice note..."
                value={noteTitle}
                onChangeText={setNoteTitle}
                autoFocus
              />

              <Text style={tw`font-medium text-gray-700 mb-2`}>How are you feeling? (optional)</Text>
              <View style={tw`flex-row flex-wrap mb-6`}>
                {moods.map((mood) => (
                  <TouchableOpacity
                    key={mood.name}
                    style={tw`flex-row items-center m-1 py-2 px-3 rounded-full ${selectedMood === mood.name ? 'bg-jung-purple/20' : 'bg-gray-100'}`}
                    onPress={() => setSelectedMood(selectedMood === mood.name ? '' : mood.name)}
                  >
                    <SafePhosphorIcon
                      iconType={mood.icon as any}
                      size={16}
                      color={selectedMood === mood.name ? "#2D2B55" : "#6B7280"}
                      weight="light"
                    />
                    <Text style={tw`ml-1 text-sm ${selectedMood === mood.name ? 'text-jung-deep font-medium' : 'text-gray-600'}`}>
                      {mood.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={tw`flex-row space-x-3`}>
                <TouchableOpacity
                  style={tw`flex-1 py-3 bg-gray-200 rounded-lg`}
                  onPress={() => {
                    setShowTitleModal(false);
                    setPendingRecording(null);
                    setNoteTitle('');
                    setSelectedMood('');
                  }}
                >
                  <Text style={tw`text-center font-medium text-gray-700`}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`flex-1 py-3 bg-jung-purple rounded-lg`}
                  onPress={saveRecording}
                >
                  <Text style={tw`text-center font-medium text-white`}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default VoiceNotesScreen;