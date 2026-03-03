'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Plus } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks';

// ── Types ─────────────────────────────────────────────────────────

interface SessionItem {
  id: string;
  created_at: string;
  preview: string;
  message_count: number;
}

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  currentSessionId?: string;
}

// ── Component ─────────────────────────────────────────────────────

export default function ChatHistoryDrawer({
  isOpen,
  onClose,
  onSelectSession,
  onNewChat,
  currentSessionId,
}: ChatHistoryDrawerProps) {
  const reducedMotion = useReducedMotion();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fetchedRef = useRef(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const fetchSessions = useCallback(async () => {
    if (fetchedRef.current) return;
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/sessions');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: SessionItem[] = await resp.json();
      setSessions(data);
      fetchedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      fetchedRef.current = true; // prevent infinite retries
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch sessions when the drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen, fetchSessions]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      // Delay to avoid catching the opening click
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClick);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClick);
      };
    }
  }, [isOpen, onClose]);

  const handleSelect = (sessionId: string) => {
    onSelectSession(sessionId);
    onClose();
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  const slideVariants = reducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        hidden: { x: -320, opacity: 0 },
        visible: { x: 0, opacity: 1 },
        exit: { x: -320, opacity: 0 },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="chat-history-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            className="chat-history-drawer"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            role="dialog"
            aria-label="Chat history"
          >
            {/* Header */}
            <div className="chat-history-drawer-header">
              <h3 className="chat-history-drawer-title">Chat History</h3>
              <button
                className="chat-history-drawer-close"
                onClick={onClose}
                aria-label="Close chat history"
              >
                <X size={18} />
              </button>
            </div>

            {/* New Chat Button */}
            <button
              className="chat-history-drawer-new"
              onClick={handleNewChat}
            >
              <Plus size={16} />
              <span>New Chat</span>
            </button>

            {/* Session List */}
            <div className="chat-history-drawer-list">
              {loading && (
                <p className="chat-history-drawer-status">Loading...</p>
              )}

              {error && (
                <p className="chat-history-drawer-status chat-history-drawer-error">
                  {error}
                </p>
              )}

              {!loading && !error && sessions.length === 0 && (
                <p className="chat-history-drawer-status">No past chats yet.</p>
              )}

              {sessions.map((session) => {
                const isActive = session.id === currentSessionId;
                return (
                  <motion.button
                    key={session.id}
                    className={`chat-history-drawer-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelect(session.id)}
                    whileHover={reducedMotion ? {} : { x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <MessageSquare size={16} className="chat-history-drawer-item-icon" />
                    <div className="chat-history-drawer-item-content">
                      <p className="chat-history-drawer-item-preview">
                        {session.preview || 'Chat session'}
                      </p>
                      <span className="chat-history-drawer-item-meta">
                        {new Date(session.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {session.message_count > 0 && ` · ${session.message_count} msgs`}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
