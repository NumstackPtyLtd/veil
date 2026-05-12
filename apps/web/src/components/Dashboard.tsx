import { useState, useEffect, useCallback } from 'react';
import { Header } from '@supaproxy/ui';
import { Shield, LogOut, ChevronDown, Moon, Sun } from 'lucide-react';
import { AuthGate } from './dashboard/AuthGate';
import { OrgHome } from './dashboard/OrgHome';
import { DomainWorkspace } from './dashboard/DomainWorkspace';

const ENGINE_URL = 'http://localhost:3100';

interface User { id: string; email: string; name: string }
interface Org { id: string; name: string; slug: string; role?: string }
interface Domain { id: string; name: string; slug: string; salt: string }

function parsePath(): { orgSlug?: string; domainSlug?: string; section?: string } {
  const path = window.location.pathname.replace('/dashboard', '').replace(/^\//, '');
  if (!path) return {};
  const parts = path.split('/').filter(Boolean);
  return { orgSlug: parts[0], domainSlug: parts[1], section: parts[2] };
}

function navigate(path: string) {
  const url = `/dashboard${path ? `/${path}` : ''}`;
  if (window.location.pathname !== url) {
    window.history.pushState(null, '', url);
  }
}

export default function Dashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [org, setOrg] = useState<Org | null>(null);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const stored = localStorage.getItem('veil_token');
    if (stored) { setToken(stored); fetchUser(stored); }
  }, []);

  useEffect(() => {
    function onPopState() {
      const { orgSlug, domainSlug } = parsePath();
      if (!orgSlug) { setOrg(null); setDomain(null); return; }
      const matchedOrg = orgs.find((o) => o.slug === orgSlug);
      if (matchedOrg) setOrg(matchedOrg);
      else { setOrg(null); setDomain(null); }
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [orgs]);

  async function fetchUser(t: string) {
    const res = await fetch(`${ENGINE_URL}/auth/me`, { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) { setUser(await res.json()); loadOrgs(t); }
    else logout();
  }

  async function loadOrgs(t: string) {
    const res = await fetch(`${ENGINE_URL}/orgs`, { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) {
      const data: Org[] = await res.json();
      setOrgs(data);
      const { orgSlug } = parsePath();
      if (orgSlug) {
        const matched = data.find((o) => o.slug === orgSlug);
        if (matched) setOrg(matched);
      } else if (data.length === 1) {
        setOrg(data[0]);
      }
    }
  }

  function handleAuth(t: string, u: User) {
    setToken(t); setUser(u); localStorage.setItem('veil_token', t);
    loadOrgs(t);
  }

  function logout() {
    setToken(null); setUser(null); setOrg(null); setDomain(null); setOrgs([]);
    localStorage.removeItem('veil_token');
    navigate('');
  }

  const navigateToOrg = useCallback((o: Org) => {
    setOrg(o); setDomain(null);
    navigate(o.slug);
  }, []);

  const navigateHome = useCallback(() => {
    setOrg(null); setDomain(null);
    navigate('');
  }, []);

  const navigateToDomain = useCallback((d: Domain) => {
    setDomain(d);
    if (org) navigate(`${org.slug}/${d.slug}/overview`);
  }, [org]);

  const navigateToSection = useCallback((section: string) => {
    if (org && domain) navigate(`${org.slug}/${domain.slug}/${section}`);
  }, [org, domain]);

  if (!token || !user) return <AuthGate engineUrl={ENGINE_URL} onAuth={handleAuth} />;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header
        brand={
          <button onClick={navigateHome} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <Shield size={16} style={{ color: 'var(--color-accent)' }} />
            <span className="text-[18px] font-bold" style={{ fontFamily: "'Costaline', serif", color: 'var(--text-heading)' }}>Veil</span>
          </button>
        }
        nav={
          <div className="flex items-center gap-5">
            {org && (
              <div className="flex items-center gap-2">
                {orgs.length > 1 ? (
                  <div className="relative group">
                    <button className="flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80" style={{ color: 'var(--text-heading)', background: 'var(--bg-surface)' }}>
                      {org.name}
                      <ChevronDown size={11} style={{ color: 'var(--text-muted)' }} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 py-1 rounded-lg hidden group-hover:block min-w-[160px] z-50" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                      {orgs.map((o) => (
                        <button key={o.id} onClick={() => navigateToOrg(o)}
                          className="w-full text-left px-3 py-2 text-[12px] transition-colors"
                          style={{ color: o.id === org.id ? 'var(--text-heading)' : 'var(--body)', background: o.id === org.id ? 'var(--nav-active-bg)' : 'transparent' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = o.id === org.id ? 'var(--nav-active-bg)' : 'transparent'}
                        >{o.name}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text-heading)' }}>{org.name}</span>
                )}
                {domain && (
                  <>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>/</span>
                    <button onClick={() => { setDomain(null); navigate(org.slug); }} className="text-[12px] transition-opacity hover:opacity-80" style={{ color: 'var(--body)' }}>
                      {domain.name}
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pl-3" style={{ borderLeft: '1px solid var(--border-color)' }}>
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-1.5 rounded-lg transition-opacity hover:opacity-80" style={{ color: 'var(--text-muted)' }} aria-label="Toggle theme">
                {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              </button>
              <span className="text-[12px] hidden sm:inline" style={{ color: 'var(--text-muted)' }}>{user.name}</span>
              <button onClick={logout} className="flex items-center gap-1 text-[12px] opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--body)' }}>
                <LogOut size={12} />
              </button>
            </div>
          </div>
        }
      />

      <div style={{ paddingTop: '56px' }}>
        {!org ? (
          <OrgHome engineUrl={ENGINE_URL} token={token} orgs={orgs} onSelectOrg={navigateToOrg} onOrgsChange={setOrgs} />
        ) : !domain ? (
          <OrgHome engineUrl={ENGINE_URL} token={token} orgs={orgs} selectedOrg={org} onSelectOrg={navigateToOrg} onSelectDomain={navigateToDomain} onOrgsChange={setOrgs} onBack={navigateHome} />
        ) : (
          <DomainWorkspace
            engineUrl={ENGINE_URL} token={token} user={user} org={org} domain={domain}
            onNavigateUp={() => { setDomain(null); navigate(org.slug); }}
            onSectionChange={navigateToSection}
            initialSection={parsePath().section}
          />
        )}
      </div>
    </div>
  );
}
