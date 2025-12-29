import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import { useBoilerData } from './hooks/useBoilerData';
import { TimeControl } from './components/TimeControl';
import { AirControlPanel } from './components/AirControlPanel';
import { SynopticView } from './components/SynopticView';
import { ProcessIndicators } from './components/ProcessIndicators';
import { HistoryGraph } from './components/HistoryGraph';
import { CorrelationChart } from './components/CorrelationChart';
import { AIAnalyst } from './components/AIAnalyst';
import { StatisticalAnalyzer } from './components/StatisticalAnalyzer';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { ForensicPanel } from './components/ForensicPanel';
import { SimulationManager } from './components/SimulationManager';
import { Upload, Moon, Sun, Flame, LogOut, Shield, HelpCircle } from 'lucide-react';

import { HelpModal } from './components/HelpModal';
import { MentorChat } from './components/MentorChat';
import { AlertBanner } from './components/AlertBanner';
import OnboardingGuide, { useOnboarding } from './components/OnboardingGuide';
import { isAdmin as checkIsAdmin } from './services/adminService';

function MainApp() {
  const { user, signOut } = useAuth();
  const boilerData = useBoilerData();
  const { handleFileUpload, setZones, setWasteMix, zones, wasteMix } = boilerData;
  const [darkMode, setDarkMode] = useState(false);
  const [helpTopic, setHelpTopic] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const { showOnboarding, openOnboarding, closeOnboarding } = useOnboarding();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status from Firestore
  useEffect(() => {
    if (user?.email) {
      checkIsAdmin(user.email).then(setIsAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [user?.email]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleLoadConfig = (newZones: any, newWasteMix: any) => {
    setZones(newZones);
    setWasteMix(newWasteMix);
  };

  const openHelp = (topic: string) => setHelpTopic(topic);

  return (
    <div className={`min-h-screen p-4 font-sans pb-20 transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      <div className="max-w-7xl mx-auto">

        {/* Header & Controls */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/20">
                <Flame className="text-white" size={24} strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-700 via-slate-500 to-slate-400 dark:from-white dark:via-slate-200 dark:to-slate-400">
                SOVALEM <span className="text-indigo-500 dark:text-indigo-400 font-mono text-xl">SIMULATOR 2.0</span>
              </h1>
            </div>
            <div className="text-xs text-slate-500 font-medium tracking-widest pl-14 flex gap-4">
              <span>UNITÉ DE VALORISATION ÉNERGÉTIQUE - MONTEREAU</span>
              <span className="text-emerald-500">• LIVE CONNECTED (VIRTUAL)</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User info & Logout */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="hidden md:inline">{user?.email}</span>
              {/* Help/Onboarding Button */}
              <button
                onClick={openOnboarding}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700' : 'bg-white text-emerald-500 hover:bg-emerald-50'} shadow-sm border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}
                title="Guide d'utilisation"
              >
                <HelpCircle size={18} />
              </button>
              {/* Admin Panel Button */}
              {isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 text-indigo-400 hover:bg-slate-700' : 'bg-white text-indigo-500 hover:bg-indigo-50'} shadow-sm border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}
                  title="Panel Admin"
                >
                  <Shield size={18} />
                </button>
              )}
              <button
                onClick={signOut}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 text-red-400 hover:bg-slate-700' : 'bg-white text-red-500 hover:bg-red-50'} shadow-sm border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Time Accelerator */}
            <TimeControl
              timeSpeed={boilerData.timeSpeed}
              setTimeSpeed={boilerData.setTimeSpeed}
              isUnstable={boilerData.isUnstable}
              setIsUnstable={boilerData.setIsUnstable}
            />

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'} shadow-sm border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}
              title={darkMode ? 'Mode Jour' : 'Mode Nuit'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* ALERT BANNER - WITH ANOMALY DETECTION */}
        <AlertBanner
          anomalyState={boilerData.anomalyState}
          sh5Temp={boilerData.simulation.sh5Temp}
          o2={boilerData.simulation.simulatedO2}
          barycenter={boilerData.currentBarycenter}
          onHelp={openHelp}
        />

        {/* MAIN LAYOUT GRID */}
        <div className="space-y-6">

          {/* ROW 1: Settings (Left) & Synoptic (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Simulation Manager (Settings) */}
            <div className="lg:col-span-4 space-y-5">
              <SimulationManager data={boilerData} />

              {/* Configuration & Upload - Kept here for context */}
              <ConfigurationPanel
                currentZones={zones}
                currentWasteMix={wasteMix}
                onLoadConfig={handleLoadConfig}
              />
              {/* File Upload (Compact) */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 text-sm flex items-center gap-2">
                  <Upload size={16} /> Import Données
                </h3>
                <input
                  type="file"
                  accept=".csv"
                  onChange={onFileChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-700 dark:file:text-slate-200"
                />
              </div>
            </div>

            {/* Right: Furnace View (Synoptic) */}
            <div className="lg:col-span-8">
              <SynopticView data={boilerData} onHelp={openHelp} />
            </div>
          </div>

          {/* ROW 2: Indicators (Full Width) */}
          <ProcessIndicators
            data={boilerData}
            sh5Temp={boilerData.simulation.sh5Temp}
            steamFlow={boilerData.steamTarget}
            o2={boilerData.simulation.simulatedO2}
            onHelp={openHelp}
          />

          {/* ROW 3: Air Controls (Horizontal) */}
          <AirControlPanel data={boilerData} />

          {/* ROW 4: Analysis & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-5">
              <HistoryGraph data={boilerData} />
              <AIAnalyst data={boilerData} onHelp={openHelp} />
            </div>
            <div className="space-y-5">
              <CorrelationChart data={boilerData} />
              <StatisticalAnalyzer data={boilerData} />
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: Config & Analysis */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <ConfigurationPanel
              currentZones={zones}
              currentWasteMix={wasteMix}
              onLoadConfig={handleLoadConfig}
            />
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 text-sm flex items-center gap-2">
                <Upload size={16} /> Import Données (CSV)
              </h3>
              <input
                type="file"
                accept=".csv"
                onChange={onFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-700 dark:file:text-slate-200"
              />
            </div>
          </div>
          <ForensicPanel data={boilerData} />
        </div>

      </div> {/* End max-w-7xl */}

      {/* GLOBAL MODALS */}
      <HelpModal topicKey={helpTopic} onClose={() => setHelpTopic(null)} />
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      {showOnboarding && <OnboardingGuide onClose={closeOnboarding} />}
      <MentorChat data={boilerData} />
    </div>
  );
}

function AppWithAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <MainApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

export default App;
