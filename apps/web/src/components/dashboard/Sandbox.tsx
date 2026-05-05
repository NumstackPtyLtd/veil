import { useState } from 'react';
import { Play, RotateCcw, Copy, Check, ArrowRight, Clock, Zap, Shield, MessageSquare } from 'lucide-react';
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
  restored: boolean;
  timestamp: Date;
  durationMs: number;
}

const EXAMPLES = [
  {
    icon: MessageSquare,
    title: 'Customer support',
    text: 'My name is Elvis Magagula and my policy is POL-123456. I need to update my email to elvis.m@gmail.com and my phone to +27 82 555 1234.',
  },
  {
    icon: Shield,
    title: 'Banking query',
    text: 'Please check the balance for account holder Thandi Nkosi, ID number 9201015800087. Her account number is ACC-78421.',
  },
  {
    icon: Zap,
    title: 'Insurance claim',
    text: 'Claim submitted by John van der Merwe (POL-987654) for vehicle accident on 2024-03-15. Contact: john.vdm@outlook.com, +27 11 234 5678.',
  },
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

  async function protect() {
    if (!input.trim()) return;
    setLoading(true);
    setRestored(null);
    const start = performance.now();
    try {
      const res = await fetch(`${engineUrl}/encrypt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: input, tenantSalt: tenantId }) });
      const data: EncryptResult = await res.json();
      const duration = Math.round(performance.now() - start);
      setResult(data);
      setLastDuration(duration);
      setHistory((prev) => [{ id: nextId++, input, result: data, restored: false, timestamp: new Date(), durationMs: duration }, ...prev].slice(0, 10));
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

  function loadExample(text: string) {
    setInput(text);
    setResult(null);
    setRestored(null);
  }

  function loadFromHistory(entry: HistoryEntry) {
    setInput(entry.input);
    setResult(entry.result);
    setRestored(null);
    setLastDuration(entry.durationMs);
  }

  function highlightEntities(text: string, mappings: EntityMapping[]) {
    if (!mappings.length) return <span>{text}</span>;

    const sorted = [...mappings].sort((a, b) => {
      const aIdx = text.indexOf(a.original);
      const bIdx = text.indexOf(b.original);
      return aIdx - bIdx;
    });

    const parts: React.ReactNode[] = [];
    let cursor = 0;

    for (const m of sorted) {
      const idx = text.indexOf(m.original, cursor);
      if (idx === -1) continue;
      if (idx > cursor) parts.push(<span key={`t-${cursor}`}>{text.slice(cursor, idx)}</span>);
      parts.push(
        <span key={`e-${idx}`} className="font-semibold px-0.5 rounded" style={{ color: 'var(--text-heading)', background: 'var(--color-accent-bg)' }}>
          {m.original}
        </span>
      );
      cursor = idx + m.original.length;
    }
    if (cursor < text.length) parts.push(<span key={`t-${cursor}`}>{text.slice(cursor)}</span>);
    return <>{parts}</>;
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
          Test your privacy pipeline against real-world scenarios. Entities are detected, matched against the vector store, and replaced with deterministic encrypted avatars.
        </p>
      </div>

      {/* Examples — show when no input */}
      {!input && !result && (
        <div>
          <span className="text-[12px] font-medium block mb-3" style={{ color: 'var(--text-heading)' }}>Try a scenario</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {EXAMPLES.map((ex) => {
              const Icon = ex.icon;
              return (
                <Card key={ex.title} hover padding="md" onClick={() => loadExample(ex.text)}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent-bg)' }}>
                      <Icon size={13} style={{ color: 'var(--color-accent-text)' }} />
                    </div>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text-heading)' }}>{ex.title}</span>
                  </div>
                  <p className="text-[12px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>{ex.text}</p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Input area */}
      {(input || result) && (
        <>
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
              <Button variant="ghost" size="sm" onClick={() => { setInput(''); setResult(null); setRestored(null); }}>Clear</Button>

              {lastDuration != null && result && (
                <span className="ml-auto flex items-center gap-1 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  <Clock size={10} /> {lastDuration}ms
                </span>
              )}
            </div>
          </div>

          {/* Pipeline preview */}
          {result && (
            <Card padding="none">
              <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-danger-text)' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-warning-text)' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-success-text)' }} />
                <span className="ml-2 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>privacy pipeline</span>
                {lastDuration != null && (
                  <span className="ml-auto text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{lastDuration}ms</span>
                )}
              </div>
              <div className="p-5 space-y-4 text-[13px]">
                {/* Original with highlights */}
                <div>
                  <div className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Original — {result.mappings.length} entities detected</div>
                  <div className="font-mono leading-relaxed" style={{ color: 'var(--body)' }}>
                    {highlightEntities(result.originalText, result.mappings)}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-medium" style={{ color: 'var(--color-accent-text)' }}>
                  <ArrowRight size={12} /> Veil encrypts {result.mappings.length} entities before the model sees them
                </div>

                {/* Protected */}
                <div className="rounded-xl px-4 py-3" style={{ background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)' }}>
                  <div className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--color-accent-text)' }}>Protected — what the AI model sees</div>
                  <div className="font-mono break-all leading-relaxed" style={{ color: 'var(--body)' }}>{result.veiled}</div>
                </div>

                {/* Restored */}
                {restored && (
                  <>
                    <div className="flex items-center gap-2 text-[10px] font-medium" style={{ color: 'var(--color-success-text)' }}>
                      <ArrowRight size={12} /> Veil decrypts before it reaches you
                    </div>
                    <div className="rounded-xl px-4 py-3" style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' }}>
                      <div className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--color-success-text)' }}>Restored — real data returned</div>
                      <div className="font-mono leading-relaxed" style={{ color: 'var(--body)' }}>{restored.unveiled}</div>
                    </div>
                  </>
                )}

                {/* Determinism note */}
                <div className="flex items-center gap-2 text-[10px] pt-2" style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <Zap size={10} />
                  Deterministic: same input + same salt always produces the same encrypted output. Safe to cache.
                </div>
              </div>
            </Card>
          )}

          {/* Entity mappings */}
          {result && result.mappings.length > 0 && (
            <div>
              <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--color-accent-text)' }}>Detection results</p>
              <span className="text-[13px] font-semibold block mb-3" style={{ color: 'var(--text-heading)' }}>
                {result.mappings.length} entities detected and encrypted
              </span>
              <DataTable columns={columns} data={result.mappings} keyFn={(row, i) => `${row.original}-${i}`} />
            </div>
          )}
        </>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <span className="text-[12px] font-medium block mb-3" style={{ color: 'var(--text-heading)' }}>Recent tests</span>
          <div className="space-y-2">
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => loadFromHistory(entry)}
                className="w-full text-left rounded-xl p-3 transition-all hover:opacity-80"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] truncate max-w-[70%]" style={{ color: 'var(--body)' }}>{entry.input}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Pill variant="accent">{entry.result.mappings.length} entities</Pill>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{entry.durationMs}ms</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{entry.timestamp.toLocaleTimeString()}</span>
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
