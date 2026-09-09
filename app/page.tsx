'use client';
import { useAppStore } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ToastContainer from '@/components/Toast';
import dynamic from 'next/dynamic';

// Screens
import LandingScreen from '@/screens/LandingScreen';
import DashboardScreen from '@/screens/DashboardScreen';
import AlertsScreen from '@/screens/AlertsScreen';
import WaterQualityScreen from '@/screens/WaterQualityScreen';
import EnvironmentalScreen from '@/screens/EnvironmentalScreen';
import PredictiveScreen from '@/screens/PredictiveScreen';
import CommunityReportScreen from '@/screens/CommunityReportScreen';
import ResponseScreen from '@/screens/ResponseScreen';
import ImpactScreen from '@/screens/ImpactScreen';
import DispatchScreen from '@/screens/DispatchScreen';
import ReportsScreen from '@/screens/ReportsScreen';
import ArchitectureScreen from '@/screens/ArchitectureScreen';
import PrivacyScreen from '@/screens/PrivacyScreen';
import RoadmapScreen from '@/screens/RoadmapScreen';

// Map needs dynamic import (uses window)
const MapScreen = dynamic(() => import('@/screens/MapScreen'), { ssr: false });

const SCREENS: Record<string, React.ComponentType> = {
  landing:       LandingScreen,
  dashboard:     DashboardScreen,
  map:           MapScreen,
  alerts:        AlertsScreen,
  water:         WaterQualityScreen,
  environmental: EnvironmentalScreen,
  predictive:    PredictiveScreen,
  community:     CommunityReportScreen,
  response:      ResponseScreen,
  dispatch:      DispatchScreen,
  reports:       ReportsScreen,
  impact:        ImpactScreen,
  architecture:  ArchitectureScreen,
  privacy:       PrivacyScreen,
  roadmap:       RoadmapScreen,
};

export default function Home() {
  const { currentScreen } = useAppStore();
  const Screen = SCREENS[currentScreen] ?? DashboardScreen;
  const isLanding = currentScreen === 'landing';

  if (isLanding) {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-body), sans-serif' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar />
          <Screen />
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-body), sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <Screen />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
