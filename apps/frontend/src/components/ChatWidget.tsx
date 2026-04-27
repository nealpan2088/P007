/* eslint-disable react/no-unescaped-entities */
// 在线客服聊天浮动组件
// 支持浮动聊天气泡按钮、展开聊天窗口、发送消息/轮询/SSE

import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = '/api/public';
const ICON_CHAT = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const ICON_CLOSE = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ICON_SEND = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);
const ICON_ROBOT = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
);

interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  name: string;
  content: string;
  createdAt: string;
}

function getSessionId(): string {
  let sid = localStorage.getItem('qilin_chat_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('qilin_chat_session_id', sid);
  }
  return sid;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [name, setName] = useState(() => localStorage.getItem('qilin_chat_name') || '');
  const [contact, setContact] = useState(() => localStorage.getItem('qilin_chat_contact') || '');
  const [sending, setSending] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [showForm, setShowForm] = useState(!name);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(getSessionId());
  const esRef = useRef<EventSource | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastTime, setLastTime] = useState('');

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // SSE 连接
  useEffect(() => {
    if (!open) return;
    const sid = sessionId.current;
    esRef.current = new EventSource(`${API_BASE}/chat/stream?sessionId=${sid}`);
    esRef.current.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === 'connected') return;
        // SSE 来的如果是用户发的消息，由轮询处理，避免重复
        if (data.role === 'user') return;
        setMessages(prev => {
          if (prev.find(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
        setHasNew(true);
      } catch { /* skip */ }
    };
    esRef.current.onerror = () => { /* SSE 会自动重连 */ };

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [open]);

  // 轮询（SSE 后备）
  useEffect(() => {
    if (!open) {
      if (pollTimer.current) clearInterval(pollTimer.current);
      return;
    }
    // 先拉一次已有的消息
    fetchMessages();
    pollTimer.current = setInterval(fetchMessages, 5000);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lastTime]);

  async function fetchMessages() {
    try {
      const sid = sessionId.current;
      const since = lastTime || new Date(0).toISOString();
      const res = await fetch(`${API_BASE}/chat/messages?sessionId=${sid}&since=${encodeURIComponent(since)}`);
      const json = await res.json();
      if (json.success && json.data?.length) {
        const newMsgs = json.data.filter((m: ChatMessage) => m.id);
        setMessages(prev => {
          const existing = new Set(prev.map(m => m.id));
          const unique = newMsgs.filter((m: ChatMessage) => !existing.has(m.id));
          if (unique.length) setHasNew(true);
          return unique.length ? [...prev, ...unique] : prev;
        });
        setLastTime(json.data[json.data.length - 1].createdAt);
      }
    } catch { /* 静默失败 */ }
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const sid = sessionId.current;
      const res = await fetch(`${API_BASE}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid,
          name: name || '访客',
          content: input.trim(),
          contact,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages(prev => [...prev, json.data.message]);
        setLastTime(json.data.message.createdAt);
        setInput('');
        if (name) {
          localStorage.setItem('qilin_chat_name', name);
          if (contact) localStorage.setItem('qilin_chat_contact', contact);
        }
        setShowForm(false);
      }
    } catch {
      alert('发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function toggleOpen() {
    setOpen(v => !v);
    if (!open) setHasNew(false);
  }

  // 格式化时间
  function formatTime(iso: string) {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  return (
    <>
      <style>{`
        .chat-widget { position: fixed; bottom: 24px; right: 24px; z-index: 9999; }
        .chat-bubble {
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #fff; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .chat-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5); }
        .chat-bubble.has-new::after {
          content: ''; position: absolute; top: 4px; right: 4px;
          width: 10px; height: 10px; background: #ff4757;
          border-radius: 50%; border: 2px solid #fff;
        }
        .chat-window {
          position: absolute; bottom: 68px; right: 0;
          width: 360px; height: 480px; max-height: 80vh;
          background: #fff; border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          display: flex; flex-direction: column;
          overflow: hidden; animation: chatSlideUp 0.3s ease;
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-header {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #fff; padding: 14px 18px;
          display: flex; align-items: center; gap: 10px;
        }
        .chat-header-title { font-weight: 600; font-size: 15px; }
        .chat-header-sub { font-size: 11px; opacity: 0.8; }
        .chat-body {
          flex: 1; overflow-y: auto; padding: 14px;
          background: #f5f7fa;
        }
        .chat-msg {
          margin-bottom: 12px; max-width: 80%;
        }
        .chat-msg.user { margin-left: auto; }
        .chat-msg.assistant { margin-right: auto; }
        .chat-msg-bubble {
          padding: 10px 14px; border-radius: 12px;
          font-size: 14px; line-height: 1.5; word-break: break-word;
        }
        .chat-msg.user .chat-msg-bubble {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #fff; border-bottom-right-radius: 4px;
        }
        .chat-msg.assistant .chat-msg-bubble {
          background: #fff; color: #333;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .chat-msg-time { font-size: 10px; color: #999; margin-top: 4px; padding: 0 4px; }
        .chat-msg.user .chat-msg-time { text-align: right; }
        .chat-msg-name { font-size: 11px; color: #888; margin-bottom: 2px; font-weight: 500; }
        .chat-msg.assistant .chat-msg-name { color: #667eea; }
        .chat-footer {
          padding: 10px 14px; border-top: 1px solid #eee;
          display: flex; gap: 8px; align-items: center;
          background: #fff;
        }
        .chat-input {
          flex: 1; border: 1px solid #ddd; border-radius: 20px;
          padding: 8px 14px; font-size: 13px; outline: none;
          transition: border-color 0.2s;
        }
        .chat-input:focus { border-color: #667eea; }
        .chat-send-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #fff; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.2s; flex-shrink: 0;
        }
        .chat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .chat-welcome { 
          color: #888; font-size: 13px; text-align: center;
          padding: 20px 10px; line-height: 1.8;
        }
        .chat-form {
          padding: 14px; border-bottom: 1px solid #eee;
          display: flex; flex-direction: column; gap: 8px;
        }
        .chat-form-input {
          border: 1px solid #ddd; border-radius: 8px;
          padding: 8px 12px; font-size: 13px; outline: none;
        }
        .chat-form-input:focus { border-color: #667eea; }
        .chat-form-btn {
          padding: 8px; border-radius: 8px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #fff; border: none; cursor: pointer;
          font-size: 13px; font-weight: 500;
        }
        @media (max-width: 480px) {
          .chat-window { width: calc(100vw - 32px); right: -16px; }
        }
      `}</style>

      <div className="chat-widget">
        {open && (
          <div className="chat-window">
            {/* 头部 */}
            <div className="chat-header">
              {ICON_ROBOT}
              <div>
                <div className="chat-header-title">在线客服</div>
                <div className="chat-header-sub">花花 · 快速解答您的问题</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7 }}
              >
                {ICON_CLOSE}
              </button>
            </div>

            {/* 访客信息表单（首次使用时显示） */}
            {showForm && (
              <div className="chat-form">
                <input
                  className="chat-form-input"
                  placeholder="您的称呼（选填）"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <input
                  className="chat-form-input"
                  placeholder="手机号/微信（选填，方便我们联系您）"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                />
                <button className="chat-form-btn" onClick={() => {
                  if (name) localStorage.setItem('qilin_chat_name', name);
                  if (contact) localStorage.setItem('qilin_chat_contact', contact);
                  setShowForm(false);
                }}>
                  开始咨询
                </button>
              </div>
            )}

            {/* 消息列表 */}
            <div className="chat-body">
              {messages.length === 0 && (
                <div className="chat-welcome">
                  {ICON_ROBOT}
                  <div style={{ marginTop: 8 }}>
                    您好！我是客服助手 <strong>花花</strong> 🐕，欢迎咨询！<br />
                    您可以问我关于产品功能、价格、使用等方面的问题。
                  </div>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`chat-msg ${msg.role}`}>
                  <div className="chat-msg-name">{msg.role === 'assistant' ? '花花' : msg.name}</div>
                  <div className="chat-msg-bubble">{msg.content}</div>
                  <div className="chat-msg-time">{formatTime(msg.createdAt)}</div>
                </div>
              ))}
              <div ref={msgEndRef} />
            </div>

            {/* 输入框 */}
            <div className="chat-footer">
              <input
                className="chat-input"
                placeholder="输入您的问题..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
              />
              <button
                className="chat-send-btn"
                onClick={sendMessage}
                disabled={!input.trim() || sending}
              >
                {ICON_SEND}
              </button>
            </div>
          </div>
        )}

        {/* 浮动气泡按钮 */}
        <button className={`chat-bubble${hasNew ? ' has-new' : ''}`} onClick={toggleOpen} title="在线客服">
          {open ? ICON_CLOSE : ICON_CHAT}
        </button>
      </div>
    </>
  );
}
