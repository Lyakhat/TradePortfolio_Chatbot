import React, { useState } from 'react';
import { 
  Bot, 
  User, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Search,
  ArrowUpDown,
  ExternalLink,
  Code
} from 'lucide-react';

export default function ChatFeed({ messages, isLoading, onOpenRawSqlWithQuery }) {
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      {messages.length === 0 && (
        <div style={{
          margin: 'auto',
          maxWidth: '560px',
          textAlign: 'center',
          padding: '40px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.2) 100%)',
            border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(16,185,129,0.15)'
          }}>
            <Sparkles size={28} color="var(--emerald-primary)" />
          </div>

          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em' }}>
              Welcome to TradePulse AI
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
              Ask any natural language question to query your portfolio holdings and trades. The engine dynamically constructs safe SQL, executes it, and displays interactive tables.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            width: '100%',
            marginTop: '12px',
            textAlign: 'left'
          }}>
            <div className="glass-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--emerald-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={14} /> Safe & Read-Only
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                Secure analysis with fast interactive filtering and CSV export.
              </div>
            </div>

            <div className="glass-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--purple-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={14} /> Intelligent Insights
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                Deep financial intelligence for holdings, trades, and P&L tracking.
              </div>
            </div>
          </div>
        </div>
      )}

      {messages.map((msg, index) => (
        <MessageBubble 
          key={index} 
          message={msg} 
          onOpenRawSqlWithQuery={onOpenRawSqlWithQuery} 
        />
      ))}

      {isLoading && (
        <div className="animate-fade-in-up" style={{
          display: 'flex',
          gap: '14px',
          maxWidth: '85%',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Bot size={18} color="var(--emerald-primary)" />
          </div>

          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="pulse-dot pulse-dot-emerald" />
            <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Analyzing portfolio data and preparing results...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message, onOpenRawSqlWithQuery }) {
  const isUser = message.role === 'user';
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopySql = () => {
    if (message.sql) {
      navigator.clipboard.writeText(message.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isUser) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        alignSelf: 'flex-end',
        maxWidth: '80%',
      }}>
        <div style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 2px var(--radius-lg)',
          padding: '12px 18px',
          color: '#FFF',
          fontSize: '0.9rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          {message.content}
        </div>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <User size={16} color="#FFF" />
        </div>
      </div>
    );
  }

  // Assistant Response Card
  const { sql, execution_status, row_count, columns, data, formatted_answer, execution_time_ms, error_message } = message;
  const isSuccess = execution_status === 'success';
  const isSecurityViolation = execution_status === 'security_violation';
  const isError = execution_status === 'error';

  // Check if result is a single scalar number/value
  const isSingleValue = isSuccess && data && data.length === 1 && columns && columns.length === 1;

  return (
    <div className="animate-fade-in-up" style={{
      display: 'flex',
      gap: '14px',
      maxWidth: '92%',
      alignSelf: 'flex-start',
      width: '100%'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)'
      }}>
        <Bot size={18} color="#041B11" />
      </div>

      <div className="glass-card" style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Status Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {isError && <span className="badge badge-amber">Query Error</span>}
            {isSecurityViolation && <span className="badge badge-rose">Query Blocked</span>}

            {row_count !== undefined && row_count !== null && (
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#FFF', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Total Rows: <span style={{ color: 'var(--emerald-primary)', fontFamily: 'var(--font-mono)' }}>{row_count.toLocaleString()}</span>
              </span>
            )}

            {execution_time_ms && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                • <Clock size={11} /> {execution_time_ms}ms
              </span>
            )}
          </div>

          {sql && (
            <button
              onClick={() => setShowSql(!showSql)}
              className="btn btn-ghost"
              style={{ fontSize: '0.74rem', padding: '3px 8px', gap: '4px' }}
            >
              <Terminal size={12} color="var(--cyan-primary)" />
              {showSql ? 'Hide SQL' : 'View SQL'}
              {showSql ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {/* Collapsible SQL Inspector */}
        {showSql && sql && (
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--bg-glass-border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Generated SQL Query
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => onOpenRawSqlWithQuery(sql)}
                  className="btn btn-ghost"
                  title="Open in SQL Workbench"
                  style={{ padding: '3px 6px', fontSize: '0.7rem', gap: '4px' }}
                >
                  <ExternalLink size={11} /> Open in Workbench
                </button>
                <button
                  onClick={handleCopySql}
                  className="btn btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '0.7rem', gap: '4px' }}
                >
                  {copied ? <Check size={11} color="var(--emerald-primary)" /> : <Copy size={11} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <pre style={{
              margin: 0,
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--cyan-primary)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {sql}
            </pre>
          </div>
        )}

        {/* Result Content */}
        {isSuccess ? (
          isSingleValue ? (
            <ScalarMetricCard data={data} columns={columns} formatted={formatted_answer} />
          ) : (
            <InteractiveDataTable data={data} columns={columns} />
          )
        ) : (
          <div style={{
            padding: '12px 14px',
            background: isSecurityViolation ? 'var(--rose-surface)' : 'var(--bg-tertiary)',
            border: `1px solid ${isSecurityViolation ? 'rgba(244,63,94,0.3)' : 'var(--bg-glass-border)'}`,
            borderRadius: 'var(--radius-md)',
            color: isSecurityViolation ? 'var(--rose-primary)' : 'var(--text-secondary)',
            fontSize: '0.86rem',
            lineHeight: '1.5'
          }}>
            {error_message || formatted_answer || 'No answer available.'}
          </div>
        )}

      </div>
    </div>
  );
}

function ScalarMetricCard({ data, columns, formatted }) {
  const colName = columns[0];
  const value = data[0][colName];
  const isPositive = typeof value === 'number' && value > 0;
  const isNegative = typeof value === 'number' && value < 0;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
        {formatColumnHeader(colName)}
      </span>
      <div style={{
        fontSize: '2rem',
        fontWeight: 800,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '-0.03em',
        color: isPositive ? 'var(--emerald-primary)' : isNegative ? 'var(--rose-primary)' : '#FFF'
      }}>
        {formatCellValue(colName, value)}
      </div>
    </div>
  );
}

// Global lookup for ticker shortcuts to full security names
const TICKER_NAME_MAP = {
  'SPOT-US': 'Spotify Technology S.A.',
  'SPOT': 'Spotify Technology S.A.',
  'MRK': 'Merck & Co., Inc.',
  'GLD': 'SPDR Gold Shares ETF',
  'MSFT': 'Microsoft Corporation',
  'AAPL': 'Apple Inc.',
  'AMZN': 'Amazon.com, Inc.',
  'AMZN-US': 'Amazon.com, Inc.',
  'GOOG': 'Alphabet Inc. (Google)',
  'GOOG-US': 'Alphabet Inc. (Google)',
  'GOOGL': 'Alphabet Inc. (Google Class A)',
  'NVDA': 'NVIDIA Corporation',
  'TSLA': 'Tesla, Inc.',
  'META': 'Meta Platforms, Inc.',
  'META-US': 'Meta Platforms, Inc.',
  'FB': 'Meta Platforms (Facebook)',
  'NFLX': 'Netflix, Inc.',
  'NFLX-US': 'Netflix, Inc.',
  'UBER US': 'Uber Technologies, Inc.',
  'IBM': 'International Business Machines Corp.',
  'IBM-US': 'International Business Machines Corp.',
  'WMT': 'Walmart Inc.',
  'DIS': 'The Walt Disney Company',
  'SPY': 'SPDR S&P 500 ETF Trust',
  'QQQ': 'Invesco QQQ Trust ETF',
  'VIX': 'CBOE Volatility Index',
  'AA': 'Alcoa Corporation',
  'F': 'Ford Motor Company',
  'C': 'Citigroup Inc.',
  'PM': 'Philip Morris International',
  'RTX': 'RTX Corporation',
  'UTX': 'Raytheon Technologies (UTX)',
  'SAP': 'SAP SE',
  'SAP GR': 'SAP SE (Germany)',
  'ATVI': 'Activision Blizzard, Inc.',
  'BARC': 'Barclays PLC',
  'BARC LN': 'Barclays PLC (London)',
  'BNP': 'BNP Paribas S.A.',
  'BNP FP': 'BNP Paribas (Paris)',
  'BNP GR': 'BNP Paribas (Frankfurt)',
  'BAL': 'Balchem Corporation',
  'BAL AU': 'Balchem Corporation (Australia)',
  'HIO': 'Western Asset High Income Opportunity Fund',
  'NRO': 'Neuberger Berman Real Estate Securities Income Fund',
  'EWJ': 'iShares MSCI Japan ETF',
  'VDC': 'Vanguard Consumer Staples ETF',
  'FVZ6': '5-Year US Treasury Note Futures',
  'USZ6': 'US Treasury Bond Futures',
  'EUR': 'Euro Currency (EUR)',
  'USD': 'US Dollar (USD)',
  'TRY': 'Turkish Lira (TRY)',
  'GBP': 'British Pound Sterling (GBP)'
};

export const formatColumnHeader = (col) => {
  if (!col) return '';
  const dictionary = {
    'secname': 'Security Name',
    'sec_name': 'Security Name',
    'securityname': 'Security Name',
    'security_name': 'Security Name',
    'shortname': 'Asset Short Name',
    'short_name': 'Asset Short Name',
    'name': 'Full Asset Name',
    'assetname': 'Asset Name',
    'asset_name': 'Asset Name',
    'ticker': 'Ticker Symbol',
    'securitytypename': 'Security Type',
    'securitytype': 'Security Type',
    'security_type': 'Security Type',
    'portfolioname': 'Portfolio Name',
    'portfolio_name': 'Portfolio Name',
    'custodianname': 'Custodian Name',
    'custodian_name': 'Custodian Name',
    'custodian': 'Custodian',
    'tradetypename': 'Trade Type',
    'tradetype': 'Trade Type',
    'trade_type': 'Trade Type',
    'directionname': 'Trade Direction',
    'direction': 'Direction',
    'tradedate': 'Trade Date',
    'trade_date': 'Trade Date',
    'settledate': 'Settlement Date',
    'settle_date': 'Settlement Date',
    'asofdate': 'As Of Date',
    'as_of_date': 'As Of Date',
    'opendate': 'Open Date',
    'open_date': 'Open Date',
    'closedate': 'Close Date',
    'close_date': 'Close Date',
    'qty': 'Quantity',
    'quantity': 'Quantity',
    'startqty': 'Starting Quantity',
    'start_qty': 'Starting Quantity',
    'price': 'Price',
    'startprice': 'Starting Price',
    'start_price': 'Starting Price',
    'fxrate': 'FX Rate',
    'fx_rate': 'FX Rate',
    'startfxrate': 'Starting FX Rate',
    'start_fx_rate': 'Starting FX Rate',
    'tradefxrate': 'Trade FX Rate',
    'trade_fx_rate': 'Trade FX Rate',
    'mv_base': 'Market Value (Base USD)',
    'mv_local': 'Market Value (Local)',
    'mvbase': 'Market Value (Base USD)',
    'mvlocal': 'Market Value (Local)',
    'marketvalue': 'Market Value',
    'market_value': 'Market Value',
    'pl_ytd': 'P&L (Year to Date)',
    'pl_mtd': 'P&L (Month to Date)',
    'pl_qtd': 'P&L (Quarter to Date)',
    'pl_dtd': 'P&L (Day to Date)',
    'plytd': 'P&L (Year to Date)',
    'plmtd': 'P&L (Month to Date)',
    'plqtd': 'P&L (Quarter to Date)',
    'pldtd': 'P&L (Day to Date)',
    'total_pl_ytd': 'Total P&L (Year to Date)',
    'total_plytd': 'Total P&L (Year to Date)',
    'total_pnl': 'Total Profit & Loss',
    'total_val': 'Total Market Value',
    'total_cash': 'Total Cash',
    'totalcash': 'Total Cash',
    'strategyname': 'Strategy Name',
    'strategy_name': 'Strategy Name',
    'strategyrefshortname': 'Strategy Reference',
    'strategy1refshortname': 'Strategy 1 Reference',
    'strategy2refshortname': 'Strategy 2 Reference',
    'strategy1name': 'Strategy 1 Name',
    'strategy2name': 'Strategy 2 Name',
    'counterparty': 'Counterparty',
    'principal': 'Principal Amount',
    'interest': 'Accrued Interest',
    'allocationqty': 'Allocation Quantity',
    'allocationprincipal': 'Allocation Principal',
    'allocationinterest': 'Allocation Interest',
    'allocationfees': 'Allocation Fees',
    'allocationcash': 'Allocation Cash',
    'allocationrule': 'Allocation Rule',
    'iscustomallocation': 'Custom Allocation Flag',
    'cusip': 'CUSIP Code',
    'isin': 'ISIN Code'
  };

  const cleanKey = col.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (dictionary[cleanKey]) {
    return dictionary[cleanKey];
  }
  return col.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());
};

export const formatCellValue = (col, val) => {
  if (val === null || val === undefined) {
    return <span style={{ color: 'var(--text-dim)' }}>NULL</span>;
  }

  if (typeof val === 'number') {
    return val.toLocaleString();
  }

  const strVal = String(val).trim();
  const lowerCol = (col || '').toLowerCase();

  // If column is security name / ticker / secname, expand ticker shortcuts if available
  const isSecurityCol = lowerCol.includes('sec') || lowerCol.includes('ticker') || lowerCol.includes('name') || lowerCol.includes('asset');
  if (isSecurityCol && TICKER_NAME_MAP[strVal]) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 600, color: '#FFF' }}>{TICKER_NAME_MAP[strVal]}</span>
        <span style={{ fontSize: '0.68rem', color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>{strVal}</span>
      </div>
    );
  }

  return strVal;
};

function InteractiveDataTable({ data, columns }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 8;

  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No rows returned.</div>;
  }

  // Filter
  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(v => 
      String(v).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortCol) return 0;
    const aVal = a[sortCol];
    const bVal = b[sortCol];
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const pageData = sortedData.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const handleExportCsv = () => {
    if (!data.length) return;
    const headers = columns.join(',');
    const rows = data.map(r => columns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','));
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exclude technical database IDs like SecurityId, RevisionId, AllocationId, id from UI presentation
  const HIDDEN_COLUMNS = ['securityid', 'revisionid', 'allocationid', 'id', 'security_id', 'revision_id', 'allocation_id'];
  const visibleColumns = columns.filter(c => !HIDDEN_COLUMNS.includes(c.toLowerCase()) && !c.toLowerCase().endsWith('id'));
  const displayColumns = visibleColumns.length > 0 ? visibleColumns : columns;

  const isNumericCol = (col) => {
    for (const row of data) {
      if (row[col] !== null && row[col] !== undefined) {
        return typeof row[col] === 'number';
      }
    }
    return false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Table Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
          <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Filter table rows..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            style={{
              width: '100%',
              padding: '6px 10px 6px 28px',
              fontSize: '0.78rem',
              background: 'var(--bg-primary)',
              border: '1px solid var(--bg-glass-border)',
              borderRadius: 'var(--radius-sm)',
              color: '#FFF',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Total Rows: <span style={{ color: 'var(--emerald-primary)', fontFamily: 'var(--font-mono)' }}>{sortedData.length}</span>
          </span>
          <button 
            onClick={handleExportCsv}
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.74rem', gap: '4px' }}
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table Element */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {displayColumns.map(col => {
                const isNumeric = isNumericCol(col);
                return (
                  <th 
                    key={col} 
                    onClick={() => handleSort(col)} 
                    style={{ 
                      cursor: 'pointer',
                      textAlign: isNumeric ? 'right' : 'left'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: isNumeric ? 'flex-end' : 'flex-start',
                      gap: '5px' 
                    }}>
                      <span>{formatColumnHeader(col)}</span>
                      <ArrowUpDown size={11} color={sortCol === col ? 'var(--emerald-primary)' : 'var(--text-dim)'} />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, rIdx) => (
              <tr key={rIdx}>
                {displayColumns.map(col => {
                  const val = row[col];
                  const isNumeric = isNumericCol(col);
                  return (
                    <td key={col} style={{ textAlign: isNumeric ? 'right' : 'left' }}>
                      {formatCellValue(col, val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          <div>Page {page + 1} of {totalPages}</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="btn btn-secondary"
              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
            >
              Previous
            </button>
            <button 
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="btn btn-secondary"
              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
