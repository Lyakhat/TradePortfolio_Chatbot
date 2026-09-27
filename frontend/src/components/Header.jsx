import React from 'react';
import { 
  Sparkles, 
  Terminal, 
  Trash2, 
  Layers, 
  Zap, 
  ShieldCheck,
  TrendingUp,
  HelpCircle
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
  onOpenRawSql 
}) {
  const tableNames = Object.keys(schema?.tables || {});
  const totalRows = Object.values(schema?.tables || {}).reduce((acc, t) => acc + (t.row_count || 0), 0);

  return (
    <header style={{
      padding: '14px 24px',
      borderBottom: '1px solid var(--bg-glass-border)',
      backgroundColor: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 5,
    }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '4px 10px', 
              background: 'var(--bg-tertiary)', 
              borderRadius: 'var(--radius-full)', 
              border: '1px solid var(--bg-glass-border)' 
            }}>
              <span className="pulse-dot pulse-dot-emerald" style={{ width: '6px', height: '6px' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Session:</span>
              <strong style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{activeSessionId}</strong>
            </span>

            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              {tableNames.length} Tables ({totalRows.toLocaleString()} Records)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={onOpenRawSql}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            <Terminal size={14} color="var(--cyan-primary)" /> SQL Workbench
          </button>

          <button 
            onClick={onClearChat}
            className="btn btn-ghost"
            title="Clear current conversation"
            style={{ padding: '7px 10px', fontSize: '0.8rem' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', flexShrink: 0 }}>
          <Zap size={12} color="var(--amber-primary)" /> Quick Prompts:
        </div>
        
        {PRESET_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(q)}
            style={{
              padding: '4px 10px',
              fontSize: '0.74rem',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--bg-glass-border)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
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
