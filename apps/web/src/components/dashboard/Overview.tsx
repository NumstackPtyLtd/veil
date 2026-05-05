import { useState, useEffect } from 'react';
import { StatCard, Button, Card, EmptyState } from '@supaproxy/ui';
import { Shield, FlaskConical, ArrowRight, Lock, Unlock, Activity } from 'lucide-react';

interface Props {
  engineUrl: string;
  token: string;
  orgId: string;
  domainId: string;
  tenantId: string;
}

interface Stats {
  total: number;
  byType: Record<string, number>;
  totalEntities: number;
  totalVectorSearches: number;
  avgDurationMs: number;
}

interface ActivityLog {
  id: string;
  type: string;
  entitiesDetected: number | null;
  durationMs: number | null;
  createdAt: string;
}

export function Overview({ engineUrl, token, orgId, domainId }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<ActivityLog[]>([]);

  const headers = { Authorization: `Bearer ${token}`, 'X-Org-Id': orgId };

  useEffect(() => {
    Promise.all([
      fetch(`${engineUrl}/orgs/${orgId}/stats`, { headers }).then((r) => r.ok ? r.json() : null),
      fetch(`${engineUrl}/orgs/${orgId}/activity?domainId=${domainId}&limit=5`, { headers }).then((r) => r.ok ? r.json() : []),
    ]).then(([s, a]) => { setStats(s); setRecent(a); });
  }, [orgId, domainId]);

  const s = stats ?? { total: 0, byType: {}, totalEntities: 0, totalVectorSearches: 0, avgDurationMs: 0 };

  if (s.total === 0) {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-[11px] font-medium mb-3" style={{ color: 'var(--color-accent-text)' }}>Getting started</p>
          <h2 className="text-[24px] font-bold leading-tight" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>
            Set up your privacy pipeline
          </h2>
          <p className="text-[14px] mt-2 leading-relaxed max-w-[520px]" style={{ color: 'var(--body)' }}>
            Seed known entities, configure detection patterns, then test encryption in the Sandbox.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Lock, step: '01', title: 'Seed entities', desc: 'Upload known customer names, policy numbers, and account IDs. The vector store uses these for fuzzy matching.' },
            { icon: Shield, step: '02', title: 'Configure patterns', desc: 'Add regex patterns for domain-specific identifiers that spaCy NER might miss — policy formats, internal codes.' },
            { icon: FlaskConical, step: '03', title: 'Test in Sandbox', desc: 'Run real text through the pipeline. See entities detected, confidence scores, and encrypted output.' },
          ].map(({ icon: Icon, step, title, desc }) => (
            <Card key={title} hover padding="lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent-bg)' }}>
                  <Icon size={16} style={{ color: 'var(--color-accent-text)' }} />
                </div>
                <span className="text-[24px] font-bold" style={{ color: 'var(--color-accent)', opacity: 0.2 }}>{step}</span>
              </div>
              <h3 className="text-[15px] font-semibold mb-2" style={{ color: 'var(--text-heading)' }}>{title}</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--body)' }}>{desc}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-medium mb-3" style={{ color: 'var(--color-accent-text)' }}>Last 24 hours</p>
        <h2 className="text-[24px] font-bold leading-tight" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>Overview</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Operations"
          value={s.total}
          detail={
            <div className="flex gap-3 text-[11px]">
              <span style={{ color: 'var(--color-accent-text)' }}>{s.byType.encrypt ?? 0} protect</span>
              <span style={{ color: 'var(--color-success-text)' }}>{s.byType.decrypt ?? 0} restore</span>
            </div>
          }
        />
        <StatCard
          label="Entities Detected"
          value={s.totalEntities}
          detail={<span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>NER + patterns</span>}
        />
        <StatCard label="Vector Queries" value={s.totalVectorSearches} detail={<span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Qdrant</span>} />
        <StatCard label="Avg Latency" value={s.avgDurationMs ? `${s.avgDurationMs}` : '--'} suffix="ms" />
      </div>

      {/* Pipeline status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Lock, title: 'NER Engine', value: 'spaCy · en_core_web_md', status: 'Active' },
          { icon: Shield, title: 'Vector Store', value: `${s.totalVectorSearches} queries`, status: 'Qdrant v1.14' },
          { icon: Unlock, title: 'Encryption', value: 'AES-256-GCM', status: 'Per-tenant salt' },
        ].map(({ icon: Icon, title, value, status }) => (
          <Card key={title} padding="md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent-bg)' }}>
                <Icon size={14} style={{ color: 'var(--color-accent-text)' }} />
              </div>
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text-heading)' }}>{title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-mono" style={{ color: 'var(--body)' }}>{value}</span>
              <span className="text-[11px]" style={{ color: 'var(--color-success-text)' }}>{status}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text-heading)' }}>Recent activity</span>
            <Button variant="ghost" size="sm">View all <ArrowRight size={11} /></Button>
          </div>
          <Card padding="none">
            {recent.map((log, i) => (
              <div key={log.id} className="flex items-center justify-between px-5 py-3" style={{ borderTop: i > 0 ? '1px solid var(--border-color)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
                    <Activity size={12} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text-heading)' }}>{log.type}</span>
                  {log.entitiesDetected != null && (
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{log.entitiesDetected} entities</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {log.durationMs != null && (
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{log.durationMs}ms</span>
                  )}
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
