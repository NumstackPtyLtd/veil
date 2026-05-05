import { useState, useEffect } from 'react';
import { Building2, Plus, ArrowRight, ArrowLeft, Layers } from 'lucide-react';
import { Button, Field, Input, Card, Modal, Pill } from '@supaproxy/ui';

interface Org { id: string; name: string; slug: string; role?: string }
interface Domain { id: string; name: string; slug: string; salt: string }

interface Props {
  engineUrl: string;
  token: string;
  orgs: Org[];
  selectedOrg?: Org;
  onSelectOrg: (org: Org) => void;
  onSelectDomain?: (domain: Domain) => void;
  onOrgsChange: (orgs: Org[]) => void;
  onBack?: () => void;
}

export function OrgHome({ engineUrl, token, orgs, selectedOrg, onSelectOrg, onSelectDomain, onOrgsChange, onBack }: Props) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreateDomain, setShowCreateDomain] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', slug: '' });
  const [newDomain, setNewDomain] = useState({ name: '', slug: '', salt: '' });
  const [creating, setCreating] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (selectedOrg) loadDomains();
  }, [selectedOrg?.id]);

  async function loadDomains() {
    if (!selectedOrg) return;
    const res = await fetch(`${engineUrl}/orgs/${selectedOrg.id}/domains`, { headers });
    if (res.ok) setDomains(await res.json());
  }

  async function createOrg() {
    if (!newOrg.name) return;
    setCreating(true);
    const res = await fetch(`${engineUrl}/orgs`, { method: 'POST', headers, body: JSON.stringify(newOrg) });
    if (res.ok) {
      const created = await res.json();
      onOrgsChange([...orgs, created]);
      onSelectOrg(created);
      setShowCreateOrg(false);
      setNewOrg({ name: '', slug: '' });
    }
    setCreating(false);
  }

  async function createDomain() {
    if (!selectedOrg || !newDomain.name) return;
    setCreating(true);
    const res = await fetch(`${engineUrl}/orgs/${selectedOrg.id}/domains`, { method: 'POST', headers, body: JSON.stringify(newDomain) });
    if (res.ok) {
      const created = await res.json();
      setDomains([...domains, created]);
      setShowCreateDomain(false);
      setNewDomain({ name: '', slug: '', salt: '' });
    }
    setCreating(false);
  }

  // Domain grid for selected org
  if (selectedOrg) {
    return (
      <div className="max-w-[960px] mx-auto px-6 py-10">
        <div className="mb-8">
          {onBack && orgs.length > 1 && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-[12px] mb-3 transition-opacity hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
            >
              <ArrowLeft size={12} />
              Back to organizations
            </button>
          )}
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{selectedOrg.name}</span>
          </div>
          <h1 className="text-[24px] font-bold" style={{ fontFamily: "'Costaline', serif", color: 'var(--text-heading)' }}>Domains</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--body)' }}>
            Each domain has its own encryption salt, entity store, and configuration. Domain settings inherit from the organization and can be overridden.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map((d) => (
            <button
              key={d.id}
              onClick={() => onSelectDomain?.(d)}
              className="text-left rounded-xl p-5 transition-all card-hover group"
              style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl" style={{ background: 'var(--color-accent-bg)' }}>
                  <Layers size={16} style={{ color: 'var(--color-accent-text)' }} />
                </div>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity mt-1" style={{ color: 'var(--text-muted)' }} />
              </div>
              <span className="text-[14px] font-semibold block" style={{ color: 'var(--text-heading)' }}>{d.name}</span>
              <span className="text-[12px] font-mono block mt-0.5" style={{ color: 'var(--text-muted)' }}>{d.slug}</span>
              <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Salt:</span>
                <code className="text-[11px] font-mono" style={{ color: 'var(--body)' }}>{d.salt}</code>
              </div>
            </button>
          ))}

          {/* Create domain card */}
          <button
            onClick={() => setShowCreateDomain(true)}
            className="rounded-xl p-5 transition-all flex flex-col items-center justify-center min-h-[160px] hover:opacity-80"
            style={{ border: '2px dashed var(--border-color)', background: 'transparent' }}
          >
            <Plus size={20} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[13px] font-medium mt-2" style={{ color: 'var(--text-muted)' }}>New domain</span>
          </button>
        </div>

        {/* Create domain modal */}
        {showCreateDomain && (
          <Modal title="Create domain" onClose={() => setShowCreateDomain(false)} maxWidth="max-w-[480px]">
            <div className="p-6 space-y-1">
              <Field label="Domain name" help="A business unit, product, or environment" size="default">
                <Input value={newDomain.name} onChange={(v) => setNewDomain({ name: v, slug: v.toLowerCase().replace(/[^a-z0-9]+/g, '-'), salt: `${selectedOrg.slug}-${v.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` })} placeholder="Claims Processing" size="default" />
              </Field>
              <Field label="Slug" size="default">
                <Input value={newDomain.slug} onChange={(v) => setNewDomain({ ...newDomain, slug: v })} placeholder="claims" mono size="default" />
              </Field>
              <Field label="Encryption salt" help="Unique per domain. Same salt = same entity maps to same encrypted value." size="default">
                <Input value={newDomain.salt} onChange={(v) => setNewDomain({ ...newDomain, salt: v })} placeholder="acme-claims-prod" mono size="default" />
              </Field>
            </div>
            <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateDomain(false)}>Cancel</Button>
              <Button size="sm" onClick={createDomain} loading={creating}>Create domain</Button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // Org selection (when no org selected or multiple orgs)
  return (
    <div className="max-w-[960px] mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-[24px] font-bold" style={{ fontFamily: "'Costaline', serif", color: 'var(--text-heading)' }}>Organizations</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--body)' }}>
          Select an organization to manage its domains and privacy configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orgs.map((o) => (
          <button
            key={o.id}
            onClick={() => onSelectOrg(o)}
            className="text-left rounded-xl p-5 transition-all card-hover group"
            style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: 'var(--card-shadow)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl" style={{ background: 'var(--color-accent-bg)' }}>
                <Building2 size={16} style={{ color: 'var(--color-accent-text)' }} />
              </div>
              <div className="flex items-center gap-2">
                {o.role && <Pill variant="muted">{o.role}</Pill>}
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
            <span className="text-[14px] font-semibold block" style={{ color: 'var(--text-heading)' }}>{o.name}</span>
            <span className="text-[12px] font-mono block mt-0.5" style={{ color: 'var(--text-muted)' }}>{o.slug}</span>
          </button>
        ))}

        <button
          onClick={() => setShowCreateOrg(true)}
          className="rounded-xl p-5 transition-all flex flex-col items-center justify-center min-h-[140px] hover:opacity-80"
          style={{ border: '2px dashed var(--border-color)', background: 'transparent' }}
        >
          <Plus size={20} style={{ color: 'var(--text-muted)' }} />
          <span className="text-[13px] font-medium mt-2" style={{ color: 'var(--text-muted)' }}>New organization</span>
        </button>
      </div>

      {showCreateOrg && (
        <Modal title="Create organization" onClose={() => setShowCreateOrg(false)} maxWidth="max-w-[480px]">
          <div className="p-6 space-y-1">
            <Field label="Organization name" size="default">
              <Input value={newOrg.name} onChange={(v) => setNewOrg({ name: v, slug: v.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} placeholder="Acme Bank" size="default" />
            </Field>
            <Field label="Slug" help="Used in URLs and API calls" size="default">
              <Input value={newOrg.slug} onChange={(v) => setNewOrg({ ...newOrg, slug: v })} placeholder="acme-bank" mono size="default" />
            </Field>
          </div>
          <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid var(--border-color)' }}>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateOrg(false)}>Cancel</Button>
            <Button size="sm" onClick={createOrg} loading={creating}>Create organization</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
