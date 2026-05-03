import { useState } from 'react';
import { Header, Footer, NavLink, Button, Input } from '@supaproxy/ui';
import { Shield } from 'lucide-react';

const PHILOSOPHY_URL = 'https://philosophy.supaproxy.cloud';

export default function EarlyAccessPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !name) return;
    setStatus('submitting');
    // TODO: wire to API
    setTimeout(() => setStatus('success'), 500);
  }

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">
      <Header
        brand={
          <a href="/" className="flex items-center gap-1.5">
            <span className="text-[18px] font-bold" style={{ fontFamily: "'Costaline', serif", color: 'var(--text-heading)' }}>Veil</span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>by Numstack</span>
          </a>
        }
        nav={
          <>
            <NavLink href="/#how-it-works">How it works</NavLink>
            <NavLink href="/#features">Features</NavLink>
            <NavLink href={`${PHILOSOPHY_URL}/reversible-privacy`}>Philosophy</NavLink>
          </>
        }
      />

      <main className="pt-14 flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="max-w-[440px] w-full mx-auto px-6 py-16">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--color-accent-bg)' }}>
                <Shield size={28} style={{ color: 'var(--color-accent-text)' }} />
              </div>
              <h1 className="text-[28px] font-bold mb-3" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>You're on the list</h1>
              <p className="text-[15px] mb-6" style={{ color: 'var(--body)' }}>We'll reach out when your early access spot is ready.</p>
              <a href="/" className="text-[13px] font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--color-accent-text)' }}>
                Back to home
              </a>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--color-accent-bg)' }}>
                <Shield size={22} style={{ color: 'var(--color-accent-text)' }} />
              </div>
              <h1 className="text-[28px] font-bold mb-3" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>
                Get early access
              </h1>
              <p className="text-[15px] mb-8" style={{ color: 'var(--body)' }}>
                Be among the first to use Veil. Free during early access.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--body)' }}>Name</label>
                  <Input value={name} onChange={setName} placeholder="Your name" size="default" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--body)' }}>Work email</label>
                  <Input value={email} onChange={setEmail} placeholder="you@company.com" type="email" size="default" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--body)' }}>Company</label>
                  <Input value={company} onChange={setCompany} placeholder="Company name (optional)" size="default" />
                </div>
                <Button variant="primary" size="md" loading={status === 'submitting'} className="w-full rounded-lg mt-2">
                  Join the waitlist
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer
        brand={
          <div className="flex items-center gap-1.5">
            <span className="text-[16px] font-bold" style={{ fontFamily: "'Costaline', serif", color: 'var(--text-heading)' }}>Veil</span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>by Numstack</span>
          </div>
        }
        links={
          <>
            <a href="/#how-it-works" className="transition-opacity hover:opacity-70">How it works</a>
            <a href="/#features" className="transition-opacity hover:opacity-70">Features</a>
            <a href={`${PHILOSOPHY_URL}/reversible-privacy`} className="transition-opacity hover:opacity-70">Philosophy</a>
          </>
        }
        copyright={`\u00A9 ${new Date().getFullYear()} Numstack Pty Ltd. All rights reserved.`}
      />
    </div>
  );
}
