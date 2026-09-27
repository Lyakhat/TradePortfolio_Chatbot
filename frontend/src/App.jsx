import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatFeed from './components/ChatFeed';
import PromptInput from './components/PromptInput';
import RawSqlModal from './components/RawSqlModal';
import TablePreviewModal from './components/TablePreviewModal';
import { fetchHealth, fetchSchema, fetchSamples, uploadDatasets, askQuestion } from './api/client';

export default function App() {
  const [sessions, setSessions] = useState([
    { id: 'default', name: 'Default Portfolio (Holdings & Trades)' }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('default');
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

  // Initial load
  useEffect(() => {
    loadSessionData(activeSessionId);
    loadHealth();
  }, [activeSessionId]);

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

  const handleUploadSuccess = async (files) => {
    const result = await uploadDatasets(files);
    const newSession = {
      id: result.session_id,
      name: `Upload (${result.tables.map(t => t.table_name).join(', ')})`
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(result.session_id);
    await loadSessionData(result.session_id);
    return result;
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
      const errorMsg = {
        role: 'assistant',
        execution_status: 'error',
        formatted_answer: `Connection Error: ${err.message}`,
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

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'var(--bg-primary)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Left Studio Sidebar */}
      <Sidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        schema={schema}
        samples={samples}
        onUploadSuccess={handleUploadSuccess}
        onPreviewTable={handlePreviewTable}
        health={health}
        onOpenRawSql={() => {
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
        {/* Header with quick chips */}
        <Header 
          activeSessionId={activeSessionId}
          schema={schema}
          onSelectPrompt={handleSendMessage}
          onClearChat={handleClearChat}
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
