'use client';
import { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import {
  TEMPLATES, CHANNELS, AUDIENCES, LANGUAGES, ChannelId, AudienceId, LanguageId,
  buildContext, renderTemplate, segmentCount, audienceSize, dispatch, DispatchRequest,
} from '@/lib/messaging';
import { Page, Grid, Card, StatCard, Notice, SectionLabel, Table, Th, Td, T } from '@/components/ui';
import RiskBadge from '@/components/RiskBadge';

export default function DispatchScreen() {
  const { alerts, communityStates, dispatches, addDispatch, addToast } = useAppStore();

  const [alertId, setAlertId] = useState(alerts[0]?.id ?? '');
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [language, setLanguage] = useState<LanguageId>('en');
  const [channels, setChannels] = useState<ChannelId[]>(['sms']);
  const [audiences, setAudiences] = useState<AudienceId[]>(['community', 'chw']);
  const [bodyOverride, setBodyOverride] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const alert = alerts.find(a => a.id === alertId) ?? null;
  const community = communityStates.find(c => c.id === alert?.communityId) ?? null;
  const template = TEMPLATES.find(t => t.id === templateId)!;
  const lang = LANGUAGES.find(l => l.id === language)!;

  const rendered = useMemo(
    () => renderTemplate(template.body[language], buildContext(alert, community)),
    [template, language, alert, community],
  );

  const body = bodyOverride ?? rendered;
  const seg = segmentCount(body);
  const populationCovered = community?.population ?? 8000;

  const targeted = AUDIENCES
    .filter(a => audiences.includes(a.id))
    .map(a => ({ id: a.id, label: a.label, recipients: audienceSize(a, populationCovered) }));

  const totalRecipients = targeted.reduce((s, a) => s + a.recipients, 0);
  const smsSegments = channels.includes('sms') ? totalRecipients * seg.segments : 0;

  // Named V, not T — T is the imported style-token object in this module.
  function toggle<V extends string>(list: V[], value: V, set: (v: V[]) => void) {
    set(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  }

  function applyTemplate(id: string) {
    setTemplateId(id);
    setBodyOverride(null);
    const t = TEMPLATES.find(x => x.id === id);
    if (t) setAudiences(t.suggestedAudiences);
  }

  async function send() {
    setError('');
    if (!channels.length) { setError('Select at least one channel.'); return; }
    if (!targeted.length) { setError('Select at least one audience.'); return; }

    const req: DispatchRequest = {
      templateId: template.id,
      templateLabel: template.label,
      language,
      channels,
      audiences: targeted,
      body,
      community: alert?.communityName ?? community?.name ?? 'Busia District',
      alertId: alert?.id,
    };

    setSending(true);
    try {
      const result = await dispatch(req);
      addDispatch(result);
      addToast(
        result.simulated ? 'info' : 'success',
        result.simulated ? 'Dispatch simulated' : 'Dispatch sent',
        `${result.totalDelivered.toLocaleString()} of ${result.totalRequested.toLocaleString()} recipients reached via ${result.provider}.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dispatch failed.');
    } finally {
      setSending(false);
    }
  }

  const chip = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 7, height: 30, padding: '0 12px',
    borderRadius: 6, cursor: 'pointer', fontFamily: T.heading, fontSize: 11.5, fontWeight: 700,
    background: active ? T.deep : T.surface,
    color: active ? 'white' : T.muted,
    border: `1px solid ${active ? T.deep : T.hair}`,
  });

  const delivered = dispatches.reduce((s, d) => s + d.totalDelivered, 0);
  const reachedRuns = dispatches.length;

  return (
    <Page>
      <Notice>
        Composition, targeting and GSM segment costing are real. Delivery is simulated in the browser
        on GitHub Pages (static hosting has no SMS gateway). Live sending is only possible on a Node
        server with Africa&apos;s Talking credentials.
      </Notice>

      <Grid cols={4} gap={14}>
        <StatCard label="Recipients targeted" value={totalRecipients.toLocaleString()} sub={`${targeted.length} audience${targeted.length === 1 ? '' : 's'} selected`} color={T.teal} />
        <StatCard label="SMS segments" value={smsSegments.toLocaleString()} sub={`${seg.segments} per message · ${seg.encoding}`} color={smsSegments > 5000 ? T.gold : T.ink} />
        <StatCard label="Dispatches sent" value={reachedRuns} sub="This session" color={T.deep} />
        <StatCard label="Total delivered" value={delivered.toLocaleString()} sub="Across all dispatches" color={T.green} />
      </Grid>

      <Grid cols="minmax(0,1fr) minmax(0,420px)">
        {/* Composer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: T.gap, minWidth: 0 }}>
          <Card
            title="Trigger"
            subtitle="The alert whose data fills the message placeholders"
            right={alert && <RiskBadge level={alert.riskLevel} />}
          >
            <select
              value={alertId}
              onChange={e => { setAlertId(e.target.value); setBodyOverride(null); }}
              style={{ width: '100%', height: 38, padding: '0 10px', border: `1.5px solid ${T.border}`, borderRadius: 5, fontSize: 13, background: 'white' }}
            >
              {alerts.map(a => (
                <option key={a.id} value={a.id}>{a.id} — {a.communityName} · {a.riskLevel} {a.riskCurrent}/100</option>
              ))}
            </select>
            {community && (
              <div style={{ fontSize: 11.5, color: T.muted, marginTop: 10, lineHeight: 1.55 }}>
                {community.name} · {community.region} · population {community.population.toLocaleString()} ·
                vulnerability {community.vulnerability}/100. Audience sizes below are estimated from this population.
              </div>
            )}
          </Card>

          <Card title="Message template" subtitle={template.purpose}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t.id)} style={chip(t.id === templateId)}>
                  {t.label}
                </button>
              ))}
            </div>

            <SectionLabel style={{ marginBottom: 8 }}>Language</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  onClick={() => { setLanguage(l.id); setBodyOverride(null); }}
                  style={chip(l.id === language)}
                >
                  {l.label}
                  {l.draft && <span style={{ fontSize: 9, opacity: 0.75 }}>DRAFT</span>}
                </button>
              ))}
            </div>
            {lang.draft && (
              <div style={{ fontSize: 11, color: '#8a5c00', background: 'rgba(242,184,75,0.10)', border: '1px solid rgba(242,184,75,0.3)', borderRadius: 5, padding: '8px 10px', marginBottom: 14, lineHeight: 1.5 }}>
                This translation has not been reviewed by a native speaker. Have it checked before any real
                deployment — health messaging must be unambiguous.
              </div>
            )}

            <SectionLabel style={{ marginBottom: 8, marginTop: 8 }}>Message body</SectionLabel>
            <textarea
              value={body}
              onChange={e => setBodyOverride(e.target.value)}
              style={{
                width: '100%', minHeight: 150, padding: '12px 14px', border: `1.5px solid ${T.border}`,
                borderRadius: 6, fontSize: 13, fontFamily: T.body, lineHeight: 1.6, resize: 'vertical', color: T.ink,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono }}>
                {body.length} chars · {seg.segments} segment{seg.segments === 1 ? '' : 's'} · {seg.encoding}
                {seg.encoding === 'UCS-2' && <span style={{ color: T.gold }}> · non-GSM characters halve capacity</span>}
              </div>
              {bodyOverride !== null && (
                <button
                  onClick={() => setBodyOverride(null)}
                  style={{ height: 26, padding: '0 10px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.muted, cursor: 'pointer' }}
                >
                  Reset to template
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* Targeting */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: T.gap, minWidth: 0 }}>
          <Card title="Channels">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CHANNELS.map(c => {
                const active = channels.includes(c.id);
                return (
                  <label key={c.id} style={{
                    display: 'grid', gridTemplateColumns: '18px minmax(0,1fr)', columnGap: 10, alignItems: 'start',
                    cursor: 'pointer', padding: '9px 11px', borderRadius: 6,
                    background: active ? 'rgba(8,127,140,0.05)' : T.surface,
                    border: `1px solid ${active ? 'rgba(8,127,140,0.3)' : T.hair}`,
                  }}>
                    <input
                      type="checkbox" checked={active}
                      onChange={() => toggle(channels, c.id, setChannels)}
                      style={{ width: 18, height: 18, margin: 0, marginTop: 1, accentColor: T.teal }}
                    />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontFamily: T.heading, fontSize: 12.5, fontWeight: 700, color: active ? T.teal : T.ink }}>{c.label}</span>
                      <span style={{ display: 'block', fontSize: 11, color: T.muted, marginTop: 2, lineHeight: 1.45 }}>{c.note}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </Card>

          <Card title="Audiences" subtitle={`Sized against ${populationCovered.toLocaleString()} people`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {AUDIENCES.map(a => {
                const active = audiences.includes(a.id);
                const size = audienceSize(a, populationCovered);
                const suggested = template.suggestedAudiences.includes(a.id);
                return (
                  <label key={a.id} style={{
                    display: 'grid', gridTemplateColumns: '18px minmax(0,1fr) auto', columnGap: 10, alignItems: 'center',
                    cursor: 'pointer', padding: '9px 11px', borderRadius: 6,
                    background: active ? 'rgba(8,127,140,0.05)' : T.surface,
                    border: `1px solid ${active ? 'rgba(8,127,140,0.3)' : T.hair}`,
                  }}>
                    <input
                      type="checkbox" checked={active}
                      onChange={() => toggle(audiences, a.id, setAudiences)}
                      style={{ width: 18, height: 18, margin: 0, accentColor: T.teal }}
                    />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontFamily: T.heading, fontSize: 12.5, fontWeight: 700, color: active ? T.teal : T.ink }}>
                        {a.label}
                        {suggested && !active && <span style={{ fontSize: 9, color: T.gold, marginLeft: 6 }}>SUGGESTED</span>}
                      </span>
                      <span style={{ display: 'block', fontSize: 11, color: T.muted, marginTop: 2, lineHeight: 1.45 }}>{a.note}</span>
                    </span>
                    <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: active ? T.ink : T.muted }}>
                      {size.toLocaleString()}
                    </span>
                  </label>
                );
              })}
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'center',
              marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.hair}`,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>Total recipients</span>
              <span style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 600, color: T.teal }}>
                {totalRecipients.toLocaleString()}
              </span>
            </div>

            <button
              onClick={send}
              disabled={sending}
              style={{
                width: '100%', height: 46, marginTop: 14, borderRadius: 8, border: 'none',
                background: sending ? T.muted : T.coral, color: 'white',
                fontFamily: T.heading, fontSize: 14, fontWeight: 700, cursor: sending ? 'wait' : 'pointer',
              }}
            >
              {sending ? 'Dispatching…' : `▲ Send early warning to ${totalRecipients.toLocaleString()}`}
            </button>

            {error && <div style={{ marginTop: 10, fontSize: 11.5, color: T.coral, lineHeight: 1.5 }}>{error}</div>}
          </Card>
        </div>
      </Grid>

      <Card title="Outbox" subtitle={dispatches.length ? `${dispatches.length} dispatch${dispatches.length === 1 ? '' : 'es'} this session` : 'Nothing sent yet'}>
        {!dispatches.length ? (
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
            Sent messages appear here with per-channel delivery counts. Delivery rates differ by channel —
            SMS reaches almost every handset, WhatsApp only reaches smartphone owners with data.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {dispatches.map(d => (
              <div key={d.id} style={{ border: `1px solid ${T.hair}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', columnGap: 12, alignItems: 'center',
                  padding: '11px 14px', background: T.surface, borderBottom: `1px solid ${T.hair}`,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: T.heading, fontSize: 12.5, fontWeight: 700 }}>
                      {d.request.templateLabel} · {d.request.community}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2, fontFamily: T.mono }}>
                      {d.id} · {new Date(d.at).toLocaleString()} · {d.provider}
                    </div>
                  </div>
                  <span style={{
                    display: 'inline-block', fontSize: 9, fontWeight: 800, letterSpacing: '0.8px', padding: '4px 8px', borderRadius: 4,
                    background: d.simulated ? 'rgba(242,184,75,0.15)' : 'rgba(76,175,80,0.12)',
                    color: d.simulated ? '#8a5c00' : '#2e7d32',
                  }}>
                    {d.simulated ? 'SIMULATED' : 'SENT LIVE'}
                  </span>
                </div>

                {d.note && (
                  <div style={{ fontSize: 11, color: '#8a5c00', background: 'rgba(242,184,75,0.08)', padding: '8px 14px', lineHeight: 1.5 }}>
                    {d.note}
                  </div>
                )}

                <div style={{ padding: '4px 14px 12px' }}>
                  <Table>
                    <thead>
                      <tr>
                        <Th width={110}>Channel</Th>
                        <Th>Audience</Th>
                        <Th align="right" width={90}>Requested</Th>
                        <Th align="right" width={90}>Delivered</Th>
                        <Th align="right" width={70}>Failed</Th>
                        <Th align="right" width={80}>Rate</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.legs.map((l, i) => {
                        const rate = l.requested ? Math.round((l.delivered / l.requested) * 100) : 0;
                        return (
                          <tr key={`${l.channel}-${l.audience}-${i}`}>
                            <Td style={{ textTransform: 'capitalize' }}>{l.channel}</Td>
                            <Td muted>{l.audienceLabel}</Td>
                            <Td align="right" mono>{l.requested.toLocaleString()}</Td>
                            <Td align="right" mono style={{ color: T.green, fontWeight: 600 }}>{l.delivered.toLocaleString()}</Td>
                            <Td align="right" mono style={{ color: l.failed ? T.coral : T.muted }}>{l.failed.toLocaleString()}</Td>
                            <Td align="right" mono>{rate}%</Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Page>
  );
}
