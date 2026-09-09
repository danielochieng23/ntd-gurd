'use client';
import { create } from 'zustand';
import { ALERTS, INTERVENTIONS, Alert, Intervention, getCurrentState, CommunityState } from './data';
import type { DispatchResult } from './messaging';

interface DemoEvent {
  step: number;
  label: string;
  description: string;
}

interface AppState {
  // Navigation
  currentScreen: string;
  setScreen: (s: string) => void;

  // Selected community
  selectedCommunityId: string | null;
  setSelectedCommunity: (id: string | null) => void;

  // Alerts
  alerts: Alert[];
  selectedAlertId: string | null;
  setSelectedAlert: (id: string | null) => void;

  // Interventions
  interventions: Intervention[];
  addIntervention: (i: Intervention) => void;
  updateIntervention: (id: string, updates: Partial<Intervention>) => void;

  // Community states (can be modified by demo mode)
  communityStates: CommunityState[];

  // Demo mode
  demoActive: boolean;
  demoStep: number;
  demoEvents: DemoEvent[];
  activateDemoMode: () => void;
  advanceDemoStep: () => void;
  resetDemo: () => void;

  // Early-warning dispatch outbox
  dispatches: DispatchResult[];
  addDispatch: (d: DispatchResult) => void;

  // Toast notifications
  toasts: { id: string; type: string; title: string; body: string }[];
  addToast: (type: string, title: string, body: string) => void;
  removeToast: (id: string) => void;
}

const DEMO_EVENTS: DemoEvent[] = [
  { step: 1, label: 'Heavy Rainfall Detected',       description: 'Rainfall +68% above seasonal average in Busia Zone 4' },
  { step: 2, label: 'Flood Exposure Increased',       description: 'Flood risk elevated to 84/100. Low-lying water sources at risk.' },
  { step: 3, label: 'Water Quality Deteriorating',   description: 'Turbidity spike: 18.4 NTU. E. coli: 340 CFU/100mL. Chlorine depleted.' },
  { step: 4, label: 'Community Symptoms Increase',   description: 'CHW report: 28 diarrhea cases, 8 suspected cholera — 340% increase vs baseline.' },
  { step: 5, label: 'Risk Score Escalated: 82/100',  description: 'NTD GURD raised risk from 47 → 82. CRITICAL alert generated.' },
  { step: 6, label: 'Response Team Assigned',        description: 'Field Team 03 dispatched. ORS kits deployed to 180 households.' },
  { step: 7, label: 'Water Testing Underway',        description: 'WP-B4-01, WP-B4-03, WP-B4-07 under investigation. Prevention messaging active.' },
  { step: 8, label: 'Risk Trajectory Improving',     description: 'Early intervention limiting spread. Projected 7-day risk declining to 68.' },
];

export const useAppStore = create<AppState>((set, get) => ({
  currentScreen: 'landing',
  setScreen: (s) => set({ currentScreen: s }),

  selectedCommunityId: null,
  setSelectedCommunity: (id) => set({ selectedCommunityId: id }),

  selectedAlertId: null,
  setSelectedAlert: (id) => set({ selectedAlertId: id }),

  alerts: ALERTS,
  interventions: INTERVENTIONS,

  communityStates: getCurrentState(),

  addIntervention: (i) => set(s => ({ interventions: [...s.interventions, i] })),
  updateIntervention: (id, updates) =>
    set(s => ({ interventions: s.interventions.map(i => i.id === id ? { ...i, ...updates } : i) })),

  demoActive: false,
  demoStep: 0,
  demoEvents: DEMO_EVENTS,

  activateDemoMode: () => {
    set({ demoActive: true, demoStep: 1 });
    get().addToast('warning', 'Demo Mode Active', 'Investor simulation: Heavy Rainfall Event — Busia Zone 4');
  },

  advanceDemoStep: () => {
    const { demoStep, addToast, demoEvents } = get();
    const next = demoStep + 1;
    if (next <= demoEvents.length) {
      set({ demoStep: next });
      const ev = demoEvents[next - 1];
      addToast(next >= 5 ? 'error' : 'warning', ev.label, ev.description);
    }
    if (next === 5) {
      // Escalate Busia Zone 4 risk
      set(s => ({
        communityStates: s.communityStates.map(c =>
          c.id === 'C002' ? { ...c, riskScore: 82, riskLevel: 'CRITICAL' as const, trend: 35 } : c
        ),
      }));
    }
    if (next > demoEvents.length) {
      set({ demoActive: false, demoStep: 0 });
      addToast('success', 'Demo Complete', 'Early intervention successful. Risk trajectory improving.');
    }
  },

  resetDemo: () => set({ demoActive: false, demoStep: 0, communityStates: getCurrentState() }),

  dispatches: [],
  addDispatch: (d) => set(s => ({ dispatches: [d, ...s.dispatches] })),

  toasts: [],
  addToast: (type, title, body) => {
    const id = Math.random().toString(36).slice(2);
    set(s => ({ toasts: [...s.toasts, { id, type, title, body }] }));
    setTimeout(() => get().removeToast(id), 5000);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
