import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  SlidersHorizontal, 
  Sparkles, 
  CornerDownLeft, 
  HelpCircle,
  X
} from 'lucide-react';

export default function PromptInput({ 
  onSendMessage, 
  isLoading, 
  temperature, 
  setTemperature, 
  topK, 
  setTopK 
}) {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e) => {
    setInput(e.target.value);
    // Auto grow textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div style={{
      padding: '16px 32px 24px',
      background: 'linear-gradient(180deg, transparent 0%, var(--bg-primary) 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      position: 'relative'
    }}>
      
      {/* Settings Popover */}
      {showSettings && (
        <div className="glass-card animate-fade-in-up" style={{
          position: 'absolute',
          bottom: '80px',
          right: '32px',
          width: '280px',
          padding: '16px',
          zIndex: 20,
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFF' }}>Model & RAG Settings</span>
            <button 
              onClick={() => setShowSettings(false)}
              className="btn btn-ghost"
              style={{ padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Temperature Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Temperature (Strict SQL vs Creative)</span>
                <strong style={{ color: 'var(--emerald-primary)', fontFamily: 'var(--font-mono)' }}>{temperature}</strong>
              </div>
              <input 
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--emerald-primary)' }}
              />
            </div>

            {/* Top-K Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>RAG Few-Shot Examples</span>
                <strong style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>{topK}</strong>
              </div>
              <input 
                type="range"
                min="1"
                max="5"
                step="1"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan-primary)' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Glass Input Bar */}
      <form 
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '860px',
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--bg-glass-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '8px 12px 8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
          transition: 'all var(--transition-smooth)'
        }}
      >
        <Sparkles size={18} color="var(--emerald-primary)" style={{ flexShrink: 0 }} />

        <textarea 
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your portfolio or trades (e.g. 'Show top 5 holdings by value')..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#FFF',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-body)',
            resize: 'none',
            padding: '6px 0',
            maxHeight: '120px'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`btn ${showSettings ? 'btn-secondary' : 'btn-ghost'}`}
            title="Adjust Temperature & RAG parameters"
            style={{ padding: '8px' }}
          >
            <SlidersHorizontal size={15} color={showSettings ? 'var(--cyan-primary)' : 'currentColor'} />
          </button>

          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn btn-primary"
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', gap: '6px' }}
          >
            <span style={{ fontSize: '0.82rem' }}>Send</span>
            <CornerDownLeft size={13} />
          </button>
        </div>
      </form>

      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span>Press <strong style={{ color: 'var(--text-secondary)' }}>Enter ↵</strong> to run query</span>
        <span>•</span>
        <span><strong style={{ color: 'var(--text-secondary)' }}>Shift + Enter</strong> for new line</span>
      </div>
    </div>
  );
}
