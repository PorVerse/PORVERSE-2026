// components/layout/portal-layout.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Settings, User, Bell } from 'lucide-react';
import { ReactNode, useState } from 'react';

import PortalNavigation from '@/components/navigation/portal-navigation';
import { Portal } from '@/types';

export interface PortalLayoutProps {
  children: ReactNode;
  portal: Portal;
  showBiometricOverlay?: boolean;
  showAIAssistant?: boolean;
  navigationVariant?: 'minimal' | 'full' | 'immersive';
  backgroundEffects?: boolean;
}

export function PortalLayout({
  children,
  portal,
  showBiometricOverlay: _showBiometricOverlay = false,
  showAIAssistant = false,
  navigationVariant = 'full',
  backgroundEffects = true
}: PortalLayoutProps) {
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Animated Background */}
      {backgroundEffects && (
        <AnimatedBackground portalTheme={portal.color_scheme} />
      )}

      {/* Top Navigation Bar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-black/50 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-4">
          {/* Logo & Portal Name */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white transition-colors hover:text-purple-400 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div>
              <h1 className="text-xl font-bold text-white">
                {portal.name}
              </h1>
              <p className="text-xs text-gray-400">Portal {portal.id}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative text-gray-400 transition-colors hover:text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500" />
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-400 transition-colors hover:text-white"
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* User */}
            <button className="text-gray-400 transition-colors hover:text-white">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {(isSidebarOpen || navigationVariant === 'full') && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-80 border-r border-white/10 bg-black/90 pt-20 backdrop-blur-xl lg:relative lg:z-30"
          >
            {/* Close button (mobile only) */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation Content */}
            <div className="h-full overflow-y-auto p-6">
              <PortalNavigation
                currentPortal={portal}
                variant="sidebar"
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main 
        className={`
          relative z-10 min-h-screen pt-20
          ${navigationVariant === 'full' ? 'lg:pl-80' : ''}
        `}
      >
        <div className="mx-auto max-w-screen-2xl p-6">
          {children}
        </div>
      </main>

      {/* Biometric Overlay */}
      {/* TODO: Re-enable when BiometricStatus component is implemented */}
      {/* {showBiometricOverlay && (
        <BiometricStatus position="bottom-right" />
      )} */}

      {/* AI Assistant */}
      {showAIAssistant && (
        <AIAssistantWidget portalId={portal.id} />
      )}

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function AnimatedBackground({ portalTheme: _portalTheme }: { portalTheme: any }) {
  return (
    <div className="fixed inset-0 z-0">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-black to-blue-950 opacity-50" />

      {/* Animated Orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl"
      />

      <motion.div
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
      />

      {/* Noise Texture */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5" />
    </div>
  );
}

function AIAssistantWidget({ portalId: _portalId }: { portalId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-96 rounded-2xl border border-purple-500/30 bg-black/90 p-6 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-64 overflow-y-auto">
            <p className="text-sm text-gray-400">
              How can I help you with this portal?
            </p>
          </div>

          <div className="mt-4">
            <input
              type="text"
              placeholder="Ask a question..."
              className="w-full rounded-lg border border-purple-500/30 bg-black/50 px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </motion.div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-2xl shadow-lg"
        >
          🤖
        </motion.button>
      )}
    </div>
  );
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-purple-500/30 bg-black p-8"
      >
        <h2 className="mb-6 text-2xl font-bold text-white">Settings</h2>

        {/* Settings Content */}
        <div className="space-y-6">
          {/* Biometric Settings */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-white">
              Biometric Settings
            </h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Enable scanning</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Privacy mode</span>
                <input type="checkbox" className="toggle" />
              </label>
            </div>
          </div>

          {/* AI Settings */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-white">
              AI Adaptation
            </h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Personality adaptation</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Emotional support</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </label>
            </div>
          </div>

          {/* Appearance */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-white">
              Appearance
            </h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Background effects</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Animations</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </label>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-8 w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 py-3 font-semibold text-white"
        >
          Save Changes
        </button>
      </motion.div>
    </motion.div>
  );
}

export default PortalLayout;