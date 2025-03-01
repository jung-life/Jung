import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { useGLTF } from '@react-three/drei/native';
import * as THREE from 'three';
import tw from '../lib/tailwind';

// Define avatar models with their paths
const AVATAR_MODELS = {
  jung: require('../assets/models/jung.glb'),
  freud: require('../assets/models/freud.glb'),
  adler: require('../assets/models/adler.glb'),
  horney: require('../assets/models/horney.glb'),
  morpheus: require('../assets/models/morpheus.glb'),
  oracle: require('../assets/models/oracle.glb'),
  // Add fallback model
  default: require('../assets/models/default_avatar.glb'),
};

// Model component that renders the 3D model
function Model({ avatarId, rotate = true }) {
  const modelPath = AVATAR_MODELS[avatarId] || AVATAR_MODELS.default;
  const { scene } = useGLTF(modelPath);
  const modelRef = useRef();
  
  // Clone the scene to avoid issues
  const clonedScene = React.useMemo(() => {
    return scene.clone();
  }, [scene]);
  
  // Add rotation animation
  useFrame((state, delta) => {
    if (modelRef.current && rotate) {
      modelRef.current.rotation.y += delta * 0.5; // Slow rotation
    }
  });
  
  return (
    <primitive 
      ref={modelRef}
      object={clonedScene} 
      position={[0, -1, 0]} 
      scale={2.5} 
    />
  );
}

// Main Avatar3D component
export const Avatar3D = ({ 
  avatarId = 'jung', 
  size = 150, 
  rotate = true,
  style = {}
}) => {
  return (
    <View style={[
      { width: size, height: size, borderRadius: size / 2 },
      tw`overflow-hidden bg-gray-100`,
      style
    ]}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ flex: 1 }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={0.8} 
          color="#ffffff" 
        />
        <directionalLight 
          position={[-10, -10, -5]} 
          intensity={0.4} 
          color="#ffffff" 
        />
        <Model avatarId={avatarId} rotate={rotate} />
      </Canvas>
    </View>
  );
};

// Preload all models
export const preloadAvatarModels = async () => {
  const promises = Object.values(AVATAR_MODELS).map(model => {
    return useGLTF.preload(model);
  });
  await Promise.all(promises);
}; 