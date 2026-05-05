import { useState, useEffect } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button, Field, Input, Select, EmptyState, DataTable, Pill, Card } from '@supaproxy/ui';
import { FileText } from 'lucide-react';

interface Props {
  engineUrl: string;
  token: string;
  orgId: string;
  domainId: string;
}

interface PatternRule {
  id: string;
  name: string;
  pattern: string;
  entityType: string;
  enabled: boolean;
}

const ENTITY_OPTIONS = [
  { value: 'account_number', label: 'account_number' },
  { value: 'id_number', label: 'id_number' },
  { value: 'email', label: 'email' },
  { value: 'phone', label: 'phone' },
  { value: 'person', label: 'person' },
  { value: 'organization', label: 'organization' },
  { value: 'custom', label: 'custom' },
];

export function Patterns({ engineUrl, token, orgId, domainId }: Props) {
  const [patterns, setPatterns] = useState<PatternRule[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [newType, setNewType] = useState('account_number');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Org-Id': orgId };

  useEffect(() => { load(); }, [domainId]);

  async function load() {
    const res = await fetch(`${engineUrl}/orgs/${orgId}/domains/${domainId}/config`, { headers });
    if (res.ok) { const data = await res.json(); setPatterns(data.patterns ?? []); }
  }

  async function save(updated: PatternRule[]) {
    await fetch(`${engineUrl}/orgs/${orgId}/domains/${domainId}/config`, { method: 'PUT', headers, body: JSON.stringify({ patterns: updated }) });
    setPatterns(updated);
  }

  function handleAdd() {
    if (!newName || !newPattern) return;
    save([...patterns, { id: crypto.randomUUID(), name: newName, pattern: newPattern, entityType: newType, enabled: true }]);
    setNewName(''); setNewPattern(''); setNewType('account_number'); setShowAdd(false);
  }

  const columns = [
    {
      key: 'enabled', header: '', width: '40px',
      render: (row: PatternRule) => (
        <button onClick={() => save(patterns.map((x) => x.id === row.id ? { ...x, enabled: !x.enabled } : x))}>
          {row.enabled ? <ToggleRight size={16} style={{ color: 'var(--color-accent-text)' }} /> : <ToggleLeft size={16} style={{ color: 'var(--text-muted)' }} />}
        </button>
      ),
    },
    {
      key: 'name', header: 'Name',
      render: (row: PatternRule) => <span className="font-medium" style={{ color: row.enabled ? 'var(--text-heading)' : 'var(--text-muted)' }}>{row.name}</span>,
    },
    {
      key: 'pattern', header: 'Pattern',
      render: (row: PatternRule) => <code className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{row.pattern}</code>,
    },
    {
      key: 'type', header: 'Type', width: '130px',
      render: (row: PatternRule) => <Pill variant="accent">{row.entityType}</Pill>,
    },
    {
      key: 'actions', header: '', width: '40px',
      render: (row: PatternRule) => (
        <button onClick={() => save(patterns.filter((x) => x.id !== row.id))} className="opacity-40 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-danger-text)' }}>
          <Trash2 size={13} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--color-accent-text)' }}>Configure</p>
          <h2 className="text-[24px] font-bold leading-tight" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>Pattern Rules</h2>
          <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--body)' }}>Regex patterns run alongside spaCy NER to detect domain-specific entities. Domain patterns override organization defaults.</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} icon={<Plus size={11} />}>Add Pattern</Button>
      </div>

      {showAdd && (
        <Card padding="md">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Field label="Name" size="default">
              <Input value={newName} onChange={setNewName} placeholder="SA Policy Number" size="default" />
            </Field>
            <Field label="Regex pattern" size="default">
              <Input value={newPattern} onChange={setNewPattern} placeholder="POL-\d{4,10}" mono size="default" />
            </Field>
            <Field label="Entity type" size="default">
              <Select value={newType} onChange={setNewType} options={ENTITY_OPTIONS} />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Save pattern</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {patterns.length === 0 ? (
        <EmptyState icon={FileText} message="No patterns configured. Add regex patterns to detect domain-specific entities." action={<Button size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={11} />}>Add your first pattern</Button>} />
      ) : (
        <DataTable columns={columns} data={patterns} keyFn={(p) => p.id} />
      )}
    </div>
  );
}
