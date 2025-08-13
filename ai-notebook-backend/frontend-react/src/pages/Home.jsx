
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import Lottie from "lottie-react";
import heroLottie from "../assets/hero-lottie.json";

function AnimatedSphere() {
  // Simple animated 3D sphere with floating effect
  const meshRef = useRef();
  return (
    <mesh ref={meshRef} position={[0, 0, 0]} castShadow receiveShadow>
      <sphereGeometry args={[1.6, 64, 64]} />
      <meshStandardMaterial color="#3b82f6" metalness={0.7} roughness={0.2} />
    </mesh>
  );
}

function Hero3DBackground() {
  return (
    <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} shadows>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
        <Suspense fallback={null}>
          <AnimatedSphere />
        </Suspense>
      </Canvas>
    </div>
  );
}

const features = [
  {
    icon: "📄",
    title: "Upload Anything",
    desc: "PDFs, images, YouTube links, and web pages—StudyLM ingests it all for you.",
    color: "from-cyan-400 to-blue-500"
  },
  {
    icon: "💬",
    title: "Ask & Chat",
    desc: "Ask questions, chat with your notes, and get instant, AI-powered answers.",
    color: "from-pink-400 to-fuchsia-500"
  },
  {
    icon: "📝",
    title: "Take Notes",
    desc: "Organize, highlight, and export your notes for seamless studying.",
    color: "from-yellow-300 to-orange-400"
  },
];


export default function Home({ base = '', navigate }) {
  // Use navigate prop for SPA navigation if available
  const handleGetStarted = () => {
    if (typeof navigate === 'function') {
      navigate('notebooks');
    } else {
      window.location.href = "/notebooks";
    }
  };
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-x-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0a0f1a] text-white">
      {/* 3D Animated Background */}
      <Hero3DBackground />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-24 pb-10 flex flex-col items-center sm:pt-32 sm:pb-12"
        aria-label="Landing Hero"
      >
        <div className="w-32 h-32 xs:w-40 xs:h-40 sm:w-44 sm:h-44 md:w-60 md:h-60 mb-4 sm:mb-6 drop-shadow-2xl">
          <Lottie animationData={heroLottie} loop={true} aria-label="Animated StudyLM Logo" />
        </div>
        <motion.h1
          className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-extrabold text-center bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-xl mb-3 sm:mb-4 leading-tight"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          StudyLM
        </motion.h1>
        <motion.p
          className="text-base xs:text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-center max-w-xl sm:max-w-2xl opacity-90"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Your AI-powered notebook for smarter, faster, and more interactive studying. Upload PDFs, images, or links, ask questions, and take notes—all in one place.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <button
            onClick={handleGetStarted}
            className="px-7 py-3 sm:px-10 sm:py-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold text-base sm:text-lg shadow-xl hover:scale-105 hover:shadow-2xl transition-transform duration-200 border-2 border-white/10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
            aria-label="Get Started with StudyLM"
          >
            Get Started
          </button>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="relative z-10 w-full max-w-6xl mx-auto px-2 xs:px-4 pb-16 sm:pb-24 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        aria-label="Key Features"
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className={`rounded-3xl p-6 sm:p-8 flex flex-col items-center shadow-2xl bg-gradient-to-br ${f.color} bg-opacity-80 backdrop-blur-lg border border-white/10 hover:scale-105 transition-transform duration-300`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.2, duration: 0.7, type: "spring" }}
            tabIndex={0}
            aria-label={f.title}
          >
            <span className="text-4xl sm:text-5xl mb-2 sm:mb-3 animate-bounce-slow drop-shadow-lg" aria-hidden="true">{f.icon}</span>
            <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 text-white drop-shadow-md">{f.title}</h2>
            <p className="text-center opacity-90 text-sm sm:text-lg">{f.desc}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* Subtle animated gradient overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-60 animate-gradient-move bg-gradient-to-tr from-cyan-400/20 via-fuchsia-400/10 to-blue-400/20" aria-hidden="true" />
    </div>
  );
}
