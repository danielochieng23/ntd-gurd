'use client';
import { Page, Grid, Card, T } from '@/components/ui';

export default function PrivacyScreen() {
  const principles = [
    { icon: '⊘', title: 'Data Minimization', desc: 'Only collect data strictly necessary for risk assessment. No unnecessary personally identifiable health information is collected in the prototype.' },
    { icon: '⊞', title: 'Role-Based Access Control', desc: 'Strict RBAC ensures each user can only access data required for their role. CHWs, analysts, and administrators have distinct permissions.' },
    { icon: '◉', title: 'End-to-End Encryption', desc: 'Data encrypted at rest and in transit. TLS 1.3 for all API communication. AES-256 for stored sensitive data.' },
    { icon: '◎', title: 'Audit Logs', desc: 'All data access, modifications, and exports are logged with timestamp, user ID, and action. Immutable audit trail for compliance.' },
    { icon: '⊶', title: 'Anonymized Community Reporting', desc: 'Community health worker reports are de-identified at collection. No patient-level data is stored or transmitted.' },
    { icon: '◈', title: 'Consent Mechanisms', desc: 'Informed consent frameworks integrated for community data collection where required by local regulations and ethics guidelines.' },
    { icon: '⟁', title: 'Secure APIs', desc: 'All API endpoints authenticated with OAuth 2.0. Rate limiting, input validation, and SQL injection protection in place.' },
    { icon: '⧖', title: 'PII Separation', desc: 'Personally identifiable information strictly separated from analytical datasets. Risk analysis operates entirely on anonymized signals.' },
  ];

  const compliance = [
    { framework: 'Kenya Data Protection Act 2019', status: 'Aligned (prototype phase)', color: T.teal },
    { framework: 'Uganda NITA-U Data Guidelines', status: 'Under review', color: T.gold },
    { framework: 'WHO Health Data Governance', status: 'Principles applied', color: T.teal },
    { framework: 'GDPR (European Users)', status: 'Framework reference', color: T.muted },
    { framework: 'IRB / Ethics Review', status: 'Required before pilot', color: T.coral },
  ];

  const flow = [
    { step: 'CHW collects symptom data', note: 'No patient names stored' },
    { step: 'Aggregation at community level', note: 'Minimum 5-person aggregation before transmission' },
    { step: 'Anonymization layer applied', note: 'PII stripped before database write' },
    { step: 'Encrypted transmission to platform', note: 'TLS 1.3 · Certificate pinning' },
    { step: 'Risk analysis on anonymized signals', note: 'No individual identification possible' },
    { step: 'Aggregated alert to health team', note: 'Zone-level only · No individual data' },
  ];

  return (
    <Page>
      <div style={{ background: T.deep, color: 'white', borderRadius: 10, padding: '26px 28px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.gold }}>
          Privacy & Security
        </div>
        <h2 style={{ fontFamily: T.heading, fontSize: 20, fontWeight: 800, margin: '12px 0 10px', lineHeight: 1.25 }}>
          Privacy by Design
        </h2>
        <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.65, maxWidth: 620, margin: 0 }}>
          NTD GURD is designed with privacy as a foundational principle, not an afterthought. Because this platform
          handles community health signals in low-resource environments, protecting individual privacy and maintaining
          community trust is critical to its mission.
        </p>
      </div>

      <Grid cols={2} gap={14}>
        {principles.map(p => (
          <div key={p.title} style={{
            display: 'grid', gridTemplateColumns: '38px minmax(0,1fr)', columnGap: 14, alignItems: 'start',
            padding: 18, background: 'white', border: `1px solid ${T.border}`, borderRadius: 8, height: '100%',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 7, background: 'rgba(8,127,140,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.teal, fontSize: 18,
            }}>
              {p.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: T.heading, fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.55, marginTop: 6 }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </Grid>

      <Grid cols={2}>
        <Card title="Regulatory Alignment">
          {compliance.map((c, i, arr) => (
            <div key={c.framework} style={{
              display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', columnGap: 12, alignItems: 'center',
              padding: '11px 0', borderBottom: i < arr.length - 1 ? `1px solid ${T.hair}` : 'none',
            }}>
              <div style={{ fontSize: 12, color: T.ink }}>{c.framework}</div>
              <span style={{
                display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                background: `${c.color}20`, color: c.color, whiteSpace: 'nowrap',
              }}>
                {c.status}
              </span>
            </div>
          ))}
        </Card>

        <Card title="Privacy-Preserving Data Flow">
          {flow.map((s, i, arr) => (
            <div key={s.step} style={{
              display: 'grid', gridTemplateColumns: '20px minmax(0,1fr)', columnGap: 10, alignItems: 'start',
              marginBottom: i < arr.length - 1 ? 12 : 0,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: T.green, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginTop: 1,
              }}>
                ✓
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{s.step}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2, lineHeight: 1.45 }}>{s.note}</div>
              </div>
            </div>
          ))}
        </Card>
      </Grid>
    </Page>
  );
}
