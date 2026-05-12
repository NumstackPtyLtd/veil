import { useState, useEffect } from 'react';
import { VeilNav, type Section } from './VeilNav';
import { Overview } from './Overview';
import { Sandbox } from './Sandbox';
import { Patterns } from './Patterns';
import { Entities } from './Entities';
import { Config } from './Config';

interface User { id: string; email: string; name: string }
interface Org { id: string; name: string; slug: string }
interface Domain { id: string; name: string; slug: string; salt: string }

interface Props {
  engineUrl: string;
  token: string;
  user: User;
  org: Org;
  domain: Domain;
  onNavigateUp: () => void;
  onSectionChange: (section: string) => void;
  initialSection?: string;
}

const SECTION_LABELS: Record<Section, string> = {
  overview: 'Overview',
  sandbox: 'Sandbox',
  patterns: 'Patterns',
  entities: 'Entities',
  settings: 'Settings',
};

const VALID_SECTIONS = new Set<string>(Object.keys(SECTION_LABELS));

export function DomainWorkspace({ engineUrl, token, user, org, domain, onNavigateUp, onSectionChange, initialSection }: Props) {
  const [section, setSection] = useState<Section>(
    initialSection && VALID_SECTIONS.has(initialSection) ? initialSection as Section : 'overview'
  );

  function nav(s: Section) {
    setSection(s);
    onSectionChange(s);
  }

  useEffect(() => {
    function onPop() {
      const path = window.location.pathname.replace('/dashboard', '').replace(/^\//, '');
      const parts = path.split('/').filter(Boolean);
      const s = parts[2];
      if (s && VALID_SECTIONS.has(s) && s !== section) setSection(s as Section);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [section]);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-4 pb-16 text-[13px]">
      <div className="py-2">
        <nav className="flex items-center gap-1.5 text-[11px]" aria-label="Breadcrumb">
          <button onClick={onNavigateUp} className="transition-opacity hover:opacity-80" style={{ color: 'var(--text-muted)' }}>{org.name}</button>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <button onClick={() => nav('overview')} className="transition-opacity hover:opacity-80" style={{ color: 'var(--text-muted)' }}>{domain.name}</button>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span className="font-medium" style={{ color: 'var(--text-heading)' }}>{SECTION_LABELS[section]}</span>
        </nav>
      </div>

      <div className="flex flex-col md:flex-row" style={{ minHeight: 'calc(100vh - 140px)' }}>
        <VeilNav section={section} onSectionChange={nav} />
        <div className="flex-1 min-w-0 md:pl-6 py-3">
          {section === 'overview' && <Overview engineUrl={engineUrl} token={token} user={user} orgId={org.id} domainId={domain.id} tenantId={domain.salt} onNavigate={nav} />}
          {section === 'sandbox' && <Sandbox engineUrl={engineUrl} tenantId={domain.salt} />}
          {section === 'patterns' && <Patterns engineUrl={engineUrl} token={token} orgId={org.id} domainId={domain.id} />}
          {section === 'entities' && <Entities engineUrl={engineUrl} tenantId={domain.salt} />}
          {section === 'settings' && <Config engineUrl={engineUrl} token={token} orgId={org.id} domainId={domain.id} />}
        </div>
      </div>
    </div>
  );
}
