import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, RefreshCw, UserCircle2, Clock, Paperclip, FileText, Image as ImageIcon, Download, Mic, Check } from 'lucide-react';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api').replace(/\/$/, ''),
  headers: { 'Content-Type': 'application/json' }
});

// Add interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '').replace(/\/$/, '');

const getMediaUrl = (path) => {
  if (!path) return '';
  return `${API_BASE}${path}`;
};

const handleDownloadFile = (filePath, messageText, type) => {
  if (!filePath) return;
  const url = getMediaUrl(filePath);

  let fileName = 'download';
  if (type === 'image') {
    fileName = messageText.replace('[IMAGE: ', '').replace(']', '') || 'image';
  } else if (type === 'doc') {
    fileName = messageText.replace('[DOCUMENT: ', '').replace(']', '') || 'document';
  }

  // Ensure filename has extension if the original text doesn't
  const serverExt = filePath.split('.').pop();
  if (serverExt && serverExt.length <= 4 && !fileName.toLowerCase().endsWith('.' + serverExt.toLowerCase())) {
    fileName = fileName + '.' + serverExt;
  }

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  link.setAttribute('target', '_blank');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const FeedbackForm = ({ step, onRate }) => {
  const questions = [
    { key: 'helpfulness', label: 'Was the admin reply helpful?' },
    { key: 'clarity', label: 'Was your doubt clearly answered?' },
    { key: 'communication', label: 'Was the response polite/professional?' },
    { key: 'responseSpeed', label: 'Was the response quick enough?' },
    { key: 'satisfaction', label: 'Are you satisfied with this support?' }
  ];

  const current = questions[step];

  return (
    <div style={{
      marginTop: '12px', padding: '16px', background: 'var(--bg-card)', borderRadius: '16px',
      border: '1px solid var(--border-color)', boxShadow: 'none',
      animation: 'slideUpFade 0.3s ease-out', maxWidth: '280px'
    }}>
      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px' }}>
        {current.label}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
        {[1, 2, 3, 4, 5].map(rating => (
          <button
            key={rating}
            onClick={() => onRate(rating)}
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              border: '1px solid var(--border-color)', background: 'var(--bg-input)',
              fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)',
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.color = 'var(--text-main)'; }}
          >
            {rating}
          </button>
        ))}
      </div>
      <div style={{ marginTop: '10px', fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center', fontWeight: '600' }}>
        Step {step + 1} of 5
      </div>
    </div>
  );
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [session, setSession] = useState(null);
  const [unread, setUnread] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [feedbackSession, setFeedbackSession] = useState(null); // { messageId: 123, step: 0, scores: {} }

  const messagesEndRef = useRef(null);
  const docInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const loadChat = async () => {
    try {
      const res = await api.get('/chat/candidate/session');
      if (res.data && res.data.session) {
        setSession(res.data.session);
        const newMessages = res.data.messages || [];
        setMessages(newMessages);
      }
    } catch (err) {
      console.error('Failed to load chat session', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadChat();
      const interval = setInterval(loadChat, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (!session) return;
    const storageKey = `lastReadTimestamp_${session.session_id}`;

    if (isOpen && !isMinimized) {
      setUnread(0);
      if (messages.length > 0) {
        const latestTime = messages[messages.length - 1].created_at;
        localStorage.setItem(storageKey, latestTime);
        // Also store the count as a fallback
        localStorage.setItem(`lastReadCount_${session.session_id}`, messages.length.toString());
      }
    } else {
      const lastReadTime = localStorage.getItem(storageKey);
      const lastReadCount = parseInt(localStorage.getItem(`lastReadCount_${session.session_id}`) || '0');

      if (!lastReadTime) {
        // If never read, count all admin messages
        setUnread(messages.filter(m => m.sender === 'admin').length);
      } else {
        const lastReadDate = new Date(lastReadTime);
        const newUnread = messages.filter(m =>
          m.sender === 'admin' &&
          new Date(m.created_at) > lastReadDate
        ).length;

        // If the timestamp based count is 0 but messages increased, it might be a clock sync issue or same timestamp
        // So we also check if messages.length > lastReadCount
        if (newUnread === 0 && messages.length > lastReadCount) {
          const adminMsgs = messages.filter(m => m.sender === 'admin');
          const lastReadAdminCount = parseInt(localStorage.getItem(`lastReadAdminCount_${session.session_id}`) || '0');
          if (adminMsgs.length > lastReadAdminCount) {
            setUnread(adminMsgs.length - lastReadAdminCount);
            return;
          }
        }
        setUnread(newUnread);
      }
    }
  }, [messages, isOpen, isMinimized, session]);

  // Keep track of total admin messages seen
  useEffect(() => {
    if (isOpen && !isMinimized && session && messages.length > 0) {
      const adminMsgs = messages.filter(m => m.sender === 'admin');
      localStorage.setItem(`lastReadAdminCount_${session.session_id}`, adminMsgs.length.toString());
    }
  }, [messages, isOpen, isMinimized, session]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
          const audioFile = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });
          handleSendAttachment(audioFile, 'audio');
        }
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Mic error:', err);
      alert("Mic blocked or not found.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadChat();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSendAttachment = async (file, type) => {
    if (!session || !file) return;
    setIsSending(true);
    setShowAttachmentMenu(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await api.post('/chat-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadRes.data.success) {
        await api.post('/chat/candidate/message', {
          session_id: session.session_id,
          message: type === 'audio' ? '[Attachment: voice_message.webm]' : (type === 'image' ? `[IMAGE: ${file.name}]` : `[DOCUMENT: ${file.name}]`),
          message_type: type,
          file_path: uploadRes.data.url
        });
        await loadChat();
      }
    } catch (err) {
      console.error('Failed to send attachment:', err);
      alert("Failed to upload file.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSending) return;

    let currentSession = session;
    if (!currentSession) {
      try {
        const res = await api.get('/chat/candidate/session');
        if (res.data && res.data.session) {
          currentSession = res.data.session;
          setSession(currentSession);
        } else {
          console.error('Session initialization failed - no session returned');
          return;
        }
      } catch (err) {
        console.error('Error loading session on send:', err);
        return;
      }
    }

    setIsSending(true);
    const messageToSend = input.trim();
    setInput('');

    try {
      await api.post('/chat/candidate/message', {
        session_id: currentSession.session_id,
        message: messageToSend
      });
      await loadChat();
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to send message:', err);
      setInput(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleFeedbackSubmit = async (scores, comment) => {
    if (!feedbackSession || !session) return;

    try {
      await api.post('/chat/feedback', {
        candidateId: session.user_id,
        adminId: feedbackSession.adminId || null,
        adminMessageId: feedbackSession.messageId,
        ...scores,
        comment
      });

      // If this feedback session was triggered by a clear/close query request, clear the history in DB
      const originalMsg = messages.find(m => m.id === feedbackSession.messageId);
      const wasClearRequest = originalMsg && originalMsg.message_type === 'clear_history_request';
      
      if (wasClearRequest) {
        await api.delete(`/chat/admin/sessions/${session.session_id}/clear`);
      }

      setFeedbackSession(null);
      
      if (wasClearRequest) {
        loadChat();
      } else {
        // Update local messages to mark this one as rated
        setMessages(prev => prev.map(m =>
          m.id === feedbackSession.messageId ? { ...m, feedback_done: true } : m
        ));

        // Adding a "Thank you" message
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'system',
          message: 'Thank you for your feedback!',
          created_at: new Date().toISOString()
        }]);
      }
    } catch (err) {
      console.error('Failed to submit feedback', err);
    }
  };

  const handleRespondClear = async (messageId, response) => {
    if (!session) return;
    try {
      const res = await api.post(`/chat/candidate/sessions/${session.session_id}/respond-clear`, {
        response,
        message_id: messageId
      });
      if (res.data.success) {
        if (res.data.action === 'trigger_feedback') {
          // Trigger the feedback form with an intermediate Rate this response step
          setFeedbackSession({ messageId, adminId: null, showRateButton: true, step: 0, scores: {} });
        } else {
          loadChat();
        }
      }
    } catch (err) {
      console.error('Failed to respond to close query request', err);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <div
        onClick={toggleChat}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)',
          zIndex: 9999, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: unread > 0 ? 'pulse 2s infinite' : 'scaleIn 0.5s ease-out'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
      >
        <MessageSquare color="#fff" size={28} />
        {unread > 0 && (
          <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }}>
            {unread}
          </div>
        )}
        <style>{`
          @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes slideUpFade { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
          @keyframes recordingPulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
          .spinning-icon { animation: spin 0.8s linear infinite; }
          .recording-pulse { animation: pulse 1.5s infinite; }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: isMinimized ? '30px' : '30px', right: '30px',
      width: '380px', height: isMinimized ? 'auto' : '600px',
      background: 'var(--bg-card)', borderRadius: '24px',
      boxShadow: 'none', border: '1px solid var(--border-color)',
      display: 'flex', flexDirection: 'column', zIndex: 9999,
      overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-sidebar)',
        padding: '20px 24px', color: 'var(--text-main)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        borderBottom: '1px solid var(--border-color)'
      }} onClick={() => setIsMinimized(!isMinimized)}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
              <UserCircle2 size={24} color="#fff" />
            </div>
            <div style={{ position: 'absolute', bottom: '0px', right: '0px', width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', border: '2px solid #0f172a' }}></div>
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.05rem', letterSpacing: '-0.01em', marginBottom: '2px' }}>Admin Support</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
              <Clock size={10} /> Typically replies in minutes
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', zIndex: 1 }}>
          <div
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border-color)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-color)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
            onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
            title="Refresh chat"
          >
            <RefreshCw size={16} color="currentColor" style={{ color: 'var(--text-main)' }} className={isRefreshing ? 'spinning-icon' : ''} />
          </div>
          <div
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border-color)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
          >
            <X size={16} color="currentColor" style={{ color: 'var(--text-main)' }} />
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={30} color="var(--text-muted)" />
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '500' }}>Start a conversation</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '80%' }}>Send a message to our support team and we'll get back to you shortly.</div>
              </div>
            )}

            {messages.map((m, idx) => {
              const isAdmin = m.sender === 'admin';
              const isSystem = m.sender === 'system';
              const isLast = idx === messages.length - 1;
              const isConsecutive = idx > 0 && messages[idx - 1].sender === m.sender;

              if (isSystem) {
                return (
                  <div key={m.id} style={{ alignSelf: 'center', margin: '10px 0', padding: '6px 16px', background: '#e2e8f0', borderRadius: '20px', fontSize: '0.75rem', color: '#475569', fontWeight: '600' }}>
                    {m.message}
                  </div>
                );
              }

              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-start' : 'flex-end', marginTop: isConsecutive ? '-12px' : '0' }}>
                  <div style={{
                    maxWidth: '85%', padding: '14px 18px', fontSize: '0.95rem', lineHeight: '1.5',
                    background: isAdmin ? 'var(--bg-card)' : 'var(--primary)',
                    color: isAdmin ? 'var(--text-main)' : '#ffffff',
                    borderRadius: isAdmin ? '20px 20px 20px 4px' : '20px 20px 4px 20px',
                    boxShadow: isAdmin ? 'none' : '0 4px 10px rgba(79, 70, 229, 0.1)',
                    border: isAdmin ? '1px solid var(--border-color)' : 'none',
                    fontWeight: '400', wordBreak: 'break-word',
                    position: 'relative'
                  }}>
                    {/* ... existing message rendering ... */}
                    {m.message_type === 'deleted' ? (
                      <div style={{ fontStyle: 'italic', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <X size={14} /> This message was deleted
                      </div>
                    ) : (
                      <>
                        {(m.message_type === 'image' || (m.message_type === 'text' && m.message?.includes('[IMAGE:'))) && (
                          <div style={{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={getMediaUrl(m.file_path)} alt="attachment" style={{ maxWidth: '100%', cursor: 'pointer' }} onClick={() => handleDownloadFile(m.file_path, m.message, 'image')} />
                          </div>
                        )}

                        {(m.message_type === 'doc' || (m.message_type === 'text' && m.message?.includes('[DOCUMENT:'))) && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: isAdmin ? '#f1f5f9' : 'rgba(255,255,255,0.15)',
                            padding: '10px', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer'
                          }} onClick={() => handleDownloadFile(m.file_path, m.message, 'doc')}>
                            <FileText size={20} color={isAdmin ? '#4f46e5' : '#fff'} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m.message.replace('[DOCUMENT: ', '').replace(']', '').replace('[DOCUMENT:', '')}
                              </div>
                              <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Click to view</div>
                            </div>
                            <Download size={16} />
                          </div>
                        )}

                        {(m.message_type === 'audio' || (m.message_type === 'text' && m.message?.includes('[Attachment:'))) && (
                          <div style={{ marginBottom: '8px', minWidth: '220px', minHeight: '40px', background: isAdmin ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '4px' }}>
                            <audio controls key={m.file_path} style={{ height: '40px', width: '100%', display: 'block' }}>
                              <source src={getMediaUrl(m.file_path)} type="audio/webm" />
                            </audio>
                          </div>
                        )}

                        {(!m.message_type || m.message_type === 'text') && (
                          (m.message?.includes('[DOCUMENT:') || m.message?.includes('[IMAGE:') || m.message?.includes('[Attachment:')) ? '' : m.message
                        )}

                        {m.message_type === 'clear_history_request' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{m.message}</div>
                            {m.feedback_status === 'accepted' ? (
                              <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                ✓ You accepted this request. Thank you for your feedback!
                              </div>
                            ) : m.feedback_status === 'rejected' ? (
                              <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                ✗ You rejected this request.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button 
                                  type="button"
                                  onClick={() => handleRespondClear(m.id, 'ok')}
                                  style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                  Yes, Resolved & Clear
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleRespondClear(m.id, 'no')}
                                  style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                  No, Keep Open
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {feedbackSession && feedbackSession.messageId === m.id && (
                    feedbackSession.showRateButton ? (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Thank you for resolving! Please share your experience:</div>
                        <button
                          onClick={() => setFeedbackSession(prev => ({ ...prev, showRateButton: false }))}
                          style={{
                            background: '#4f46e5',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            alignSelf: 'flex-start',
                            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
                          }}
                        >
                          Rate this response
                        </button>
                      </div>
                    ) : (
                      <FeedbackForm
                        step={feedbackSession.step}
                        onRate={(score) => {
                          const steps = ['helpfulness', 'clarity', 'communication', 'responseSpeed', 'satisfaction'];
                          const currentKey = steps[feedbackSession.step];
                          const newScores = { ...feedbackSession.scores, [currentKey]: score };

                          if (feedbackSession.step < 4) {
                            setFeedbackSession({ ...feedbackSession, step: feedbackSession.step + 1, scores: newScores });
                          } else {
                            handleFeedbackSubmit(newScores, "");
                          }
                        }}
                      />
                    )
                  )}

                  {(!isConsecutive || isLast) && (
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px', margin: isAdmin ? '6px 0 0 6px' : '6px 6px 0 0', fontWeight: '500' }}>
                      {formatTime(m.created_at)}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} style={{ height: '1px' }} />
          </div>

          <div style={{ padding: '20px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', boxShadow: 'none' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Paperclip
                  size={22}
                  color="currentColor"
                  style={{ cursor: 'pointer', transition: 'color 0.2s', color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                />
                {showAttachmentMenu && (
                  <div style={{ position: 'absolute', bottom: '40px', left: 0, background: 'var(--bg-card)', borderRadius: '12px', width: '160px', boxShadow: 'none', border: '1px solid var(--border-color)', zIndex: 1000, padding: '4px' }}>
                    <div onClick={() => docInputRef.current.click()} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-input)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><FileText size={16} color="var(--primary)" /> Document</div>
                    <div onClick={() => fileInputRef.current.click()} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-input)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><ImageIcon size={16} color="var(--primary)" /> Gallery</div>
                    <input type="file" ref={docInputRef} style={{ display: 'none' }} onChange={(e) => handleSendAttachment(e.target.files[0], 'doc')} />
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleSendAttachment(e.target.files[0], 'image')} />
                  </div>
                )}
              </div>

              <style>{`
                .chat-input-pill:focus-within {
                  border-color: var(--primary) !important;
                  box-shadow: none !important;
                  background: var(--bg-input) !important;
                }
                .chat-input-pill input:focus {
                  outline: none !important;
                  box-shadow: none !important;
                }
              `}</style>
              <div className="chat-input-pill" style={{ flex: 1, background: 'var(--bg-input)', borderRadius: '24px', padding: '4px 12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  style={{ width: '100%', padding: '10px 0', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.95rem', fontFamily: 'inherit', boxShadow: 'none' }}
                />
              </div>

              {input.trim() ? (
                <button type="button" onClick={handleSend} style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={24} color="#4f46e5" />
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isRecording && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold', animation: 'recordingPulse 1s infinite' }}>
                      {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                    </span>
                  )}
                  <div
                    onClick={isRecording ? stopRecording : startRecording}
                    className={isRecording ? 'recording-pulse' : ''}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isRecording ? '#fee2e2' : 'transparent',
                      padding: '8px',
                      borderRadius: '50%',
                      transition: 'all 0.3s'
                    }}
                  >
                    <Mic size={24} color={isRecording ? "#ef4444" : "#94a3b8"} />
                  </div>
                </div>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWidget;
