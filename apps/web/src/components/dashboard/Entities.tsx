import { useState } from 'react';
import { Plus, Database } from 'lucide-react';
import { Button, Field, Input, Select, Textarea, TabBar, Pill, DataTable, SearchInput, EmptyState } from '@supaproxy/ui';

interface Props {
  engineUrl: string;
  tenantId: string;
}

interface SeedEntity { realValue: string; entityType: string }
interface StoredEntity { id: string; realValue: string; entityType: string; encryptedAvatar: string }

const ENTITY_OPTIONS = [
  { value: 'person', label: 'person' },
  { value: 'organization', label: 'organization' },
  { value: 'account_number', label: 'account_number' },
  { value: 'id_number', label: 'id_number' },
  { value: 'email', label: 'email' },
  { value: 'phone', label: 'phone' },
  { value: 'place', label: 'place' },
  { value: 'custom', label: 'custom' },
];

export function Entities({ engineUrl, tenantId }: Props) {
  const [mode, setMode] = useState('single');
  const [entities, setEntities] = useState<SeedEntity[]>([{ realValue: '', entityType: 'person' }]);
  const [bulkText, setBulkText] = useState('');
  const [seeded, setSeeded] = useState<StoredEntity[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  function addRow() { setEntities([...entities, { realValue: '', entityType: 'person' }]); }

  async function handleSeed() {
    const toSeed = mode === 'bulk'
      ? bulkText.split('\n').filter((l) => l.trim()).map((line) => { const [realValue, entityType = 'person'] = line.split(',').map((s) => s.trim()); return { realValue, entityType }; })
      : entities.filter((e) => e.realValue.trim());
    if (!toSeed.length) return;
    setLoading(true);
    const res = await fetch(`${engineUrl}/entities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entities: toSeed, tenantSalt: tenantId }) });
    const data = await res.json();
    setSeeded((prev) => [...(data.entities ?? []), ...prev]);
    setEntities([{ realValue: '', entityType: 'person' }]);
    setBulkText('');
    setLoading(false);
  }

  const filtered = seeded.filter((e) => !filter || e.realValue.toLowerCase().includes(filter.toLowerCase()) || e.entityType.includes(filter.toLowerCase()));

  const columns = [
    {
      key: 'value', header: 'Value',
      render: (row: StoredEntity) => <span className="font-mono font-medium" style={{ color: 'var(--text-heading)' }}>{row.realValue}</span>,
    },
    {
      key: 'type', header: 'Type', width: '130px',
      render: (row: StoredEntity) => <Pill variant="accent">{row.entityType}</Pill>,
    },
    {
      key: 'avatar', header: 'Encrypted Avatar', width: '220px',
      render: (row: StoredEntity) => <code className="font-mono text-[11px] truncate block max-w-[200px]" style={{ color: 'var(--text-muted)' }}>{row.encryptedAvatar}</code>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--color-accent-text)' }}>Entity store</p>
        <h2 className="text-[24px] font-bold leading-tight" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>Seed Entities</h2>
        <p className="text-[13px] mt-1 mb-4 leading-relaxed max-w-[520px]" style={{ color: 'var(--body)' }}>Add known entities from CRM or compliance lists. Vector search uses these for fuzzy matching across misspellings and variations.</p>

        <TabBar tabs={[{ id: 'single', label: 'Single' }, { id: 'bulk', label: 'Bulk CSV' }]} active={mode} onChange={setMode} />

        {mode === 'single' ? (
          <div className="space-y-2">
            {entities.map((e, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input value={e.realValue} onChange={(v) => { const u = [...entities]; u[i] = { ...u[i], realValue: v }; setEntities(u); }} placeholder="Entity value (e.g. John Smith)" />
                </div>
                <div className="w-44">
                  <Select value={e.entityType} onChange={(v) => { const u = [...entities]; u[i] = { ...u[i], entityType: v }; setEntities(u); }} options={ENTITY_OPTIONS} />
                </div>
                {entities.length > 1 && <Button variant="ghost" size="sm" onClick={() => setEntities(entities.filter((_, idx) => idx !== i))}>x</Button>}
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <Button variant="ghost" size="sm" onClick={addRow} icon={<Plus size={11} />}>Add row</Button>
              <Button size="sm" onClick={handleSeed} loading={loading}>Seed</Button>
            </div>
          </div>
        ) : (
          <div>
            <Field label="Paste CSV" help="Format: value, type (one per line)">
              <Textarea value={bulkText} onChange={setBulkText} rows={5} placeholder={"Elvis Magagula, person\nPOL-123456, account_number\nAcme Corp, organization"} />
            </Field>
            <Button size="sm" onClick={handleSeed} loading={loading} className="mt-2">Seed</Button>
          </div>
        )}
      </div>

      {seeded.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] font-semibold" style={{ color: 'var(--text-heading)' }}>Entity Store <span className="text-[12px] font-normal" style={{ color: 'var(--text-muted)' }}>({seeded.length})</span></span>
            <SearchInput value={filter} onChange={setFilter} placeholder="Filter..." className="w-44" />
          </div>
          <DataTable columns={columns} data={filtered} keyFn={(r) => r.id} emptyMessage="No entities match filter" />
        </div>
      )}

      {seeded.length === 0 && (
        <EmptyState icon={Database} message="No entities seeded yet. Add known values to enable vector-based fuzzy matching." />
      )}
    </div>
  );
}
