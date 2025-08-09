import React, { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Float, Sparkles } from '@react-three/drei'

function Knot({ color = '#60a5fa' }){
  return (
    <Float speed={1.2} rotationIntensity={0.8} floatIntensity={0.6}>
      <mesh castShadow receiveShadow rotation={[0.6, 0.2, 0.1]}> 
        <torusKnotGeometry args={[1.2, 0.35, 220, 32]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.25} />
      </mesh>
    </Float>
  )
}

function Orbs(){
  const positions = useMemo(()=> Array.from({length:10},(_,i)=>({
    x: (Math.random()-0.5)*10,
    y: (Math.random()-0.5)*6,
    z: (Math.random()-0.5)*-6 - 4,
    s: Math.random()*0.6+0.2
  })),[])
  return (
    <group>
      {positions.map((p,i)=> (
        <Float key={i} speed={1+(i%3)*0.2} rotationIntensity={0.5} floatIntensity={0.5}> 
          <mesh position={[p.x,p.y,p.z]}> 
            <sphereGeometry args={[p.s, 24, 24]} />
            <meshStandardMaterial color={ i%2 ? '#a78bfa' : '#34d399' } emissiveIntensity={0.25} emissive={ i%2 ? '#6b46c1' : '#064e3b' } />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

export default function Scene(){
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    <div className="r3f-stage" aria-hidden>
  // Removed 3D Scene (three.js) per design: lean glassmorphism, no 3D background.
    return null
    </div>
  )
}
