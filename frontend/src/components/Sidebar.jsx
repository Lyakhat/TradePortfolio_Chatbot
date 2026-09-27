import React, { useState, useRef } from 'react';
import { 
  Database, 
  UploadCloud, 
  Table2, 
  Sparkles, 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  Layers, 
  Eye, 
  Plus, 
  AlertCircle,
  Hash,
  Type
} from 'lucide-react';

export default function Sidebar({ 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  schema, 
  samples, 
  onUploadSuccess, 
  onPreviewTable,
  health,
  onOpenRawSql
}) {
  const [activeTab, setActiveTab] = useState('schema'); // 'schema' | 'rag' | 'upload'
  const [expandedTables, setExpandedTables] = useState({ holdings: true, trades: false });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const toggleTable = (tableName) => {
    setExpandedTables(prev => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await onUploadSuccess(selectedFiles);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setActiveTab('schema');
    } catch (err) {
      setUploadError(err.message || 'Failed to upload CSV files');
    } finally {
      setIsUploading(false);
    }
  };

  const tables = schema?.tables || {};
  const tableNames = Object.keys(tables);

  return (
    <aside style={{
      width: '320px',
      height: '100%',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--bg-glass-border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      zIndex: 10,
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '18px 20px',
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
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>AI Portfolio Intelligence</div>
          </div>
        </div>

        <button 
          onClick={onOpenRawSql}
          title="Open SQL Workbench"
          className="btn btn-ghost"
          style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
        >
          <Cpu size={16} color="var(--cyan-primary)" />
        </button>
      </div>

      {/* Dataset / Session Selector */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bg-glass-border)', background: 'rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Dataset
          </span>
          <button 
            onClick={() => setActiveTab('upload')}
            className="btn btn-primary"
            style={{ padding: '3px 9px', fontSize: '0.72rem', height: '24px', gap: '3px' }}
            title="Upload new CSV Dataset"
          >
            <Plus size={12} strokeWidth={3} /> Upload New
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%', minWidth: 0 }}>
          <select 
            value={activeSessionId} 
            onChange={(e) => onSelectSession(e.target.value)}
            style={{
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--bg-glass-border)',
              borderRadius: 'var(--radius-sm)',
              color: '#FFF',
              padding: '8px 30px 8px 10px',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              cursor: 'pointer',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              appearance: 'none',
              WebkitAppearance: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
            }}
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id} style={{ background: '#0D111A', color: '#FFF' }}>
                {s.id === 'default' ? '📊 Default (Holdings & Trades)' : `📁 ${s.name}`}
              </option>
            ))}
          </select>
          <ChevronDown 
            size={14} 
            color="var(--text-muted)" 
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
          />
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
          Schema ({tableNames.length})
        </button>
        <button 
          onClick={() => setActiveTab('rag')}
          className={`btn ${activeTab === 'rag' ? 'btn-secondary' : 'btn-ghost'}`}
          style={{ flex: 1, padding: '6px 8px', fontSize: '0.75rem', gap: '5px' }}
        >
          <Sparkles size={13} color={activeTab === 'rag' ? 'var(--purple-primary)' : 'currentColor'} /> 
          Query Bank ({samples?.samples?.length || 0})
        </button>
        <button 
          onClick={() => setActiveTab('upload')}
          className={`btn ${activeTab === 'upload' ? 'btn-secondary' : 'btn-ghost'}`}
          style={{ flex: 1, padding: '6px 8px', fontSize: '0.75rem', gap: '5px' }}
        >
          <UploadCloud size={13} color={activeTab === 'upload' ? 'var(--cyan-primary)' : 'currentColor'} /> 
          Upload
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
                No tables in this session yet. Upload a CSV to start.
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

        {/* TAB 3: CSV UPLOAD */}
        {activeTab === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>UPLOAD CSV DATASETS</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Upload any CSV files (e.g. portfolios, trades, holdings). The system will automatically prepare tables for instant querying.
            </p>

            {/* Dropzone Card */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--bg-glass-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.01)',
                transition: 'all var(--transition-smooth)'
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) {
                  setSelectedFiles(Array.from(e.dataTransfer.files));
                }
              }}
            >
              <UploadCloud size={32} color="var(--emerald-primary)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFF' }}>
                Click to browse or drag & drop CSVs
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Supports .csv files (Holdings, Trades, FX, etc.)
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                multiple 
                accept=".csv" 
                style={{ display: 'none' }} 
              />
            </div>

            {/* Selected files preview */}
            {selectedFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Selected Files ({selectedFiles.length}):</div>
                {selectedFiles.map((file, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '0.78rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#FFF' }}>{file.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            )}

            {uploadError && (
              <div style={{ padding: '8px 12px', background: 'var(--rose-surface)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '6px', fontSize: '0.76rem', color: 'var(--rose-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> {uploadError}
              </div>
            )}

            <button 
              disabled={selectedFiles.length === 0 || isUploading}
              onClick={handleUploadSubmit}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px' }}
            >
              {isUploading ? (
                <>
                  <span className="pulse-dot pulse-dot-emerald" /> Ingesting & Processing...
                </>
              ) : (
                <>
                  <UploadCloud size={16} /> Ingest {selectedFiles.length > 0 ? `${selectedFiles.length} File(s)` : 'Files'}
                </>
              )}
            </button>
          </div>
        )}

      </div>

      {/* Footer System Heartbeat */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--bg-glass-border)',
        background: 'rgba(0,0,0,0.2)',
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
