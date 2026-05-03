import { useState } from 'react';
import { Header, Footer, NavLink, Button, Input } from '@supaproxy/ui';
import { Shield, ArrowRight, Lock, Unlock, RefreshCw, Database } from 'lucide-react';

const PHILOSOPHY_URL = 'https://philosophy.supaproxy.cloud';

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg)' }}>
      <Header
        brand={
          <a href="/" className="flex items-center gap-1.5">
            <span className="text-[18px] font-bold" style={{ fontFamily: "'Costaline', serif", color: 'var(--text-heading)' }}>Veil</span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>by Numstack</span>
          </a>
        }
        nav={
          <>
            <NavLink href="#how-it-works">How it works</NavLink>
            <NavLink href="#features">Features</NavLink>
            <NavLink href={`${PHILOSOPHY_URL}/reversible-privacy`}>Philosophy</NavLink>
            <a href="/early-access" className="btn-glass px-4 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer">Get early access</a>
          </>
        }
      />
      <HeroSection />
      <FlowSection />
      <FeaturesSection />
      <PhilosophyLink />
      <EarlyAccessSection />
      <Footer
        brand={
          <div className="flex items-center gap-1.5">
            <span className="text-[16px] font-bold" style={{ fontFamily: "'Costaline', serif", color: 'var(--text-heading)' }}>Veil</span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>by Numstack</span>
          </div>
        }
        links={
          <>
            <a href="#how-it-works" className="transition-opacity hover:opacity-70">How it works</a>
            <a href="#features" className="transition-opacity hover:opacity-70">Features</a>
            <a href={`${PHILOSOPHY_URL}/reversible-privacy`} className="transition-opacity hover:opacity-70">Philosophy</a>
          </>
        }
        copyright={`\u00A9 ${new Date().getFullYear()} Numstack Pty Ltd. All rights reserved.`}
      />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="min-h-screen flex items-center relative overflow-hidden pt-14">
      <div className="hero-glow" />
      <div className="max-w-[1100px] mx-auto px-6 py-16 md:py-24 text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-[13px]" style={{ border: '1px solid var(--border-light)', color: 'var(--body)' }}>
          <Shield size={14} style={{ color: 'var(--color-accent)' }} />
          Reversible privacy for AI
        </div>

        <h1 className="text-[40px] md:text-[56px] lg:text-[72px] font-bold leading-[1.1] tracking-tight mb-6 max-w-[800px] mx-auto" style={{ color: 'var(--text-heading)' }}>
          Your AI never sees<br />
          <span className="text-gradient">real data</span>.
        </h1>

        <p className="text-[16px] md:text-[18px] leading-relaxed mb-10 max-w-[540px] mx-auto" style={{ color: 'var(--body)' }}>
          Format-preserving encryption that lets AI models reason about your data without ever seeing it. The model works. Your data stays home.
        </p>

        <div className="flex gap-4 items-center justify-center mb-16">
          <a href="/early-access" className="btn-glass px-6 py-3 rounded-xl text-[14px] font-medium cursor-pointer">
            Get early access
          </a>
          <a href="#how-it-works" className="text-[14px] transition-opacity hover:opacity-70" style={{ color: 'var(--body)' }}>
            See how it works <ArrowRight size={14} className="inline ml-1" />
          </a>
        </div>

        {/* Terminal preview */}
        <div className="max-w-[600px] mx-auto rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-danger-text)' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-warning-text)' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-success-text)' }} />
            <span className="ml-2 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>query pipeline</span>
          </div>
          <div className="p-5 text-left space-y-4 text-[13px] font-mono">
            <div>
              <div className="text-[10px] font-medium mb-1.5 font-sans" style={{ color: 'var(--text-muted)' }}>You send a query with real data</div>
              <div style={{ color: 'var(--body)' }}>
                Show me <span className="font-semibold" style={{ color: 'var(--text-heading)' }}>Elvis Magagula</span>'s accounts (ID: <span className="font-semibold" style={{ color: 'var(--text-heading)' }}>9201015800087</span>)
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-sans font-medium" style={{ color: 'var(--color-accent-text)' }}>
              <ArrowRight size={12} /> Veil encrypts before it reaches the model
            </div>
            <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)' }}>
              <div className="text-[10px] font-medium mb-1.5 font-sans" style={{ color: 'var(--color-accent-text)' }}>What the AI model sees</div>
              <div style={{ color: 'var(--body)' }}>
                Show me <span className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>Kgosi Molefe</span>'s accounts (ID: <span className="font-semibold" style={{ color: 'var(--color-accent-text)' }}>8805120300045</span>)
              </div>
            </div>
            <div className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}>
              <div className="text-[10px] font-medium mb-1.5 font-sans" style={{ color: '#0ea5e9' }}>AI responds with fake data</div>
              <div style={{ color: 'var(--body)' }}>
                <span style={{ color: '#0ea5e9' }}>Kgosi Molefe</span> has 3 accounts. Cheque: R24,500...
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-sans font-medium" style={{ color: 'var(--color-accent-text)' }}>
              <ArrowRight size={12} /> Veil decrypts before it reaches you
            </div>
            <div>
              <div className="text-[10px] font-medium mb-1.5 font-sans" style={{ color: 'var(--color-success-text)' }}>What you see — real data restored</div>
              <div style={{ color: 'var(--body)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-heading)' }}>Elvis Magagula</span> has 3 accounts. Cheque: R24,500...
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowSection() {
  const steps = [
    { icon: Lock, title: 'Encrypt', description: 'Real data encrypted to format-preserving fakes. Names become names. Numbers stay numbers. Structure preserved.' },
    { icon: RefreshCw, title: 'Process', description: 'The AI model works with structurally valid data it thinks is real. It reasons, decides, responds. All with fake data.' },
    { icon: Unlock, title: 'Decrypt', description: 'Response decrypted back to real values before reaching the user. The model never knew. The user sees real data.' },
  ];

  return (
    <section id="how-it-works" className="py-16" style={{ background: 'var(--bg-surface)' }}>
      <div className="max-w-[960px] mx-auto px-6">
        <p className="text-[11px] font-medium mb-3" style={{ color: 'var(--color-accent-text)' }}>How it works</p>
        <h2 className="text-[30px] font-bold leading-tight mb-12" style={{ color: 'var(--text-heading)' }}>
          Three steps. Zero real data exposed.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent-bg)' }}>
                    <Icon size={16} style={{ color: 'var(--color-accent-text)' }} />
                  </div>
                  <span className="text-[24px] font-bold" style={{ color: 'var(--color-accent)', opacity: 0.2 }}>0{i + 1}</span>
                </div>
                <h3 className="text-[16px] font-semibold mb-2" style={{ color: 'var(--text-heading)' }}>{step.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--body)' }}>{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: Shield, title: 'Format-preserving', description: 'Account numbers become valid-looking account numbers. Names become real names. IDs stay the right length. The AI cannot tell the difference.' },
    { icon: Database, title: 'Per-company salt', description: 'Each company sets a secret salt. Same data, same salt, same encrypted output every time. Consistent avatars across every conversation.' },
    { icon: RefreshCw, title: 'Fully reversible', description: 'Unlike masking, encryption is two-way. The response comes back with real values. Nothing is lost. Nothing is destroyed.' },
    { icon: Lock, title: 'Stateless', description: 'No data stored. No mapping tables. The salt does all the work. Veil is a proxy, not a database.' },
  ];

  return (
    <section id="features" className="py-16" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[960px] mx-auto px-6">
        <p className="text-[11px] font-medium mb-3" style={{ color: 'var(--color-accent-text)' }}>Features</p>
        <h2 className="text-[30px] font-bold leading-tight mb-10" style={{ color: 'var(--text-heading)' }}>
          Privacy that <span className="text-gradient">preserves utility</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl p-6 card-hover" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'var(--color-accent-bg)' }}>
                  <Icon size={18} style={{ color: 'var(--color-accent-text)' }} />
                </div>
                <h3 className="text-[15px] font-semibold mb-2" style={{ color: 'var(--text-heading)' }}>{f.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--body)' }}>{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PhilosophyLink() {
  return (
    <section className="py-12" style={{ background: 'var(--bg-surface)' }}>
      <div className="max-w-[960px] mx-auto px-6">
        <a
          href={`${PHILOSOPHY_URL}/reversible-privacy`}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl p-8 card-hover"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--color-accent-text)' }}>From the Philosophy</p>
          <h3 className="text-[20px] font-bold mb-2" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>
            What if AI never saw your real data?
          </h3>
          <p className="text-[14px] leading-relaxed mb-3" style={{ color: 'var(--body)' }}>
            Masking destroys context. Encryption preserves it. The difference determines whether enterprises can use AI at all.
          </p>
          <span className="text-[13px] font-medium flex items-center gap-1" style={{ color: 'var(--color-accent-text)' }}>
            Read the full article <ArrowRight size={14} />
          </span>
        </a>
      </div>
    </section>
  );
}

function EarlyAccessSection() {
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
    <section id="early-access" className="py-20" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[440px] mx-auto px-6 text-center">
        {status === 'success' ? (
          <div className="py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--color-accent-bg)' }}>
              <Shield size={28} style={{ color: 'var(--color-accent-text)' }} />
            </div>
            <h2 className="text-[28px] font-bold mb-3" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>You're on the list</h2>
            <p className="text-[15px]" style={{ color: 'var(--body)' }}>We'll reach out when your early access spot is ready.</p>
          </div>
        ) : (
          <>
            <h2 className="text-[28px] font-bold mb-3" style={{ color: 'var(--text-heading)', fontFamily: "'Costaline', serif" }}>
              Get early access
            </h2>
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
          </>
        )}
      </div>
    </section>
  );
}
