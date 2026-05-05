import { useState } from 'react';
import { Play, RotateCcw, Copy, Check, ArrowRight } from 'lucide-react';
import { Button, Card, Pill, DataTable, Textarea } from '@supaproxy/ui';

interface Props {
  engineUrl: string;
  tenantId: string;
}

interface EntityMapping {
  original: string;
  replacement: string;
  entityType: string;
  matchScore: number;
  source: string;
}

interface EncryptResult {
  originalText: string;
  veiled: string;
  mappings: EntityMapping[];
}

interface DecryptResult {
  unveiled: string;
}

export function Sandbox({ engineUrl, tenantId }: Props) {
  const [input, setInput] = useState('My name is Elvis Magagula and my policy is POL-123456. Contact me at elvis@test.com');
  const [result, setResult] = useState<EncryptResult | null>(null);
  const [restored, setRestored] = useState<DecryptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function protect() {
    setLoading(true);
    setRestored(null);
    try {
      const res = await fetch(`${engineUrl}/encrypt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: input, tenantSalt: tenantId }) });
      setResult(await res.json());
    } finally { setLoading(false); }
  }

  async function restore() {
    if (!result) return;
    setLoading(true);
    try {
      const res = await fetch(`${engineUrl}/decrypt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: result.veiled, mappings: result.mappings, tenantSalt: tenantId }) });
      setRestored(await res.json());
    } finally { setLoading(false); }
  }

  const columns = [
    {
      key: 'value', header: 'Value',
      render: (row: EntityMapping) => <span className="font-medium" style={{ color: 'var(--text-heading)' }}>{row.original}</span>,
    },
    {
      key: 'type', header: 'Type', width: '120px',
      render: (row: EntityMapping) => <Pill variant="accent">{row.entityType}</Pill>,
    },
    {
      key: 'match', header: 'Match', width: '100px',
      render: (row: EntityMapping) => (
        <Pill variant={row.matchScore > 0.9 ? 'success' : row.matchScore > 0.7 ? 'warning' : 'danger'}>
          {(row.matchScore * 100).toFixed(1)}%
        </Pill>
      ),
    },
    {
      key: 'source', header: 'Source', width: '100px',
      render: (row: EntityMapping) => <span style={{ color: 'var(--text-muted)' }}>{row.source === 'vector' ? 'entity store' : 'NER'}</span>,
    },
    {
      key: 'avatar', header: 'Encrypted avatar', width: '180px',
      render: (row: EntityMapping) => <code className="font-mono text-[11px] truncate block max-w-[160px]" style={{ color: 'var(--text-muted)' }}>{row.replacement}</code>,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-medium mb-3" style={{ color: 'var(--color-accent-text)' }}>Test pipeline</p>
        <h2 className="text-[24px] font-bold leading-tight" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>Sandbox</h2>
        <p className="text-[14px] mt-2 leading-relaxed max-w-[520px]" style={{ color: 'var(--body)' }}>
          Enter text containing sensitive data — names, policy numbers, emails — and see how entities are detected, matched, and replaced with encrypted avatars.
        </p>
      </div>

      {/* Input area */}
      <div>
        <Textarea value={input} onChange={setInput} rows={3} placeholder="Enter text containing PII..." />
        <div className="flex items-center gap-2 mt-3">
          <Button onClick={protect} loading={loading} disabled={!input.trim()} icon={<Play size={11} />} size="md">Protect</Button>
          {result && (
            <>
              <Button variant="secondary" onClick={restore} disabled={loading} icon={<RotateCcw size={11} />} size="md">Restore</Button>
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(result.veiled); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                {copied ? <Check size={11} /> : <Copy size={11} />}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Pipeline preview — styled like landing page terminal */}
      {result && (
        <Card padding="none">
          <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-danger-text)' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-warning-text)' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-success-text)' }} />
            <span className="ml-2 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>privacy pipeline</span>
          </div>
          <div className="p-5 space-y-4 text-[13px]">
            {/* Original */}
            <div>
              <div className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Original input</div>
              <div className="font-mono" style={{ color: 'var(--body)' }}>{result.originalText}</div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-medium" style={{ color: 'var(--color-accent-text)' }}>
              <ArrowRight size={12} /> Veil detects and encrypts entities
            </div>

            {/* Protected */}
            <div className="rounded-xl px-4 py-3" style={{ background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)' }}>
              <div className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--color-accent-text)' }}>What the AI model sees — protected</div>
              <div className="font-mono break-all" style={{ color: 'var(--body)' }}>{result.veiled}</div>
            </div>

            {/* Restored */}
            {restored && (
              <>
                <div className="flex items-center gap-2 text-[10px] font-medium" style={{ color: 'var(--color-success-text)' }}>
                  <ArrowRight size={12} /> Veil decrypts before it reaches you
                </div>
                <div className="rounded-xl px-4 py-3" style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' }}>
                  <div className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--color-success-text)' }}>Restored — real data returned</div>
                  <div className="font-mono" style={{ color: 'var(--body)' }}>{restored.unveiled}</div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Entity mappings */}
      {result && result.mappings.length > 0 && (
        <div>
          <p className="text-[11px] font-medium mb-3" style={{ color: 'var(--color-accent-text)' }}>Detection results</p>
          <span className="text-[13px] font-semibold block mb-3" style={{ color: 'var(--text-heading)' }}>
            {result.mappings.length} entities detected
          </span>
          <DataTable columns={columns} data={result.mappings} keyFn={(row, i) => `${row.original}-${i}`} />
        </div>
      )}
    </div>
  );
}
