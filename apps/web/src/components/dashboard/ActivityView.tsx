import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { StatCard, Button, Pill, DataTable, EmptyState } from '@supaproxy/ui';
import { Activity } from 'lucide-react';

interface Props {
  engineUrl: string;
  token: string;
  orgId: string;
  domainId: string;
}

interface ActivityLog {
  id: string;
  type: string;
  entitiesDetected: number | null;
  vectorSearches: number | null;
  durationMs: number | null;
  createdAt: string;
}

interface Stats {
  total: number;
  byType: Record<string, number>;
  totalEntities: number;
  totalVectorSearches: number;
  avgDurationMs: number;
}

const TYPE_VARIANTS: Record<string, 'accent' | 'success' | 'warning' | 'muted'> = {
  encrypt: 'accent',
  decrypt: 'success',
  seed: 'warning',
  config_update: 'muted',
};

export function ActivityView({ engineUrl, token, orgId, domainId }: Props) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}`, 'X-Org-Id': orgId };

  useEffect(() => { load(); }, [orgId, domainId]);

  async function load() {
    setLoading(true);
    const [logsRes, statsRes] = await Promise.all([
      fetch(`${engineUrl}/orgs/${orgId}/activity?domainId=${domainId}&limit=30`, { headers }),
      fetch(`${engineUrl}/orgs/${orgId}/stats`, { headers }),
    ]);
    if (logsRes.ok) setLogs(await logsRes.json());
    if (statsRes.ok) setStats(await statsRes.json());
    setLoading(false);
  }

  const columns = [
    {
      key: 'type', header: 'Event', width: '120px',
      render: (row: ActivityLog) => <Pill variant={TYPE_VARIANTS[row.type] ?? 'muted'}>{row.type}</Pill>,
    },
    {
      key: 'entities', header: 'Entities', width: '80px',
      render: (row: ActivityLog) => <span className="font-mono" style={{ color: 'var(--text-heading)' }}>{row.entitiesDetected ?? '-'}</span>,
    },
    {
      key: 'vectors', header: 'Vector Searches', width: '120px',
      render: (row: ActivityLog) => <span className="font-mono" style={{ color: 'var(--text-heading)' }}>{row.vectorSearches ?? '-'}</span>,
    },
    {
      key: 'duration', header: 'Duration', width: '90px',
      render: (row: ActivityLog) => <span className="font-mono" style={{ color: row.durationMs && row.durationMs > 500 ? 'var(--color-warning-text)' : 'var(--text-muted)' }}>{row.durationMs ? `${row.durationMs}ms` : '-'}</span>,
    },
    {
      key: 'time', header: 'Time', width: '100px',
      render: (row: ActivityLog) => <span style={{ color: 'var(--text-muted)' }}>{new Date(row.createdAt).toLocaleTimeString()}</span>,
    },
  ];

  if (loading) return <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Loading activity...</p>;

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Events (24h)" value={stats.total} />
          <StatCard label="Entities Detected" value={stats.totalEntities} detail={<span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>NER + patterns</span>} />
          <StatCard label="Vector Searches" value={stats.totalVectorSearches} detail={<span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Qdrant</span>} />
          <StatCard label="Avg Latency" value={stats.avgDurationMs ? `${stats.avgDurationMs}` : '--'} suffix="ms" />
        </div>
      )}

      <div>
        <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--color-accent-text)' }}>Observe</p>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[24px] font-bold leading-tight" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>Activity</h2>
          <Button variant="ghost" size="sm" onClick={load} icon={<RefreshCw size={11} />}>Refresh</Button>
        </div>

        {logs.length === 0 ? (
          <EmptyState icon={Activity} message="No activity yet. Run an encrypt operation from the Sandbox." />
        ) : (
          <DataTable columns={columns} data={logs} keyFn={(row) => row.id} />
        )}
      </div>
    </div>
  );
}
