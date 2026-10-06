import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatFeed from './components/ChatFeed';
import PromptInput from './components/PromptInput';
import RawSqlModal from './components/RawSqlModal';
import TablePreviewModal from './components/TablePreviewModal';
import AuthPage from './components/AuthPage';
import { 
  fetchHealth, 
  fetchSchema, 
  fetchSamples, 
  askQuestion,
  getAuthToken,
  getStoredUser,
  fetchCurrentUser,
  logoutUser
} from './api/client';

export default function App() {
  const activeSessionId = 'default';
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [authToken, setAuthTokenState] = useState(() => getAuthToken());
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);

  const [schema, setSchema] = useState(null);
  const [samples, setSamples] = useState(null);
  const [health, setHealth] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.0);
  const [topK, setTopK] = useState(2);

  // Modals state
  const [rawSqlModalOpen, setRawSqlModalOpen] = useState(false);
  const [rawSqlInitialQuery, setRawSqlInitialQuery] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewTable, setPreviewTable] = useState({ name: '', info: null });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check and verify token on initial load
  useEffect(() => {
    const verifyInitialSession = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const user = await fetchCurrentUser();
          setCurrentUser(user);
          setAuthTokenState(token);
        } catch (err) {
          console.warn('Initial session verification failed or token blacklisted:', err);
          setCurrentUser(null);
          setAuthTokenState(null);
        }
      } else {
        setCurrentUser(null);
        setAuthTokenState(null);
      }
      setIsVerifyingAuth(false);
    };

    verifyInitialSession();
  }, []);

  // Load session data when authenticated
  useEffect(() => {
    if (authToken && currentUser) {
      loadSessionData(activeSessionId);
      loadHealth();
    }
  }, [authToken, currentUser, activeSessionId]);

  const loadHealth = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      console.error('Health check error:', err);
    }
  };

  const loadSessionData = async (sid) => {
    try {
      const [schemaData, samplesData] = await Promise.all([
        fetchSchema(sid).catch(() => null),
        fetchSamples(sid).catch(() => null)
      ]);
      setSchema(schemaData);
      setSamples(samplesData);
    } catch (err) {
      console.error('Failed to load session metadata:', err);
    }
  };

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    setAuthTokenState(token);
  };

  // Requirement 4 & 5: Logout handling with token revocation & blacklisting
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCurrentUser(null);
      setAuthTokenState(null);
      setMessages([]);
    }
  };

  const handleSendMessage = async (text) => {
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await askQuestion({
        sessionId: activeSessionId,
        question: text,
        temperature,
        topK
      });

      const assistantMsg = {
        role: 'assistant',
        sql: response.sql_generated,
        execution_status: response.execution_status,
        row_count: response.row_count,
        columns: response.columns,
        data: response.data,
        formatted_answer: response.formatted_answer,
        learned_to_rag: response.learned_to_rag,
        execution_time_ms: response.execution_time_ms,
        error_message: response.error_message,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);

      // If RAG updated, refresh samples
      if (response.learned_to_rag) {
        fetchSamples(activeSessionId).then(setSamples).catch(() => {});
      }
    } catch (err) {
      if (err.message?.includes('401') || err.message?.includes('revoked') || err.message?.includes('expired')) {
        handleLogout();
        return;
      }

      const errorMsg = {
        role: 'assistant',
        execution_status: 'error',
        formatted_answer: `Error: ${err.message}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRawSqlWithQuery = (sql) => {
    setRawSqlInitialQuery(sql);
    setRawSqlModalOpen(true);
  };

  const handlePreviewTable = (tableName, tableInfo) => {
    setPreviewTable({ name: tableName, info: tableInfo });
    setPreviewModalOpen(true);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  // Brief initial loading screen during token check
  if (isVerifyingAuth) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-muted)',
        fontSize: '0.9rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div className="pulse-dot pulse-dot-emerald" style={{ width: '12px', height: '12px' }} />
          <span>Initializing TradePulse Workspace...</span>
        </div>
      </div>
    );
  }

  // Requirement 2: Whenever user visits first time, Register Page should appear
  if (!authToken || !currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'var(--bg-primary)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Mobile Drawer Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Left Studio Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        schema={schema}
        samples={samples}
        onPreviewTable={handlePreviewTable}
        health={health}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenRawSql={() => {
          setIsSidebarOpen(false);
          setRawSqlInitialQuery('');
          setRawSqlModalOpen(true);
        }}
      />

      {/* Main Studio Canvas */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 0,
        position: 'relative'
      }}>
        {/* Header with quick chips, mobile hamburger & Logout Icon */}
        <Header 
          activeSessionId={activeSessionId}
          schema={schema}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSelectPrompt={handleSendMessage}
          onClearChat={handleClearChat}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onOpenRawSql={() => {
            setRawSqlInitialQuery('');
            setRawSqlModalOpen(true);
          }}
        />

        {/* Conversation & Analytics Stream */}
        <ChatFeed 
          messages={messages}
          isLoading={isLoading}
          onOpenRawSqlWithQuery={handleOpenRawSqlWithQuery}
        />

        {/* Floating Prompt Input Command Bar */}
        <PromptInput 
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          temperature={temperature}
          setTemperature={setTemperature}
          topK={topK}
          setTopK={setTopK}
        />
      </main>

      {/* Raw SQL Workbench Flyout Modal */}
      <RawSqlModal 
        isOpen={rawSqlModalOpen}
        onClose={() => setRawSqlModalOpen(false)}
        sessionId={activeSessionId}
        initialQuery={rawSqlInitialQuery}
      />

      {/* Table Schema & Samples Preview Modal */}
      <TablePreviewModal 
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        tableName={previewTable.name}
        tableInfo={previewTable.info}
      />
    </div>
  );
}
