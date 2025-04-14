import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Environment, ContactShadows, Stage } from '@react-three/drei';
import { Vector3 } from 'three';
import { useAuth } from '@/contexts/AuthContext';

// Componente do modelo 3D
function Character({ skinId = 'default', animation = 'idle', scale = 1.8, ...props }) {
  const group = useRef();
  const { scene, animations } = useGLTF(`/models/character/${skinId}.glb`);
  const { actions, names } = useAnimations(animations, group);
  
  // Aplicar animação
  useEffect(() => {
    // Certifique-se de que a animação existe
    const anim = animation && names.includes(animation) ? animation : 'idle';
    
    // Resetar animações anteriores
    Object.values(actions).forEach(action => action.stop());
    
    // Iniciar nova animação
    if (actions[anim]) {
      actions[anim].reset().play();
      actions[anim].setEffectiveTimeScale(1);
      actions[anim].setLoop(animation === 'dance' ? 2 : 1, Infinity);
    }
  }, [actions, animation, names]);

  // Animação suave de rotação quando não está sob controle do usuário
  useFrame((state) => {
    if (group.current && !props.userControlled) {
      group.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.2;
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive 
        object={scene} 
        scale={[scale, scale, scale]} 
        position={[0, props.positionY || -1.8, 0]} 
      />
    </group>
  );
}

// Loader para modelos 3D
function ModelLoader({ url }) {
  useGLTF.preload(url);
  return null;
}

// Componente principal para visualização do personagem
export default function CharacterViewer({
  skinId = 'default',
  animation = 'idle',
  controls = true,
  autoRotate = false,
  background = 'transparent',
  height = 400,
  width = '100%',
  showInfo = false,
  quality = 'medium',
  positionY = -1.8,
  onInteract = () => {},
  className = '',
}) {
  const { user } = useAuth();
  const [currentSkin, setCurrentSkin] = useState(skinId);
  
  // Use a skin do usuário se disponível
  useEffect(() => {
    if (user?.activeSkin && skinId === 'user') {
      setCurrentSkin(user.activeSkin);
    } else {
      setCurrentSkin(skinId);
    }
  }, [skinId, user]);
  
  // Preload de modelos populares
  const popularSkins = ['default', 'ninja', 'soldier', 'explorer', 'cyber'];
  
  return (
    <div 
      className={`character-viewer relative ${className}`} 
      style={{ 
        height: height, 
        width: width,
        borderRadius: '8px',
        overflow: 'hidden',
      }}
      onClick={onInteract}
    >
      <Canvas 
        shadows 
        dpr={[1, quality === 'high' ? 2 : 1.5]} 
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background }}
      >
        <Suspense fallback={null}>
          <Stage 
            environment={background !== 'transparent' ? 'city' : null}
            intensity={0.5}
            contactShadow={{ opacity: 0.5, blur: 2 }}
          >
            <Character 
              skinId={currentSkin} 
              animation={animation} 
              positionY={positionY}
              userControlled={controls && !autoRotate}
            />
          </Stage>
          
          <ContactShadows
            opacity={0.4}
            scale={10}
            blur={2}
            far={10}
            resolution={256}
            color="#000000"
          />
          
          {background !== 'transparent' && (
            <Environment preset="city" />
          )}
        </Suspense>
        
        {controls && (
          <OrbitControls 
            autoRotate={autoRotate} 
            autoRotateSpeed={4} 
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2}
          />
        )}
      </Canvas>
      
      {showInfo && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
          <p className="font-medium">Skin: {currentSkin}</p>
        </div>
      )}
      
      {/* Preload de modelos populares */}
      {popularSkins.map(skin => (
        <ModelLoader key={skin} url={`/models/character/${skin}.glb`} />
      ))}
    </div>
  );
} 