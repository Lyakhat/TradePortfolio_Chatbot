import React from 'react';
import { X, Table2, Hash, Type } from 'lucide-react';
import { formatColumnHeader, formatCellValue } from './ChatFeed';

export default function TablePreviewModal({ isOpen, onClose, tableName, tableInfo }) {
  if (!isOpen || !tableInfo) return null;

  const rawColumns = tableInfo.columns || [];
  // Exclude technical IDs
  const HIDDEN_COLUMNS = ['securityid', 'revisionid', 'allocationid', 'id', 'security_id', 'revision_id', 'allocation_id'];
  const columns = rawColumns.filter(c => !HIDDEN_COLUMNS.includes(c.toLowerCase()) && !c.toLowerCase().endsWith('id'));
  const sampleRows = tableInfo.sample_rows || [];

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
        maxWidth: '960px',
        maxHeight: '85vh',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--bg-glass-border)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--bg-glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-tertiary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table2 size={18} color="var(--emerald-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF' }}>Table Preview: {tableName}</h3>
            <span className="badge badge-emerald">{tableInfo.row_count?.toLocaleString()} Total Rows</span>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Columns Tag Cloud */}
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              ALL FIELDS ({columns.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {columns.map(col => (
                <div key={col} style={{
                  padding: '4px 8px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--bg-glass-border)',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span style={{ color: '#FFF', fontWeight: 600 }}>{formatColumnHeader(col)}</span>
                  <span style={{ color: 'var(--cyan-primary)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>({col})</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>[{tableInfo.types?.[col] || 'TEXT'}]</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Rows Table */}
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              SAMPLE RECORDS (Top 3 Rows)
            </div>

            {sampleRows.length > 0 ? (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {columns.map(col => (
                        <th key={col}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{formatColumnHeader(col)}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {columns.map(col => (
                          <td key={col}>{formatCellValue(col, row[col])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No sample rows available.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
