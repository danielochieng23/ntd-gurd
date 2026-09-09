'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ALERTS } from '@/lib/data';
import RiskBadge from '@/components/RiskBadge';
import { Page, Grid, Card, Table, Th, Td, T } from '@/components/ui';

const TEAMS = ['Field Team 03', 'Field Team 07', 'CHW Network Busia', 'WASH Engineer Team', 'Rapid Response Unit', 'Communication Team', 'District Health Office'];

const statusColor: Record<string, string> = { 'Pending': T.muted, 'In Progress': T.teal, 'Completed': T.green };
const priorityColor: Record<string, string> = { 'Critical': T.coral, 'High': '#c47d00', 'Medium': T.teal, 'Low': T.muted };

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase',
  letterSpacing: '0.6px', display: 'block', marginBottom: 6,
};
const fieldStyle: React.CSSProperties = {
  width: '100%', height: 36, padding: '0 10px', border: `1.5px solid ${T.border}`,
  borderRadius: 5, fontSize: 13, background: 'white', color: T.ink,
};

export default function ResponseScreen() {
  const { interventions, updateIntervention, addIntervention, addToast, alerts } = useAppStore();
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAction, setNewAction] = useState({ action: '', assignedTo: 'Field Team 03', priority: 'High' as const, alertId: 'A001', due: '2026-09-04', notes: '' });

  const stages = [
    { label: 'Risk Detected', icon: '⚑', count: alerts.filter(a => a.status === 'Active').length },
    { label: 'Investigation', icon: '◎', count: alerts.filter(a => a.status === 'Investigating').length },
    { label: 'Response Assigned', icon: '⊸', count: alerts.filter(a => a.status === 'Response Assigned').length },
    { label: 'Intervention', icon: '⊶', count: interventions.filter(i => i.status === 'In Progress').length },
    { label: 'Completed', icon: '✓', count: interventions.filter(i => i.status === 'Completed').length },
  ];

  function handleAddIntervention() {
    if (!newAction.action) return;
    const id = `INT${Date.now()}`;
    addIntervention({ id, ...newAction, status: 'Pending' });
    setShowNewForm(false);
    setNewAction({ action: '', assignedTo: 'Field Team 03', priority: 'High', alertId: 'A001', due: '2026-09-04', notes: '' });
    addToast('success', 'Action Assigned', `"${newAction.action}" assigned to ${newAction.assignedTo}`);
  }

  return (
    <Page>
      {/* Pipeline — equal-width stages with arrows in their own tracks */}
      <Card title="Response Pipeline — From Surveillance to Action">
        <div style={{
          display: 'grid',
          gridTemplateColumns: stages.map(() => 'minmax(0,1fr)').join(' 22px '),
          alignItems: 'stretch',
        }}>
          {stages.map((s, i) => {
            const active = s.count > 0;
            return [
              <div key={s.label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                textAlign: 'center', padding: '14px 8px', borderRadius: 6,
                background: active ? T.deep : T.surface,
                border: `1px solid ${active ? T.deep : '#e8f0f1'}`,
                minWidth: 0,
              }}>
                <div style={{ fontSize: 16, lineHeight: 1, color: active ? T.gold : T.muted }}>{s.icon}</div>
                <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 500, marginTop: 6, lineHeight: 1, color: active ? 'white' : T.border }}>
                  {s.count}
                </div>
                <div style={{ fontSize: 10, marginTop: 6, lineHeight: 1.3, minHeight: 26, color: active ? 'rgba(255,255,255,0.6)' : T.muted }}>
                  {s.label}
                </div>
              </div>,
              i < stages.length - 1 && (
                <div key={`${s.label}-arrow`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: T.border }}>
                  →
                </div>
              ),
            ];
          })}
        </div>
      </Card>

      <Card
        title="Alert Response Status"
        right={
          <button
            onClick={() => setShowNewForm(true)}
            style={{
              height: 32, padding: '0 14px', background: T.teal, color: 'white', border: 'none', borderRadius: 5,
              fontFamily: T.heading, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            + Assign New Action
          </button>
        }
      >
        <Grid cols={2} gap={10}>
          {ALERTS.map(alert => (
            <div key={alert.id} style={{
              padding: '12px 14px', borderRadius: 7, border: `1px solid ${T.hair}`, background: '#fafcfc',
              display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'start', columnGap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {alert.communityName}
                </div>
                <RiskBadge level={alert.riskLevel} />
              </div>
              <div style={{
                fontSize: 11, fontWeight: 600, marginTop: 6,
                color: alert.status === 'Active' ? T.coral : alert.status === 'Resolved' ? T.green : T.gold,
              }}>
                ● {alert.status}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 'auto', paddingTop: 4 }}>
                {interventions.filter(i => i.alertId === alert.id).length} actions assigned ·{' '}
                {interventions.filter(i => i.alertId === alert.id && i.status === 'Completed').length} completed
              </div>
            </div>
          ))}
        </Grid>
      </Card>

      {showNewForm && (
        <Card title="Assign New Response Action" style={{ border: `1.5px solid ${T.teal}` }}>
          <Grid cols={2} gap={12}>
            <div>
              <label style={labelStyle}>Action</label>
              <input
                value={newAction.action}
                onChange={e => setNewAction({ ...newAction, action: e.target.value })}
                placeholder="e.g. Inspect water source WP-XX-01"
                style={fieldStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Assigned To</label>
              <select value={newAction.assignedTo} onChange={e => setNewAction({ ...newAction, assignedTo: e.target.value })} style={fieldStyle}>
                {TEAMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Alert</label>
              <select value={newAction.alertId} onChange={e => setNewAction({ ...newAction, alertId: e.target.value })} style={fieldStyle}>
                {ALERTS.map(a => <option key={a.id} value={a.id}>{a.id}: {a.communityName}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select value={newAction.priority} onChange={e => setNewAction({ ...newAction, priority: e.target.value as typeof newAction.priority })} style={fieldStyle}>
                {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </Grid>

          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Notes (optional)</label>
            <input value={newAction.notes} onChange={e => setNewAction({ ...newAction, notes: e.target.value })} style={fieldStyle} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={handleAddIntervention} style={{ height: 34, padding: '0 18px', background: T.teal, color: 'white', border: 'none', borderRadius: 5, fontFamily: T.heading, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Assign Action
            </button>
            <button onClick={() => setShowNewForm(false)} style={{ height: 34, padding: '0 14px', background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 12, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </Card>
      )}

      <Card title="All Response Actions">
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <Th width={92}>ID</Th>
                <Th>Action</Th>
                <Th width={150}>Assigned To</Th>
                <Th width={90}>Priority</Th>
                <Th width={130}>Status</Th>
                <Th align="right" width={100}>Due</Th>
                <Th width={170}>Notes</Th>
                <Th align="right" width={80}>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {interventions.map(i => (
                <tr key={i.id}>
                  <Td mono muted style={{ fontSize: 10 }}>{i.id}</Td>
                  <Td>{i.action}</Td>
                  <Td muted>{i.assignedTo}</Td>
                  <Td>
                    <span style={{
                      display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 4,
                      background: `${priorityColor[i.priority]}20`, color: priorityColor[i.priority],
                    }}>
                      {i.priority}
                    </span>
                  </Td>
                  <Td>
                    <select
                      value={i.status}
                      onChange={e => { updateIntervention(i.id, { status: e.target.value as typeof i.status }); addToast('info', 'Status Updated', `${i.action} → ${e.target.value}`); }}
                      style={{ fontSize: 11, color: statusColor[i.status], fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                    >
                      {['Pending', 'In Progress', 'Completed'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </Td>
                  <Td align="right" mono muted style={{ fontSize: 11 }}>{i.due}</Td>
                  <Td muted style={{ fontSize: 11 }}>{i.notes || '—'}</Td>
                  <Td align="right">
                    <button
                      onClick={() => { updateIntervention(i.id, { status: 'Completed' }); addToast('success', 'Action Completed', i.action); }}
                      style={{ height: 24, padding: '0 8px', fontSize: 10, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', color: T.muted, whiteSpace: 'nowrap' }}
                    >
                      ✓ Done
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </Page>
  );
}
