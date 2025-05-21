// Script to fix voice recognition in ChatScreen.tsx
const fs = require('fs');
const path = require('path');

// Path to the ChatScreen.tsx file
const chatScreenPath = path.join(__dirname, 'src', 'screens', 'ChatScreen.tsx');

// Read the file
console.log(`Reading file: ${chatScreenPath}`);
let content = fs.readFileSync(chatScreenPath, 'utf8');

// Check if the file contains the Voice import
if (!content.includes('@react-native-voice/voice')) {
  console.error('Error: ChatScreen.tsx does not contain Voice import. This script may not be applicable.');
  process.exit(1);
}

// Replace the Voice listeners setup in useEffect - using a more flexible pattern
const voiceListenersPattern = /Voice\.onSpeechStart[\s\S]*?Voice\.onSpeechResults[\s\S]*?setInputText\([\s\S]*?\);/;
const voiceListenersReplacement = `// Initialize Voice module
    const initVoice = async () => {
      try {
        await Voice.destroy();
        await Voice.removeAllListeners();
        
        // Set up Voice listeners
        Voice.onSpeechStart = () => setIsRecording(true);
        Voice.onSpeechEnd = () => setIsRecording(false);
        Voice.onSpeechError = (e: { error?: { code?: string; message?: string } }) => {
          console.error('Speech recognition error', e.error);
          Alert.alert('Speech Error', e.error?.message || 'Could not recognize speech.');
          setIsRecording(false);
        };
        Voice.onSpeechResults = (e: { value?: string[] }) => {
          if (e.value && e.value.length > 0) {
            setRecognizedText(e.value[0]);
            setInputText(e.value[0]); // Populate input field with recognized text
          }
        };
        
        console.log('Voice module initialized successfully');
      } catch (e) {
        console.error('Failed to initialize Voice module', e);
        Alert.alert('Voice Error', 'Could not initialize voice recognition.');
        setHasPermissions(false);
      }
    };
    
    // Call the initialization function
    initVoice();`;

// Replace the startRecording function - using a more flexible pattern
const startRecordingPattern = /const startRecording = async \(\) => \{[\s\S]*?try \{[\s\S]*?await Voice\.start\('en-US'\);[\s\S]*?\} catch[\s\S]*?setIsRecording\(false\);[\s\S]*?\}\n  \};/;
const startRecordingReplacement = `const startRecording = async () => {
    if (!hasPermissions) {
      Alert.alert('Permissions required', 'Microphone permission is needed. Please grant it in settings.');
      return;
    }
    if (isRecording) return;
    setRecognizedText('');
    try {
      // Re-initialize Voice before starting
      await Voice.destroy();
      await Voice.removeAllListeners();
      
      // Set up Voice listeners again
      Voice.onSpeechStart = () => setIsRecording(true);
      Voice.onSpeechEnd = () => setIsRecording(false);
      Voice.onSpeechError = (e: { error?: { code?: string; message?: string } }) => {
        console.error('Speech recognition error', e.error);
        Alert.alert('Speech Error', e.error?.message || 'Could not recognize speech.');
        setIsRecording(false);
      };
      Voice.onSpeechResults = (e: { value?: string[] }) => {
        if (e.value && e.value.length > 0) {
          setRecognizedText(e.value[0]);
          setInputText(e.value[0]); // Populate input field with recognized text
        }
      };
      
      console.log('Starting voice recognition...');
      await Voice.start('en-US');
      console.log('Voice recognition started successfully');
    } catch (e) {
      console.error('Failed to start recording', e);
      Alert.alert('Recording Error', 'Could not start voice recording. Please try again.');
      setIsRecording(false);
    }
  };`;

// Apply the replacements
let updatedContent = content;

// Replace Voice listeners
if (updatedContent.match(voiceListenersPattern)) {
  updatedContent = updatedContent.replace(voiceListenersPattern, voiceListenersReplacement);
  console.log('Successfully replaced Voice listeners setup.');
} else {
  console.log('Warning: Could not find Voice listeners pattern in the file. Trying a direct search approach...');
  
  // Try to find the useEffect that contains Voice listeners
  const useEffectPattern = /useEffect\(\(\) => \{[\s\S]*?Voice\.onSpeechStart[\s\S]*?Voice\.onSpeechResults[\s\S]*?\}, \[\]\);/;
  
  if (updatedContent.match(useEffectPattern)) {
    // Extract the useEffect content
    const useEffectMatch = updatedContent.match(useEffectPattern);
    if (useEffectMatch) {
      const useEffectContent = useEffectMatch[0];
      
      // Create a new useEffect with our replacement
      const newUseEffectContent = useEffectContent.replace(
        /Voice\.onSpeechStart[\s\S]*?Voice\.onSpeechResults[\s\S]*?setInputText\([^;]*\);/,
        voiceListenersReplacement
      );
      
      // Replace the entire useEffect
      updatedContent = updatedContent.replace(useEffectContent, newUseEffectContent);
      console.log('Successfully replaced Voice listeners using alternative approach.');
    }
  } else {
    console.error('Error: Could not find Voice listeners in any useEffect. Manual intervention required.');
    process.exit(1);
  }
}

// Replace startRecording function
if (updatedContent.match(startRecordingPattern)) {
  updatedContent = updatedContent.replace(startRecordingPattern, startRecordingReplacement);
  console.log('Successfully replaced startRecording function.');
} else {
  console.log('Warning: Could not find startRecording pattern in the file. Trying a direct search approach...');
  
  // Try to find the startRecording function with a more general pattern
  const startRecordingFunctionPattern = /const startRecording = async \(\) => \{[\s\S]*?Voice\.start\('en-US'\);[\s\S]*?\};/;
  
  if (updatedContent.match(startRecordingFunctionPattern)) {
    const startRecordingMatch = updatedContent.match(startRecordingFunctionPattern);
    if (startRecordingMatch) {
      updatedContent = updatedContent.replace(startRecordingMatch[0], startRecordingReplacement);
      console.log('Successfully replaced startRecording function using alternative approach.');
    }
  } else {
    console.error('Error: Could not find startRecording function. Manual intervention required.');
    process.exit(1);
  }
}

// Write the updated content back to the file
fs.writeFileSync(chatScreenPath, updatedContent, 'utf8');
console.log(`Successfully updated ${chatScreenPath}`);
console.log('Voice recognition fix has been applied.');
