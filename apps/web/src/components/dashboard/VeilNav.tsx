import { FlaskConical, FileText, Database, Settings, LayoutDashboard } from 'lucide-react';
import type { ComponentType } from 'react';

export type Section = 'overview' | 'sandbox' | 'patterns' | 'entities' | 'settings';

interface IconProps { size?: number; style?: React.CSSProperties }

const NAV_GROUPS: { header?: string; items: { id: Section; label: string; icon: ComponentType<IconProps> }[] }[] = [
  {
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    header: 'TEST',
    items: [
      { id: 'sandbox', label: 'Sandbox', icon: FlaskConical },
    ],
  },
  {
    header: 'CONFIGURE',
    items: [
      { id: 'patterns', label: 'Patterns', icon: FileText },
      { id: 'entities', label: 'Entities', icon: Database },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

interface Props {
  section: Section;
  onSectionChange: (s: Section) => void;
}

export function VeilNav({ section, onSectionChange }: Props) {
  return (
    <div className="w-full md:w-44 flex-shrink-0 md:pr-3 py-3" style={{ borderRight: '1px solid var(--border-color)' }}>
      <nav className="flex md:block overflow-x-auto gap-1 md:gap-0 pb-2 md:pb-0 md:space-y-4" role="navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.header ?? 'default'} className="flex md:block gap-1 md:gap-0">
            {group.header && (
              <div className="hidden md:block px-2.5 mb-1 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {group.header}
              </div>
            )}
            <div className="flex md:block gap-0.5 md:gap-0 md:space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = section === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-auto md:w-full whitespace-nowrap flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors outline-none ${isActive ? 'font-medium' : 'hover:opacity-80'}`}
                    style={{
                      background: isActive ? 'var(--nav-active-bg)' : 'transparent',
                      color: isActive ? 'var(--text-heading)' : 'var(--body)',
                    }}
                  >
                    <Icon size={14} style={{ color: isActive ? 'var(--text-heading)' : 'var(--text-muted)' }} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
