import { useState } from 'react';
import { Play, RotateCcw, Copy, Check, Clock, Zap, Shield, MessageSquare, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
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

interface HistoryEntry {
  id: number;
  input: string;
  result: EncryptResult;
  timestamp: Date;
  durationMs: number;
}

const EXAMPLES = [
  { icon: MessageSquare, title: 'Customer support', text: 'My name is Elvis Magagula and my policy is POL-123456. I need to update my email to elvis.m@gmail.com and my phone to +27 82 555 1234.' },
  { icon: Shield, title: 'Banking query', text: 'Please check the balance for account holder Thandi Nkosi, ID number 9201015800087. Her account number is ACC-78421.' },
  { icon: Zap, title: 'Insurance claim', text: 'Claim submitted by John van der Merwe (POL-987654) for vehicle accident on 2024-03-15. Contact: john.vdm@outlook.com, +27 11 234 5678.' },
];

let nextId = 1;

export function Sandbox({ engineUrl, tenantId }: Props) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<EncryptResult | null>(null);
  const [restored, setRestored] = useState<DecryptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastDuration, setLastDuration] = useState<number | null>(null);
  const [showMappings, setShowMappings] = useState(true);

  async function protect() {
    if (!input.trim()) return;
    setLoading(true); setRestored(null);
    const start = performance.now();
    try {
      const res = await fetch(`${engineUrl}/encrypt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: input, tenantSalt: tenantId }) });
      const data: EncryptResult = await res.json();
      const duration = Math.round(performance.now() - start);
      setResult(data); setLastDuration(duration);
      setHistory((prev) => [{ id: nextId++, input, result: data, timestamp: new Date(), durationMs: duration }, ...prev].slice(0, 10));
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

  function loadExample(text: string) { setInput(text); setResult(null); setRestored(null); }

  function highlightEntities(text: string, mappings: EntityMapping[]) {
    if (!mappings.length) return <span>{text}</span>;
    const sorted = [...mappings].sort((a, b) => text.indexOf(a.original) - text.indexOf(b.original));
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    for (const m of sorted) {
      const idx = text.indexOf(m.original, cursor);
      if (idx === -1) continue;
      if (idx > cursor) parts.push(<span key={`t-${cursor}`}>{text.slice(cursor, idx)}</span>);
      parts.push(<span key={`e-${idx}`} className="font-semibold px-0.5 rounded" style={{ color: 'var(--text-heading)', background: 'var(--color-accent-bg)' }}>{m.original}</span>);
      cursor = idx + m.original.length;
    }
    if (cursor < text.length) parts.push(<span key={`t-${cursor}`}>{text.slice(cursor)}</span>);
    return <>{parts}</>;
  }

  const columns = [
    { key: 'value', header: 'Original', render: (row: EntityMapping) => <span className="font-medium" style={{ color: 'var(--text-heading)' }}>{row.original}</span> },
    { key: 'avatar', header: 'Avatar', render: (row: EntityMapping) => <span className="font-mono" style={{ color: 'var(--color-accent-text)' }}>{row.replacement}</span> },
    { key: 'type', header: 'Type', width: '110px', render: (row: EntityMapping) => <Pill variant="accent">{row.entityType}</Pill> },
    { key: 'match', header: 'Match', width: '80px', render: (row: EntityMapping) => <Pill variant={row.matchScore > 0.9 ? 'success' : row.matchScore > 0.7 ? 'warning' : 'danger'}>{(row.matchScore * 100).toFixed(0)}%</Pill> },
    { key: 'source', header: 'Source', width: '80px', render: (row: EntityMapping) => <span style={{ color: 'var(--text-muted)' }}>{row.source === 'vector' ? 'store' : 'NER'}</span> },
  ];

  // No result: show examples
  if (!input && !result) {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-[11px] font-medium mb-3" style={{ color: 'var(--color-accent-text)' }}>Test pipeline</p>
          <h2 className="text-[24px] font-bold leading-tight" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>Sandbox</h2>
          <p className="text-[14px] mt-2 leading-relaxed max-w-[520px]" style={{ color: 'var(--body)' }}>
            Test your privacy pipeline. Pick a scenario or type your own text.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {EXAMPLES.map((ex) => {
            const Icon = ex.icon;
            return (
              <Card key={ex.title} padding="md">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent-bg)' }}>
                    <Icon size={13} style={{ color: 'var(--color-accent-text)' }} />
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text-heading)' }}>{ex.title}</span>
                </div>
                <p className="text-[12px] leading-relaxed mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{ex.text}</p>
                <Button size="sm" variant="secondary" onClick={() => loadExample(ex.text)} icon={<Play size={10} />}>Try</Button>
              </Card>
            );
          })}
        </div>
        {/* Custom input */}
        <div>
          <Textarea value={input} onChange={setInput} rows={2} placeholder="Or type your own text with PII..." />
          <Button onClick={protect} loading={loading} disabled={!input.trim()} icon={<Play size={11} />} size="sm" className="mt-2">Protect</Button>
        </div>
        {history.length > 0 && (
          <div>
            <span className="text-[12px] font-medium block mb-2" style={{ color: 'var(--text-heading)' }}>Recent tests</span>
            <div className="space-y-1">
              {history.map((entry) => (
                <button key={entry.id} onClick={() => { setInput(entry.input); setResult(entry.result); setLastDuration(entry.durationMs); }}
                  className="w-full text-left rounded-lg p-3 transition-all hover:opacity-80"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] truncate max-w-[60%]" style={{ color: 'var(--body)' }}>{entry.input}</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Pill variant="accent">{entry.result.mappings.length} entities</Pill>
                      <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{entry.durationMs}ms</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Result view
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--color-accent-text)' }}>Test pipeline</p>
          <h2 className="text-[20px] font-bold leading-tight" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>Sandbox</h2>
        </div>
        {lastDuration != null && result && (
          <span className="flex items-center gap-1 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
            <Clock size={10} /> {lastDuration}ms
          </span>
        )}
      </div>

      {/* Input */}
      <div>
        <Textarea value={input} onChange={setInput} rows={2} placeholder="Enter text containing PII..." />
        <div className="flex items-center gap-2 mt-2">
          <Button onClick={protect} loading={loading} disabled={!input.trim()} icon={<Play size={11} />} size="sm">Protect</Button>
          <Button variant="ghost" size="sm" onClick={() => { setInput(''); setResult(null); setRestored(null); }}>Clear</Button>
        </div>
      </div>

      {/* Side-by-side */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original */}
          <div>
            <div className="text-[11px] font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Original</div>
            <Card padding="md">
              <div className="text-[13px] leading-relaxed" style={{ color: 'var(--body)' }}>
                {highlightEntities(result.originalText, result.mappings)}
              </div>
            </Card>
          </div>

          {/* Protected + Restore */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-medium" style={{ color: 'var(--color-accent-text)' }}>Protected ({result.mappings.length} entities)</div>
              <div className="flex items-center gap-1">
                {!restored && <Button variant="ghost" size="sm" onClick={restore} disabled={loading} icon={<RotateCcw size={10} />}>Restore</Button>}
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(result.veiled); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                </Button>
              </div>
            </div>
            <Card padding="md">
              <div className="text-[13px] leading-relaxed font-mono break-all" style={{ color: 'var(--body)' }}>
                {result.veiled}
              </div>
            </Card>
            {restored && (
              <div className="mt-3">
                <div className="text-[11px] font-medium mb-2" style={{ color: 'var(--color-success-text)' }}>Restored</div>
                <div className="rounded-xl px-4 py-3" style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' }}>
                  <div className="text-[13px] leading-relaxed" style={{ color: 'var(--body)' }}>{restored.unveiled}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Determinism note */}
      {result && (
        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <Zap size={10} />
          Deterministic: same input + same salt always produces the same output.
        </div>
      )}

      {/* Entity mappings (collapsible) */}
      {result && result.mappings.length > 0 && (
        <div>
          <button onClick={() => setShowMappings(!showMappings)} className="flex items-center gap-2 mb-2 text-[13px] font-semibold transition-opacity hover:opacity-80" style={{ color: 'var(--text-heading)' }}>
            {showMappings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Detected entities ({result.mappings.length})
          </button>
          {showMappings && <DataTable columns={columns} data={result.mappings} keyFn={(row, i) => `${row.original}-${i}`} />}
        </div>
      )}
    </div>
  );
}
