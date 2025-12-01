// components/quantum/timeline-3d.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { TimelineData, TimelinePoint } from '@/lib/quantum/timeline-simulator';

export interface Timeline3DProps {
  timelineData: TimelineData;
  currentPosition: number;
  onTimelineNavigation?: (position: number) => void;
  renderMode?: '2D' | '3D' | 'VR';
  interactionMode?: 'exploration' | 'simulation' | 'analysis';
}

export function Timeline3D({
  timelineData,
  currentPosition,
  onTimelineNavigation,
  renderMode = '3D',
  interactionMode = 'exploration'
}: Timeline3DProps) {
  
  if (renderMode === '2D') {
    return <Timeline2DFallback data={timelineData} />;
  }

  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 5, 10], fov: 60 }}
        className="bg-black"
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* Stars Background */}
        <Stars radius={100} depth={50} count={5000} factor={4} fade />

        {/* Timeline */}
        <TimelinePath
          points={[...timelineData.past, ...timelineData.present, ...timelineData.future]}
          currentPosition={currentPosition}
          onPointClick={onTimelineNavigation}
        />

        {/* Camera Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-4 left-4 rounded-lg border border-purple-500/30 bg-black/50 p-4 backdrop-blur-md">
          <h3 className="mb-2 font-semibold text-white">Timeline Navigation</h3>
          <p className="text-sm text-gray-400">
            Scroll to zoom • Drag to rotate • Click nodes to navigate
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 3D COMPONENTS
// ============================================

function TimelinePath({ 
  points, 
  currentPosition, 
  onPointClick 
}: {
  points: TimelinePoint[];
  currentPosition: number;
  onPointClick?: (position: number) => void;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Create curve through points
  const curve = new THREE.CatmullRomCurve3(
    points.map((p, i) => new THREE.Vector3(i * 2, Math.sin(i * 0.5) * 2, 0))
  );

  // Animate line
  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group>
      {/* Timeline Path */}
      <mesh>
        <tubeGeometry args={[curve, 100, 0.1, 8, false]} />
        <meshStandardMaterial
          color="#8B5CF6"
          emissive="#8B5CF6"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Timeline Nodes */}
      {points.map((point, index) => {
        const position = curve.getPointAt(index / (points.length - 1));
        const isCurrent = index === currentPosition;
        const isHovered = index === hoveredIndex;

        return (
          <TimelineNode
            key={index}
            position={position}
            point={point}
            isCurrent={isCurrent}
            isHovered={isHovered}
            onHover={() => setHoveredIndex(index)}
            onUnhover={() => setHoveredIndex(null)}
            onClick={() => onPointClick?.(index)}
          />
        );
      })}
    </group>
  );
}

function TimelineNode({
  position,
  point,
  isCurrent,
  isHovered,
  onHover,
  onUnhover,
  onClick
}: any) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Animate node
  useFrame((state) => {
    if (meshRef.current) {
      if (isCurrent) {
        meshRef.current.scale.setScalar(
          1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2
        );
      } else if (isHovered) {
        meshRef.current.scale.setScalar(1.3);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  const color = point.type === 'past' 
    ? '#8B5CF6' 
    : point.type === 'present' 
    ? '#EC4899' 
    : '#3B82F6';

  return (
    <group position={position}>
      {/* Node Sphere */}
      <Sphere
        ref={meshRef}
        args={[0.3, 32, 32]}
        onPointerOver={onHover}
        onPointerOut={onUnhover}
        onClick={onClick}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isCurrent ? 1 : 0.5}
        />
      </Sphere>

      {/* Label */}
      {(isCurrent || isHovered) && (
        <Text
          position={[0, 1, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {point.event}
        </Text>
      )}

      {/* Glow Effect */}
      <Sphere args={[0.5, 16, 16]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isCurrent ? 0.3 : 0.1}
        />
      </Sphere>
    </group>
  );
}

// ============================================
// 2D FALLBACK
// ============================================

function Timeline2DFallback({ data }: { data: TimelineData }) {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-950 via-black to-blue-950 p-8">
      <div className="w-full max-w-6xl">
        <div className="relative h-64">
          {/* Past */}
          <div className="absolute left-0 top-0 h-full w-1/3 border-r border-purple-500/50 p-6">
            <h3 className="mb-4 text-purple-400 font-semibold">Past</h3>
            <div className="space-y-2">
              {data.past.slice(0, 3).map((point, i) => (
                <div key={i} className="text-sm text-purple-200">
                  • {point.event}
                </div>
              ))}
            </div>
          </div>

          {/* Present */}
          <div className="absolute left-1/3 top-0 h-full w-1/3 flex items-center justify-center border-r border-pink-500/50">
            <div className="text-center">
              <div className="mb-2 text-5xl">⭐</div>
              <div className="text-pink-400 font-semibold">NOW</div>
            </div>
          </div>

          {/* Future */}
          <div className="absolute right-0 top-0 h-full w-1/3 p-6">
            <h3 className="mb-4 text-blue-400 font-semibold">Future</h3>
            <div className="space-y-2">
              {data.future.slice(0, 3).map((point, i) => (
                <div key={i} className="text-sm text-blue-200">
                  • {point.event}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Timeline3D;