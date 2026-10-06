import React, { useState } from 'react';
import { 
  Database, 
  Table2, 
  Sparkles, 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronRight, 
  Cpu, 
  Eye, 
  Hash,
  Type,
  X,
  LogOut,
  UserCheck
} from 'lucide-react';

export default function Sidebar({ 
  isOpen,
  onClose,
  schema, 
  samples, 
  onPreviewTable,
  health,
  onOpenRawSql,
  currentUser,
  onLogout
}) {

  const [activeTab, setActiveTab] = useState('schema'); // 'schema' | 'rag'
  const [expandedTables, setExpandedTables] = useState({ holdings: true, trades: false });

  const toggleTable = (tableName) => {
    setExpandedTables(prev => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const tables = schema?.tables || {};
  const tableNames = Object.keys(tables);

  return (
    <aside 
      className={`sidebar-container ${isOpen ? 'open' : ''}`}
      style={{
        width: '320px',
        height: '100%',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--bg-glass-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Brand Header */}
      <div style={{
        padding: '16px 18px',
        borderBottom: '1px solid var(--bg-glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
          }}>
            <Database size={18} color="#041B11" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: '#FFF' }}>
                Trade<span style={{ color: 'var(--emerald-primary)' }}>Pulse</span>
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>v1.0</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Portfolio Analytics Chatbot</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button 
            onClick={onOpenRawSql}
            title="Open SQL Workbench"
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
          >
            <Cpu size={16} color="var(--cyan-primary)" />
          </button>
          
          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            title="Close Sidebar"
            className="btn btn-ghost mobile-only-btn"
            style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
          >
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>
      </div>

      {/* Dataset Context Bar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bg-glass-border)', background: 'rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
          Active Portfolio Dataset
        </div>
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--bg-glass-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          fontSize: '0.8rem',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Database size={14} color="var(--emerald-primary)" />
          <span style={{ fontWeight: 600 }}>Holdings & Trades (SQLite)</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        padding: '6px 12px', 
        gap: '4px',
        borderBottom: '1px solid var(--bg-glass-border)',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <button 
          onClick={() => setActiveTab('schema')}
          className={`btn ${activeTab === 'schema' ? 'btn-secondary' : 'btn-ghost'}`}
          style={{ flex: 1, padding: '6px 8px', fontSize: '0.75rem', gap: '5px' }}
        >
          <Table2 size={13} color={activeTab === 'schema' ? 'var(--emerald-primary)' : 'currentColor'} /> 
          Tables ({tableNames.length})
        </button>
        <button 
          onClick={() => setActiveTab('rag')}
          className={`btn ${activeTab === 'rag' ? 'btn-secondary' : 'btn-ghost'}`}
          style={{ flex: 1, padding: '6px 8px', fontSize: '0.75rem', gap: '5px' }}
        >
          <Sparkles size={13} color={activeTab === 'rag' ? 'var(--purple-primary)' : 'currentColor'} /> 
          Query Bank ({samples?.samples?.length || 0})
        </button>
      </div>

      {/* Tab Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        
        {/* TAB 1: SCHEMA EXPLORER */}
        {activeTab === 'schema' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>DATABASE TABLES</span>
              <span className="badge badge-cyan">{tableNames.length} Tables</span>
            </div>

            {tableNames.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 14px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <FileSpreadsheet size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                Loading database tables...
              </div>
            ) : (
              tableNames.map(tableName => {
                const tableInfo = tables[tableName];
                const isExpanded = !!expandedTables[tableName];
                return (
                  <div 
                    key={tableName} 
                    className="glass-card" 
                    style={{ overflow: 'hidden', border: '1px solid var(--bg-glass-border)' }}
                  >
                    {/* Table Header Row */}
                    <div 
                      onClick={() => toggleTable(tableName)}
                      style={{
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isExpanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                        <span style={{ fontWeight: 600, fontSize: '0.84rem', color: '#FFF' }}>{tableName}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {tableInfo.row_count?.toLocaleString()} rows
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onClose) onClose();
                            onPreviewTable(tableName, tableInfo);
                          }}
                          title="Preview Table Data"
                          className="btn btn-ghost"
                          style={{ padding: '2px 5px' }}
                        >
                          <Eye size={13} color="var(--cyan-primary)" />
                        </button>
                      </div>
                    </div>

                    {/* Columns Accordion Body */}
                    {isExpanded && (
                      <div style={{
                        padding: '8px 12px 12px',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        background: 'rgba(0,0,0,0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px'
                      }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                          COLUMNS ({tableInfo.columns?.length})
                        </div>
                        {tableInfo.columns?.map(col => {
                          const colType = tableInfo.types?.[col] || 'TEXT';
                          const isNumeric = colType.includes('INT') || colType.includes('FLOAT') || colType.includes('NUMERIC') || colType.includes('REAL');
                          return (
                            <div 
                              key={col}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.76rem',
                                fontFamily: 'var(--font-mono)',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                background: 'rgba(255,255,255,0.02)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {isNumeric ? <Hash size={11} color="var(--emerald-primary)" /> : <Type size={11} color="var(--cyan-primary)" />}
                                <span style={{ color: 'var(--text-primary)' }}>{col}</span>
                              </div>
                              <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>{colType}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: QUERY KNOWLEDGE BANK */}
        {activeTab === 'rag' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PORTFOLIO QUERY EXAMPLES</span>
              <span className="badge badge-purple">{samples?.samples?.length || 0} Total Examples</span>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              These example questions guide the AI engine to generate accurate financial analytics and reports.
            </p>

            {(!samples?.samples || samples.samples.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No example queries indexed yet.
              </div>
            ) : (
              samples.samples.map((item, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FFF' }}>
                      {item.question}
                    </span>
                    <span className={`badge ${item.type === 'learned' ? 'badge-emerald' : 'badge-azure'}`} style={{ fontSize: '0.6rem' }}>
                      {item.type === 'learned' ? 'Learned' : 'Standard'}
                    </span>
                  </div>
                  <pre style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--cyan-primary)',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    overflowX: 'auto',
                    marginTop: '6px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {item.sql}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* User Profile & Logout Bar */}
      {currentUser && (
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--bg-glass-border)',
          background: 'rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'var(--emerald-surface)',
              border: '1px solid var(--emerald-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <UserCheck size={14} color="var(--emerald-primary)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.email}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign out & revoke token"
            style={{
              background: 'var(--rose-surface)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--rose-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 600,
              flexShrink: 0,
              transition: 'all var(--transition-fast)'
            }}
          >
            <LogOut size={12} />
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* Footer System Heartbeat */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--bg-glass-border)',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.72rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span className={`pulse-dot ${health?.status === 'healthy' ? 'pulse-dot-emerald' : 'pulse-dot-amber'}`} />
          <span style={{ color: 'var(--text-secondary)' }}>
            AI Analytics Engine
          </span>
        </div>
        <span className="badge badge-emerald" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
          Active
        </span>
      </div>
    </aside>
  );
}

