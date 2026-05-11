import { useState, useEffect } from 'react';
import { StatCard, Button, Card, Modal, Pill, DataTable, Toggle } from '@supaproxy/ui';
import { Shield, FlaskConical, ArrowRight, Lock, Unlock, Activity, X, Database, FileText, RefreshCw } from 'lucide-react';
import { Entities } from './Entities';
import { Patterns } from './Patterns';
import type { Section } from './VeilNav';

interface Props {
  engineUrl: string;
  token: string;
  user: { id: string; email: string; name: string };
  orgId: string;
  domainId: string;
  tenantId: string;
  onNavigate: (section: Section) => void;
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
  vectorSearches: number | null;
  durationMs: number | null;
  createdAt: string;
  meta: Record<string, unknown>;
}

const TYPE_VARIANTS: Record<string, 'accent' | 'success' | 'warning' | 'muted'> = {
  encrypt: 'accent',
  decrypt: 'success',
  seed: 'warning',
  config_update: 'muted',
};

export function Overview({ engineUrl, token, user, orgId, domainId, tenantId, onNavigate }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [showSetup, setShowSetup] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('veil_hide_setup') !== 'true';
    return true;
  });
  const [modal, setModal] = useState<'entities' | 'patterns' | null>(null);
  const [includeTests, setIncludeTests] = useState(true);

  const headers = { Authorization: `Bearer ${token}`, 'X-Org-Id': orgId };

  useEffect(() => { load(); }, [orgId, domainId]);

  async function load() {
    const [s, a] = await Promise.all([
      fetch(`${engineUrl}/orgs/${orgId}/stats`, { headers }).then((r) => r.ok ? r.json() : null),
      fetch(`${engineUrl}/orgs/${orgId}/activity?domainId=${domainId}&limit=20`, { headers }).then((r) => r.ok ? r.json() : []),
    ]);
    setStats(s);
    setLogs(a);
  }

  function dismissSetup() {
    setShowSetup(false);
    localStorage.setItem('veil_hide_setup', 'true');
  }

  const s = stats ?? { total: 0, byType: {}, totalEntities: 0, totalVectorSearches: 0, avgDurationMs: 0 };
  const filtered = includeTests ? logs : logs.filter((l) => !l.meta?.sandbox);

  const activityColumns = [
    { key: 'type', header: 'Event', width: '100px', render: (row: ActivityLog) => <Pill variant={TYPE_VARIANTS[row.type] ?? 'muted'}>{row.type}</Pill> },
    { key: 'entities', header: 'Entities', width: '70px', render: (row: ActivityLog) => <span className="font-mono" style={{ color: 'var(--text-heading)' }}>{row.entitiesDetected ?? '-'}</span> },
    { key: 'vectors', header: 'Vectors', width: '70px', render: (row: ActivityLog) => <span className="font-mono" style={{ color: 'var(--text-heading)' }}>{row.vectorSearches ?? '-'}</span> },
    { key: 'duration', header: 'Duration', width: '80px', render: (row: ActivityLog) => <span className="font-mono" style={{ color: row.durationMs && row.durationMs > 500 ? 'var(--color-warning-text)' : 'var(--text-muted)' }}>{row.durationMs ? `${row.durationMs}ms` : '-'}</span> },
    { key: 'time', header: 'Time', width: '90px', render: (row: ActivityLog) => <span style={{ color: 'var(--text-muted)' }}>{new Date(row.createdAt).toLocaleTimeString()}</span> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-medium mb-3" style={{ color: 'var(--color-accent-text)' }}>Last 24 hours</p>
        <h2 className="text-[24px] font-bold leading-tight" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>Overview</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Operations" value={s.total} detail={
          <div className="flex gap-3 text-[11px]">
            <span style={{ color: 'var(--color-accent-text)' }}>{s.byType.encrypt ?? 0} protect</span>
            <span style={{ color: 'var(--color-success-text)' }}>{s.byType.decrypt ?? 0} restore</span>
          </div>
        } />
        <StatCard label="Entities Detected" value={s.totalEntities} detail={<span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>NER + patterns</span>} />
        <StatCard label="Vector Queries" value={s.totalVectorSearches} detail={<span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Qdrant</span>} />
        <StatCard label="Avg Latency" value={s.avgDurationMs ? `${s.avgDurationMs}` : '--'} suffix="ms" />
      </div>

      {/* Getting started (dismissible, with defaults) */}
      {showSetup && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text-heading)' }}>Getting started</span>
            <button onClick={dismissSetup} className="text-[11px] flex items-center gap-1 transition-opacity hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
              <X size={12} /> Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card hover padding="lg" onClick={() => setModal('entities')}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent-bg)' }}>
                  <Database size={16} style={{ color: 'var(--color-accent-text)' }} />
                </div>
                <span className="text-[24px] font-bold" style={{ color: 'var(--color-accent)', opacity: 0.2 }}>01</span>
              </div>
              <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-heading)' }}>Seed entities</h3>
              <p className="text-[12px] leading-relaxed mb-3" style={{ color: 'var(--body)' }}>We have pre-loaded {user.name} as a starting entity. Add more from your CRM.</p>
              <Button size="sm" variant="secondary">Seed entities</Button>
            </Card>
            <Card hover padding="lg" onClick={() => setModal('patterns')}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent-bg)' }}>
                  <FileText size={16} style={{ color: 'var(--color-accent-text)' }} />
                </div>
                <span className="text-[24px] font-bold" style={{ color: 'var(--color-accent)', opacity: 0.2 }}>02</span>
              </div>
              <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-heading)' }}>Configure patterns</h3>
              <p className="text-[12px] leading-relaxed mb-3" style={{ color: 'var(--body)' }}>Default patterns for SA IDs, policy numbers, and emails are active. Add your own.</p>
              <Button size="sm" variant="secondary">Add patterns</Button>
            </Card>
            <Card hover padding="lg" onClick={() => onNavigate('sandbox')}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent-bg)' }}>
                  <FlaskConical size={16} style={{ color: 'var(--color-accent-text)' }} />
                </div>
                <span className="text-[24px] font-bold" style={{ color: 'var(--color-accent)', opacity: 0.2 }}>03</span>
              </div>
              <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-heading)' }}>Test in Sandbox</h3>
              <p className="text-[12px] leading-relaxed mb-3" style={{ color: 'var(--body)' }}>Run text through the pipeline. Try one of the pre-built scenarios.</p>
              <Button size="sm" variant="secondary">Open Sandbox</Button>
            </Card>
          </div>
        </div>
      )}

      {/* Pipeline status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Lock, title: 'NER Engine', value: 'spaCy', status: 'Active' },
          { icon: Shield, title: 'Vector Store', value: `${s.totalVectorSearches} queries`, status: 'Qdrant' },
          { icon: Unlock, title: 'Encryption', value: 'Format-preserving', status: 'Deterministic' },
        ].map(({ icon: Icon, title, value, status }) => (
          <Card key={title} padding="md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent-bg)' }}>
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

      {/* Activity (merged in) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-heading)' }}>Activity</span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: 'var(--body)' }}>
              <Toggle checked={includeTests} onChange={setIncludeTests} />
              Include tests
            </label>
            <Button variant="ghost" size="sm" onClick={load} icon={<RefreshCw size={11} />}>Refresh</Button>
          </div>
        </div>
        {filtered.length > 0 ? (
          <DataTable columns={activityColumns} data={filtered} keyFn={(row) => row.id} />
        ) : (
          <div className="rounded-xl py-8 text-center" style={{ background: 'var(--bg-surface)' }}>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>No activity yet. Run a test in the Sandbox.</p>
          </div>
        )}
      </div>

      {/* Inline modals */}
      {modal === 'entities' && (
        <Modal title="Seed entities" onClose={() => setModal(null)} maxWidth="max-w-[640px]">
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <Entities engineUrl={engineUrl} tenantId={tenantId} />
          </div>
        </Modal>
      )}
      {modal === 'patterns' && (
        <Modal title="Configure patterns" onClose={() => setModal(null)} maxWidth="max-w-[800px]">
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <Patterns engineUrl={engineUrl} token={token} orgId={orgId} domainId={domainId} />
          </div>
        </Modal>
      )}
    </div>
  );
}
