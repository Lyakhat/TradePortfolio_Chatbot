import React from 'react';
import { 
  Sparkles, 
  Terminal, 
  Trash2, 
  Zap, 
  Menu
} from 'lucide-react';

const PRESET_QUERIES = [
  "Which portfolios performed best by yearly P&L?",
  "How many trades do we have?",
  "What is the total market value of all holdings?",
  "What custodians do we use?",
  "How many buy vs sell trades?",
  "Average holding value across all portfolios",
  "Show top 5 holdings by market value"
];

export default function Header({ 
  activeSessionId, 
  schema, 
  onSelectPrompt, 
  onClearChat, 
  onToggleSidebar,
  onOpenRawSql 
}) {
  const tableNames = Object.keys(schema?.tables || {});
  const totalRows = Object.values(schema?.tables || {}).reduce((acc, t) => acc + (t.row_count || 0), 0);

  return (
    <header 
      className="header-container"
      style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--bg-glass-border)',
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 5,
      }}
    >
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {/* Hamburger Menu button for mobile/tablet */}
          <button
            onClick={onToggleSidebar}
            className="btn btn-ghost mobile-only-btn"
            title="Open Sidebar"
            style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
          >
            <Menu size={20} color="#FFF" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '3px 8px', 
              background: 'var(--bg-tertiary)', 
              borderRadius: 'var(--radius-full)', 
              border: '1px solid var(--bg-glass-border)',
              whiteSpace: 'nowrap'
            }}>
              <span className="pulse-dot pulse-dot-emerald" style={{ width: '6px', height: '6px' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Session:</span>
              <strong style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{activeSessionId}</strong>
            </span>

            <span className="desktop-only" style={{ color: 'var(--text-muted)', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
              {tableNames.length} Tables ({totalRows.toLocaleString()} Records)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button 
            onClick={onOpenRawSql}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '5px 10px', gap: '5px' }}
          >
            <Terminal size={13} color="var(--cyan-primary)" /> 
            <span className="desktop-only">SQL Workbench</span>
            <span className="mobile-only-btn" style={{ display: 'none' }}>SQL</span>
          </button>

          <button 
            onClick={onClearChat}
            className="btn btn-ghost"
            title="Clear current conversation"
            style={{ padding: '6px 8px', fontSize: '0.78rem' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Quick Prompt Chips with smooth horizontal touch scroll */}
      <div 
        className="no-scrollbar"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '2px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', flexShrink: 0 }}>
          <Zap size={11} color="var(--amber-primary)" /> Quick:
        </div>
        
        {PRESET_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(q)}
            style={{
              padding: '3px 9px',
              fontSize: '0.72rem',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--bg-glass-border)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.color = '#FFF';
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--bg-glass-border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </header>
  );
}
