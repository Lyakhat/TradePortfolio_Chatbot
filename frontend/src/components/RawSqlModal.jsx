import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Terminal, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Download,
  Copy,
  Check
} from 'lucide-react';
import { executeRawSql } from '../api/client';
import { formatColumnHeader, formatCellValue } from './ChatFeed';

export default function RawSqlModal({ isOpen, onClose, sessionId, initialQuery = '' }) {
  const [sql, setSql] = useState(initialQuery);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setSql(initialQuery);
    }
  }, [initialQuery]);

  if (!isOpen) return null;

  const handleRunSql = async () => {
    if (!sql.trim()) return;
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await executeRawSql({ sessionId, sql: sql.trim() });
      setResult(res);
    } catch (err) {
      setError(err.message || 'Query execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Exclude technical IDs
  const HIDDEN_COLUMNS = ['securityid', 'revisionid', 'allocationid', 'id', 'security_id', 'revision_id', 'allocation_id'];
  const displayColumns = result?.columns 
    ? result.columns.filter(c => !HIDDEN_COLUMNS.includes(c.toLowerCase()) && !c.toLowerCase().endsWith('id'))
    : [];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '24px'
    }}>
      <div className="glass-card animate-fade-in-up" style={{
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--bg-glass-border)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
      }}>
        
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--bg-glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-tertiary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="var(--cyan-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF' }}>SQL Workbench</h3>
            <span className="badge badge-cyan">Session: {sessionId}</span>
          </div>

          <button 
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* SQL Editor Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                SQL QUERY
              </label>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={handleCopy}
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: '0.72rem', gap: '4px' }}
                >
                  {copied ? <Check size={12} color="var(--emerald-primary)" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <textarea 
              rows={4}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="e.g. SELECT PortfolioName, SUM(PL_YTD) as total_pnl FROM holdings GROUP BY PortfolioName ORDER BY total_pnl DESC LIMIT 10;"
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--bg-glass-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--cyan-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                padding: '12px 14px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={14} color="var(--emerald-primary)" /> Safe read-only execution (displays up to 100 rows).
            </div>

            <button 
              disabled={!sql.trim() || isRunning}
              onClick={handleRunSql}
              className="btn btn-primary"
              style={{ gap: '6px' }}
            >
              <Play size={14} /> {isRunning ? 'Executing Query...' : 'Run Query'}
            </button>
          </div>

          {/* Error View */}
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--rose-surface)',
              border: '1px solid rgba(244,63,94,0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--rose-primary)',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Result Data Table */}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--emerald-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={14} /> Total Rows: {result.row_count}
                </span>
              </div>

              {result.data && result.data.length > 0 ? (
                <div className="data-table-container" style={{ maxHeight: '280px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        {displayColumns.map(col => {
                          const isNumeric = result.data.some(r => typeof r[col] === 'number');
                          return (
                            <th key={col} style={{ textAlign: isNumeric ? 'right' : 'left' }}>
                              {formatColumnHeader(col)}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {result.data.map((row, i) => (
                        <tr key={i}>
                          {displayColumns.map(col => {
                            const isNumeric = typeof row[col] === 'number';
                            return (
                              <td key={col} style={{ textAlign: isNumeric ? 'right' : 'left' }}>
                                {formatCellValue(col, row[col])}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Query returned 0 results.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
