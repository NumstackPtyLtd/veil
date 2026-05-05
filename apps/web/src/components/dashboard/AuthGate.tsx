import { useState } from 'react';
import { Shield } from 'lucide-react';
import { Button, Field, Input, Card, ErrorAlert } from '@supaproxy/ui';

interface Props {
  engineUrl: string;
  onAuth: (token: string, user: { id: string; email: string; name: string }) => void;
}

export function AuthGate({ engineUrl, onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = mode === 'signup' ? { email, name, password } : { email, password };
      const res = await fetch(`${engineUrl}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Authentication failed');
        return;
      }
      const data = await res.json();
      onAuth(data.token, data.user);
    } catch {
      setError('Connection failed. Is the engine running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[400px] mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield size={20} style={{ color: 'var(--color-accent)' }} />
            <span className="text-[22px] font-bold" style={{ fontFamily: "'Costaline', serif", color: 'var(--text-heading)' }}>Veil</span>
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <Field label="Full name">
                <Input value={name} onChange={setName} placeholder="Jane Doe" />
              </Field>
            )}
            <Field label="Email">
              <Input value={email} onChange={setEmail} placeholder="you@company.com" type="email" />
            </Field>
            <Field label="Password">
              <Input value={password} onChange={setPassword} placeholder="Min 8 characters" type="password" />
            </Field>

            {error && <ErrorAlert message={error} />}

            <Button type="submit" size="md" loading={loading} className="w-full mt-2">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="mt-5 pt-4 text-center" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-[12px]"
              style={{ color: 'var(--color-accent-text)' }}
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
