import { useState, useEffect, useCallback } from 'react';
import { Header } from '@supaproxy/ui';
import { Shield, LogOut, ChevronDown } from 'lucide-react';
import { AuthGate } from './dashboard/AuthGate';
import { OrgHome } from './dashboard/OrgHome';
import { DomainWorkspace } from './dashboard/DomainWorkspace';

const ENGINE_URL = 'http://localhost:3100';

interface User { id: string; email: string; name: string }
interface Org { id: string; name: string; slug: string; role?: string }
interface Domain { id: string; name: string; slug: string; salt: string }

export default function Dashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [org, setOrg] = useState<Org | null>(null);
  const [domain, setDomain] = useState<Domain | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('veil_token');
    if (stored) { setToken(stored); fetchUser(stored); }
  }, []);

  async function fetchUser(t: string) {
    const res = await fetch(`${ENGINE_URL}/auth/me`, { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) {
      setUser(await res.json());
      loadOrgs(t);
    } else { logout(); }
  }

  async function loadOrgs(t: string) {
    const res = await fetch(`${ENGINE_URL}/orgs`, { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) {
      const data: Org[] = await res.json();
      setOrgs(data);
      if (data.length === 1) setOrg(data[0]);
    }
  }

  function handleAuth(t: string, u: User) {
    setToken(t); setUser(u); localStorage.setItem('veil_token', t);
    loadOrgs(t);
  }

  function logout() {
    setToken(null); setUser(null); setOrg(null); setDomain(null); setOrgs([]);
    localStorage.removeItem('veil_token');
  }

  const navigateToOrg = useCallback((o: Org) => { setOrg(o); setDomain(null); }, []);
  const navigateHome = useCallback(() => { setOrg(null); setDomain(null); }, []);

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
            {/* Org context in header */}
            {org && (
              <div className="flex items-center gap-2">
                {orgs.length > 1 ? (
                  <div className="relative group">
                    <button className="flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-xl transition-colors hover:opacity-80" style={{ color: 'var(--text-heading)', background: 'var(--bg-surface)' }}>
                      {org.name}
                      <ChevronDown size={11} style={{ color: 'var(--text-muted)' }} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 py-1 rounded-xl hidden group-hover:block min-w-[160px] z-50" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                      {orgs.map((o) => (
                        <button key={o.id} onClick={() => navigateToOrg(o)}
                          className="w-full text-left px-3 py-2 text-[12px] transition-colors"
                          style={{ color: o.id === org.id ? 'var(--text-heading)' : 'var(--body)', background: o.id === org.id ? 'var(--nav-active-bg)' : 'transparent' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = o.id === org.id ? 'var(--nav-active-bg)' : 'transparent'}
                        >
                          {o.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text-heading)' }}>{org.name}</span>
                )}
                {domain && (
                  <>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>/</span>
                    <button onClick={() => setDomain(null)} className="text-[12px] transition-opacity hover:opacity-80" style={{ color: 'var(--body)' }}>
                      {domain.name}
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pl-3" style={{ borderLeft: '1px solid var(--border-color)' }}>
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
          <OrgHome
            engineUrl={ENGINE_URL}
            token={token}
            orgs={orgs}
            onSelectOrg={navigateToOrg}
            onOrgsChange={setOrgs}
          />
        ) : !domain ? (
          <OrgHome
            engineUrl={ENGINE_URL}
            token={token}
            orgs={orgs}
            selectedOrg={org}
            onSelectOrg={navigateToOrg}
            onSelectDomain={setDomain}
            onOrgsChange={setOrgs}
            onBack={navigateHome}
          />
        ) : (
          <DomainWorkspace
            engineUrl={ENGINE_URL}
            token={token}
            org={org}
            domain={domain}
            onNavigateUp={() => setDomain(null)}
          />
        )}
      </div>
    </div>
  );
}
