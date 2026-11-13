import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Sidebar } from '../components/Layout/Sidebar.jsx';
import { Header } from '../components/Layout/Header.jsx';
import { TopologyGraph } from '../components/Topology/TopologyGraph.jsx';

describe('Frontend Components', () => {
  it('renders Sidebar with all required navigation items', () => {
    const setTab = vi.fn();
    render(<Sidebar currentTab="dashboard" setTab={setTab} />);

    expect(screen.getByText('NetAssistant')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Network Diagnosis')).toBeInTheDocument();
    expect(screen.getByText('Network Topology')).toBeInTheDocument();
    expect(screen.getByText('Troubleshooting Assistant')).toBeInTheDocument();
    expect(screen.getByText('Diagnostic History')).toBeInTheDocument();
    expect(screen.getByText('FLAT Engine & DFA')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders Header with simulation mode button and title', () => {
    const setIsSimulated = vi.fn();
    render(
      <Header 
        currentTab="dashboard" 
        isSimulated={false} 
        setIsSimulated={setIsSimulated} 
      />
    );

    expect(screen.getByText('Operations Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Mode: Live Network/i)).toBeInTheDocument();
  });

  it('renders TopologyGraph with devices', () => {
    const sampleDevices = [
      { _id: 'dev-1', name: 'Gateway', ip: '192.168.1.1', deviceType: 'gateway', status: 'active', connections: ['dev-2'] },
      { _id: 'dev-2', name: 'Switch', ip: '192.168.1.2', deviceType: 'switch', status: 'active', connections: [] }
    ];

    render(<TopologyGraph devices={sampleDevices} />);
    expect(screen.getByText('Gateway')).toBeInTheDocument();
    expect(screen.getByText('Switch')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });
});
