import { useState, useEffect } from 'react';
import { Save, Info } from 'lucide-react';
import { Button, HField, Input, Select, Card } from '@supaproxy/ui';

interface Props {
  engineUrl: string;
  token: string;
  orgId: string;
  domainId: string;
}

interface ResolvedConfig {
  thresholds: { autoMatch: number; probableMatch: number; uncertainMatch: number };
  labelOverrides: Record<string, string>;
}

const SPACY_LABELS: { label: string; desc: string }[] = [
  { label: 'PERSON', desc: 'People names' },
  { label: 'ORG', desc: 'Companies, agencies' },
  { label: 'FAC', desc: 'Facilities, buildings' },
  { label: 'GPE', desc: 'Countries, cities' },
  { label: 'LOC', desc: 'Locations, regions' },
  { label: 'DATE', desc: 'Dates, periods' },
  { label: 'CARDINAL', desc: 'Numerals' },
  { label: 'MONEY', desc: 'Monetary values' },
  { label: 'NORP', desc: 'Nationalities, groups' },
  { label: 'PRODUCT', desc: 'Products' },
  { label: 'EVENT', desc: 'Events' },
  { label: 'TIME', desc: 'Times' },
];

const VEIL_TYPE_OPTIONS = [
  { value: '', label: 'default' },
  { value: 'person', label: 'person' },
  { value: 'organization', label: 'organization' },
  { value: 'place', label: 'place' },
  { value: 'email', label: 'email' },
  { value: 'phone', label: 'phone' },
  { value: 'account_number', label: 'account_number' },
  { value: 'id_number', label: 'id_number' },
  { value: 'date', label: 'date' },
  { value: 'custom', label: 'custom' },
];

export function Config({ engineUrl, token, orgId, domainId }: Props) {
  const [config, setConfig] = useState<ResolvedConfig | null>(null);
  const [thresholds, setThresholds] = useState({ autoMatch: 0.95, probableMatch: 0.85, uncertainMatch: 0.7 });
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Org-Id': orgId };

  useEffect(() => { load(); }, [domainId]);

  async function load() {
    const res = await fetch(`${engineUrl}/orgs/${orgId}/domains/${domainId}/config`, { headers });
    if (res.ok) {
      const data: ResolvedConfig = await res.json();
      setConfig(data);
      setThresholds(data.thresholds);
      setOverrides(data.labelOverrides ?? {});
    }
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`${engineUrl}/orgs/${orgId}/domains/${domainId}/config`, { method: 'PUT', headers, body: JSON.stringify({ thresholds, labelOverrides: overrides }) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!config) return <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Thresholds */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--color-accent-text)' }}>Configure</p>
            <h2 className="text-[24px] font-bold leading-tight" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>Settings</h2>
            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--body)' }}>Control how vector similarity determines entity matching for this domain.</p>
          </div>
          <Button size="sm" onClick={handleSave} loading={saving} icon={<Save size={11} />}>
            {saved ? 'Saved' : 'Save changes'}
          </Button>
        </div>

        <Card padding="none">
          <HField label="Auto match" help="Encrypt automatically, no review needed">
            <Input value={String(thresholds.autoMatch)} onChange={(v) => setThresholds({ ...thresholds, autoMatch: parseFloat(v) || 0 })} mono placeholder="0.95" />
          </HField>
          <HField label="Probable match" help="Encrypt but flag for compliance review">
            <Input value={String(thresholds.probableMatch)} onChange={(v) => setThresholds({ ...thresholds, probableMatch: parseFloat(v) || 0 })} mono placeholder="0.85" />
          </HField>
          <HField label="Minimum threshold" help="Below this: pass through unencrypted">
            <Input value={String(thresholds.uncertainMatch)} onChange={(v) => setThresholds({ ...thresholds, uncertainMatch: parseFloat(v) || 0 })} mono placeholder="0.70" />
          </HField>
        </Card>
      </div>

      {/* Label overrides */}
      <div>
        <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--color-accent-text)' }}>NER configuration</p>
        <h3 className="text-[16px] font-semibold mb-1" style={{ color: 'var(--text-heading)' }}>Label Mapping</h3>
        <p className="text-[13px] mb-3 leading-relaxed" style={{ color: 'var(--body)' }}>Override how spaCy labels map to Veil entity types. Domain overrides take precedence over org defaults.</p>

        <Card padding="none">
          {SPACY_LABELS.map(({ label, desc }) => (
            <HField key={label} label={label} help={desc}>
              <Select
                value={overrides[label] ?? ''}
                onChange={(val) => {
                  if (val) setOverrides({ ...overrides, [label]: val });
                  else { const { [label]: _, ...rest } = overrides; setOverrides(rest); }
                }}
                options={VEIL_TYPE_OPTIONS}
              />
            </HField>
          ))}
        </Card>

        <div className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl" style={{ background: 'var(--color-info-bg)', border: '1px solid var(--color-info-border)' }}>
          <Info size={12} style={{ color: 'var(--color-info-text)' }} />
          <span className="text-[11px]" style={{ color: 'var(--color-info-text)' }}>
            Inheritance: Domain overrides → Organization defaults → System defaults
          </span>
        </div>
      </div>

      {/* Pipeline */}
      <div>
        <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--color-accent-text)' }}>Infrastructure</p>
        <h3 className="text-[16px] font-semibold mb-1" style={{ color: 'var(--text-heading)' }}>Pipeline</h3>
        <p className="text-[13px] mb-3 leading-relaxed" style={{ color: 'var(--body)' }}>The privacy pipeline components powering this domain. Configured at deployment.</p>

        <Card padding="none">
          {[
            { label: 'NER engine', value: 'spaCy · en_core_web_md', help: 'Named entity recognition' },
            { label: 'Embeddings', value: 'all-MiniLM-L6-v2 · 384d', help: 'Sentence transformer model' },
            { label: 'Vector store', value: 'Qdrant v1.14', help: 'Similarity search backend' },
            { label: 'Encryption', value: 'AES-256-GCM', help: 'Deterministic, per-tenant salt' },
          ].map(({ label, value, help }) => (
            <HField key={label} label={label} help={help}>
              <span className="text-[13px] font-mono" style={{ color: 'var(--text-heading)' }}>{value}</span>
            </HField>
          ))}
        </Card>
      </div>
    </div>
  );
}
