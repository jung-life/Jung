// Script to test if location permissions are working correctly

import * as Location from 'expo-location';

async function testLocationPermissions() {
  console.log('Testing location permissions...');
  
  try {
    console.log('Requesting location permission...');
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    console.log(`Permission status: ${status}`);
    
    if (status !== 'granted') {
      console.error('Location permission denied!');
      return;
    }
    
    console.log('Location permission granted. Fetching current position...');
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    console.log('Location fetched successfully:');
    console.log(`Latitude: ${location.coords.latitude}`);
    console.log(`Longitude: ${location.coords.longitude}`);
    console.log(`Accuracy: ${location.coords.accuracy} meters`);
    
    if (location.coords.altitude !== null) {
      console.log(`Altitude: ${location.coords.altitude} meters`);
    }
    
    console.log('Location permissions are working correctly!');
  } catch (error) {
    console.error('Error testing location permissions:');
    console.error(error);
  }
}

// Export the function so it can be imported and used in other files
export default testLocationPermissions;

// If this file is run directly, execute the test
if (require.main === module) {
  testLocationPermissions();
}
