import React, { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar.jsx';
import { Header } from './components/Layout/Header.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { NetworkDiagnosis } from './pages/NetworkDiagnosis.jsx';
import { TroubleshootingAssistant } from './pages/TroubleshootingAssistant.jsx';
import { NetworkTopology } from './pages/NetworkTopology.jsx';
import { DiagnosticHistory } from './pages/DiagnosticHistory.jsx';
import { FlatDemonstration } from './pages/FlatDemonstration.jsx';
import { Settings } from './pages/Settings.jsx';

export function App() {
  const [currentTab, setTab] = useState('dashboard');
  const [isSimulated, setIsSimulated] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);

  function handleViewReport(reportId) {
    setSelectedReportId(reportId);
    setTab('diagnosis');
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Left Sidebar */}
      <Sidebar currentTab={currentTab} setTab={setTab} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header 
          currentTab={currentTab} 
          isSimulated={isSimulated} 
          setIsSimulated={setIsSimulated} 
        />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard 
              onNavigate={setTab} 
              onViewReport={handleViewReport} 
            />
          )}

          {currentTab === 'diagnosis' && (
            <NetworkDiagnosis 
              isSimulated={isSimulated} 
              setIsSimulated={setIsSimulated} 
              initialReportId={selectedReportId} 
            />
          )}

          {currentTab === 'topology' && (
            <NetworkTopology />
          )}

          {currentTab === 'assistant' && (
            <TroubleshootingAssistant 
              isSimulated={isSimulated} 
            />
          )}

          {currentTab === 'history' && (
            <DiagnosticHistory 
              onSelectReport={handleViewReport} 
            />
          )}

          {currentTab === 'flat' && (
            <FlatDemonstration />
          )}

          {currentTab === 'settings' && (
            <Settings 
              isSimulated={isSimulated} 
              setIsSimulated={setIsSimulated} 
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
