import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Send, Search, MoreVertical, Paperclip, Smile, Mic, Reply, Forward, Trash2,
  Check, ChevronDown, ChevronUp, X, RefreshCw, Archive, Lock as LockIcon, Eraser,
  Download, Filter, Users as UsersIcon, MousePointer2, Edit2, FileText,
  Image as ImageIcon, StopCircle, PlayCircle, Clock, Volume2, Plus, Inbox, Copy,
  Phone, Video, Key
} from 'lucide-react';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AdminChats = () => {
  // --- Core States ---
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Filter & Visibility States ---
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [accountTypeFilter, setAccountTypeFilter] = useState('All Users');
  const [unlockedSessions, setUnlockedSessions] = useState([]);
  const [pinEntry, setPinEntry] = useState(['', '', '', '']);
  const [isLockedView, setIsLockedView] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);

  // --- Interaction States ---
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [openMessageMenu, setOpenMessageMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, direction: 'down', spaceBelow: 0, spaceAbove: 0 });
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [reactionPopup, setReactionPopup] = useState(null); // { id: msgId, x, y }

  const getProfileColor = (id, name = '') => {
    const seed = id ? id.toString() : name;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 65%, 45%)`;
  };


  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

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

  // --- Menu Visibility ---
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [tempPin, setTempPin] = useState('');
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showMasterPinModal, setShowMasterPinModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showChangeMasterPinModal, setShowChangeMasterPinModal] = useState(false);
  const [oldMasterPinEntry, setOldMasterPinEntry] = useState(['', '', '', '']);
  const [newMasterPinEntry, setNewMasterPinEntry] = useState(['', '', '', '']);

  // --- Helper to ensure only one menu is open at a time ---
  const closeAllMenus = (except = null) => {
    if (except !== 'sidebar') setShowSidebarMenu(false);
    if (except !== 'header') setShowHeaderMenu(false);
    if (except !== 'message') setOpenMessageMenu(null);
    if (except !== 'attachment') setShowAttachmentMenu(false);
    if (except !== 'emoji') setShowEmojiPicker(false);
  };

  const [accountants, setAccountants] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [isChatSearchMode, setIsChatSearchMode] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [searchResultIndices, setSearchResultIndices] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ensure action counter is initialized globally
  if (typeof window !== 'undefined' && window.actionCounter === undefined) {
    window.actionCounter = 0;
  }

  const chatMessagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const chatMainRef = useRef(null);

  // --- Voice Recording States ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/chat/admin/sessions');
      setSessions(res.data);
    } catch (err) { console.error('Fetch sessions failed', err); }
    finally { setLoading(false); }
  };

  const fetchMessages = async (force = false) => {
    if (!activeSession) return;
    if (window.actionCounter > 0 && !force) return;
    try {
      const res = await api.get(`/chat/admin/sessions/${activeSession.session_id}?t=${Date.now()}`);
      // Check again after fetch completes
      if (window.actionCounter > 0 && !force) return;
      setMessages(res.data);
      if (res.data.length > 0) {
        // Mark as read while chat is open
        await api.put(`/chat/admin/sessions/${activeSession.session_id}/read`);
      }
    } catch (err) { console.error('Fetch messages failed', err); }
  };

  const fetchAccountants = async () => {
    try {
      const res = await api.get('/accountants');
      setAccountants(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchChatFeedbacks = async () => {
    try {
      const res = await api.get('/chat/admin/feedbacks');
      setFeedbacks(res.data);
    } catch (err) { console.error('Fetch feedbacks failed', err); }
  };

  useEffect(() => {
    fetchSessions();
    fetchAccountants();
    const interval = setInterval(fetchSessions, 5000);

    const handleClickOutside = (e) => {
      // Close message menu if clicking outside
      if (!e.target.closest('.msg-trigger') && !e.target.closest('.message-menu')) {
        setOpenMessageMenu(null);
        setReactionPopup(null);
      }
      // Close sidebar menu if clicking outside
      if (!e.target.closest('.sidebar-menu-trigger') && !e.target.closest('.sidebar-menu-container')) {
        setShowSidebarMenu(false);
      }
      // Close header menu if clicking outside
      if (!e.target.closest('.header-menu-trigger') && !e.target.closest('.header-menu-container')) {
        setShowHeaderMenu(false);
      }
      // Close footer menus if clicking outside
      if (!e.target.closest('.attachment-trigger') && !e.target.closest('.attachment-menu-container') &&
        !e.target.closest('.emoji-trigger') && !e.target.closest('.emoji-picker-container')) {
        setShowAttachmentMenu(false);
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'Feedback') {
      fetchChatFeedbacks();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeSession) {
      fetchMessages();
      const interval = setInterval(() => {
        fetchMessages();
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [activeSession]);

  useEffect(() => {
    // Initial scroll when switching sessions
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages.length === 0 && activeSession]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || !activeSession) return;

    if (editingMessage) {
      try {
        await api.put(`/chat/admin/message/${editingMessage.id}`, { message: input.trim() });
        setEditingMessage(null); setInput(''); fetchMessages();
      } catch (err) { console.error(err); }
      return;
    }

    const payload = { session_id: activeSession.session_id, message: input.trim(), reply_to_id: replyingTo?.id || null };
    setInput(''); setReplyingTo(null);
    try {
      await api.post('/chat/admin/message', payload);
      await fetchMessages();
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) { console.error(err); }
  };

  const handleDeleteMessage = async (msgId, type) => {
    const text = type === 'everyone' ? "Delete this message for everyone?" : "Delete this message for yourself?";
    if (!window.confirm(text)) return;
    try { await api.delete(`/chat/admin/message/${msgId}?type=${type}`); fetchMessages(); } catch (err) { console.error(err); }
  };

  const handleCopyMessage = (txt) => {
    navigator.clipboard.writeText(txt);
  };

  const handleReaction = async (msgId, emoji) => {
    // Reactions have been disabled as per requirements
    return;
  };

  const handleForwardMessage = async (targetSessionId) => {
    if (!forwardingMessage || !targetSessionId) return;
    try {
      await api.post('/chat/admin/message', {
        session_id: targetSessionId,
        message: forwardingMessage.message,
        message_type: forwardingMessage.message_type,
        file_path: forwardingMessage.file_path
      });
      setShowForwardModal(false);
      setForwardingMessage(null);
      alert("Forwarded!");
    } catch (err) { console.error(err); }
  };

  const handleExportChat = () => {
    if (!activeSession || messages.length === 0) return;
    const content = messages.map(m => `[${m.created_at}] ${m.sender.toUpperCase()}: ${m.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `Chat_${activeSession.user_name}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorderRef.current.shouldSave = true;
      mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorder.onstop = () => {
        if (!mediaRecorderRef.current.shouldSave) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
          const audioFile = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });
          handleSendAttachment(audioFile, 'audio');
        }
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start(100);
      setIsRecording(true); setRecordingTime(0);
    } catch (err) { alert("Mic blocked."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); }
  };

  const handleSendAttachment = async (file, type) => {
    if (!activeSession || !file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await api.post('/chat-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadRes.data.success) {
        await api.post('/chat/admin/message', {
          session_id: activeSession.session_id,
          message: type === 'audio' ? '[Attachment: voice_message.webm]' : (type === 'image' ? `[IMAGE: ${file.name}]` : `[DOCUMENT: ${file.name}]`),
          message_type: type,
          file_path: uploadRes.data.url
        });
        fetchMessages();
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('Upload failed', err);
      const errMsg = err.response?.data?.error || err.message || 'Unknown error';
      alert(`Failed to upload file: ${errMsg}`);
    }
  };

  const handleSetPin = async () => {
    // This function is kept for legacy or manual modal usage if needed
    if (!activeSession) return;
    const isUnlocking = !!activeSession.pin;

    if (isUnlocking && tempPin !== activeSession.pin) {
      alert("Incorrect PIN. Please try again.");
      setPinEntry(['', '', '', '']);
      return;
    }

    const currentMasterPin = localStorage.getItem('masterPin') || '1234';
    if (!isUnlocking && tempPin !== currentMasterPin) {
      alert("You must enter your System Master PIN to lock a chat.");
      setPinEntry(['', '', '', '']);
      return;
    }

    const pinVal = isUnlocking ? null : tempPin;

    try {
      await api.put(`/chat/admin/sessions/${activeSession.session_id}/pin`, { pin: pinVal });
      await fetchSessions();
      if (!isUnlocking) {
        setActiveSession(null); // Hide locked chat immediately
      } else {
        // Just refresh the active session to show it's unlocked
        try {
          const res = await api.get(`/chat/admin/sessions/${activeSession.session_id}`);
          if (res.data && res.data.length > 0) {
            setActiveSession(res.data[0]);
          }
        } catch (e) {
          setActiveSession(null);
        }
      }
      setShowPinModal(false);
      setTempPin('');
    } catch (err) { console.error(err); }
  };
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }
    if (selectedSessionIds.length === 0) {
      alert("Please select at least one member");
      return;
    }

    try {
      const memberIds = sessions
        .filter(s => selectedSessionIds.includes(s.session_id))
        .map(s => s.user_id)
        .filter(id => id != null);

      if (memberIds.length === 0) {
        alert("Could not identify selected members. Please try again.");
        return;
      }

      const res = await api.post('/groups', {
        group_name: groupName,
        member_ids: memberIds
      });

      if (res.data.success) {
        setGroupName('');
        setSelectedSessionIds([]);
        setIsSelectionMode(false);
        setShowGroupModal(false);
        fetchSessions();
        alert(`Group "${groupName}" created successfully!`);
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to create group: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleChatSearch = (query) => {
    setChatSearchQuery(query);
    if (!query) {
      setSearchResultIndices([]);
      setCurrentSearchIndex(-1);
      return;
    }
    const indices = [];
    messages.forEach((m, idx) => {
      if (m.message && m.message.toLowerCase().includes(query.toLowerCase())) {
        indices.push(idx);
      }
    });
    setSearchResultIndices(indices);
    if (indices.length > 0) {
      setCurrentSearchIndex(indices.length - 1);
      scrollToMessage(indices[indices.length - 1]);
    } else {
      setCurrentSearchIndex(-1);
    }
  };

  const scrollToMessage = (idx) => {
    const msg = messages[idx];
    if (msg && messageRefs.current[msg.id]) {
      messageRefs.current[msg.id].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const nextSearchResult = () => {
    if (searchResultIndices.length === 0) return;
    const newIdx = (currentSearchIndex + 1) % searchResultIndices.length;
    setCurrentSearchIndex(newIdx);
    scrollToMessage(searchResultIndices[newIdx]);
  };

  const prevSearchResult = () => {
    if (searchResultIndices.length === 0) return;
    const newIdx = (currentSearchIndex - 1 + searchResultIndices.length) % searchResultIndices.length;
    setCurrentSearchIndex(newIdx);
    scrollToMessage(searchResultIndices[newIdx]);
  };

  const handleVerifyMasterPin = () => {
    const fullPin = pinEntry.join('');
    const currentMasterPin = localStorage.getItem('masterPin') || '1234';
    if (fullPin === currentMasterPin) {
      setIsPinVerified(true);
      setActiveTab('Locked');
      setSearchTerm('');
      setShowMasterPinModal(false);
      setPinEntry(['', '', '', '']);
    } else {
      alert("Invalid Security PIN. Please try again.");
      setPinEntry(['', '', '', '']);
    }
  };

  const handleChangeMasterPin = () => {
    const currentMasterPin = localStorage.getItem('masterPin') || '1234';
    const oldFullPin = oldMasterPinEntry.join('');
    const newFullPin = newMasterPinEntry.join('');

    if (oldFullPin !== currentMasterPin) {
      alert("Old PIN is incorrect.");
      return;
    }
    if (newFullPin.length < 4) {
      alert("New PIN must be 4 digits.");
      return;
    }

    localStorage.setItem('masterPin', newFullPin);
    alert("Master PIN changed successfully.");
    setShowChangeMasterPinModal(false);
    setOldMasterPinEntry(['', '', '', '']);
    setNewMasterPinEntry(['', '', '', '']);
  };

  const handleArchive = async () => {
    try {
      await api.put(`/chat/admin/sessions/${activeSession.session_id}/archive`, { archived: !activeSession.archived });
      fetchSessions(); setShowHeaderMenu(false);
    } catch (err) { console.error(err); }
  };

  const handleCloseQuery = async () => {
    if (!window.confirm("Are you sure you want to request to close this query? This will ask the candidate for their permission and feedback.")) return;
    try {
      await api.post(`/chat/admin/request-clear/${activeSession.session_id}`);
      fetchMessages();
      setShowHeaderMenu(false);
      alert("Close request sent! The candidate will be prompted for their permission and feedback inside their chat widget.");
    } catch (err) {
      console.error(err);
      alert("Failed to send close request.");
    }
  };

  const handleDeleteSession = async () => {
    const isGroup = activeSession.user_role === 'group';
    if (!window.confirm(`Are you sure you want to delete this ${isGroup ? 'group' : 'chat'}? This action cannot be undone.`)) return;
    try {
      const res = await api.delete(`/chat/admin/sessions/${activeSession.session_id}`, { data: { name: activeSession.user_name } });
      if (res.data.success) {
        setActiveSession(null);
        await fetchSessions();
        setShowHeaderMenu(false);
      } else {
        alert("Deletion failed on server. Please check logs.");
      }
    } catch (err) {
      console.error('Delete failed', err);
      const msg = err.response?.data?.error || err.message;
      alert(`Failed to delete: ${msg}`);
    }
  };

  const filteredSessions = sessions.filter(s => {
    const search = searchTerm.toLowerCase();
    const name = (s.user_name || '').toLowerCase();
    const email = (s.user_email || '').toLowerCase();
    const role = (s.user_role || '').toLowerCase();
    const matchesSearch = name.includes(search) || email.includes(search);
    const matchesRole = accountTypeFilter === 'All Users' || (role === accountTypeFilter.toLowerCase());
    const isManualTestUser = name === 'manual test user';

    if (isManualTestUser) return false;

    if (activeTab === 'Archived') return matchesSearch && matchesRole && s.archived;
    if (activeTab === 'Locked') return matchesSearch && matchesRole && s.pin;
    return matchesSearch && matchesRole && !s.archived && !s.pin;
  });

  const getInitials = (n) => (n || 'Guest').split(' ').map(x => x[0]).join('').toUpperCase().substring(0, 2);
  const getTime = (t) => {
    if (!t) return '';
    try { const d = new Date(t); return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch (err) { return ''; }
  };

  const onlineCount = sessions.filter(s => s.status === 'active' && s.user_name?.toLowerCase() !== 'manual test user').length;

  return (
    <div className="admin-chats-wrapper" style={{ height: '100%', width: '100%', position: 'relative' }}>
      <style>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reaction-bubble {
          animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        :root {
          --shadow-lg: var(--shadow-md);
        }
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;
        }
        .modal-card {
          background: var(--bg-card); padding: 24px; border-radius: 16px;
          width: 400px; box-shadow: var(--shadow-lg); color: var(--text-main);
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--card-border); padding-bottom: 16px; margin-bottom: 16px;
        }
        .pin-input {
          width: 50px; height: 50px; font-size: 1.5rem; text-align: center; border-radius: 8px; border: 1px solid var(--card-border); margin: 0 5px; outline: none; background: var(--bg-main); color: var(--text-main);
        }
        .pin-input:focus { border-color: #3b82f6; }
        @keyframes slideDownMenu {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUpMenu {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning-icon {
          animation: spin 0.8s ease-in-out;
        }
        .admin-chats-wrapper input:focus {
          border-color: var(--card-border) !important;
          box-shadow: none !important;
        }
      `}</style>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        background: 'var(--bg-main)',
        overflow: 'hidden',
        width: '100%'
      }}>

        {/* SESSIONS PANEL */}
        <div style={{
          width: '300px',
          minWidth: '300px',
          borderRight: '1px solid var(--card-border)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-sidebar)',
          height: '100%',
          overflow: 'hidden'
        }}>
          <header style={{ padding: '14px 15px', background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--card-border)', flexShrink: 0 }}>
            <div style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Chats</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <Search size={13} />
                </div>
                <input
                  type="text"
                  id="admin_chat_search_sidebar_input"
                  name="chat_search_sidebar_no_autofill"
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  style={{
                    width: '100%',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '6px',
                    padding: '5px 8px 5px 26px',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontSize: '0.7rem',
                    height: '28px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(16, 185, 129, 0.08)', padding: '4px 6px', borderRadius: '6px', color: '#10b981', fontWeight: '800', fontSize: '0.55rem', whiteSpace: 'nowrap', height: '28px' }}>
                <span style={{ color: '#10b981' }}>{onlineCount} online</span>
              </div>

              <div style={{ position: 'relative', display: 'flex', gap: '4px' }}>

                <button
                  className="sidebar-menu-trigger"
                  onClick={() => {
                    const newVal = !showSidebarMenu;
                    if (newVal) closeAllMenus('sidebar');
                    setShowSidebarMenu(newVal);
                  }}
                  style={{ background: 'var(--bg-main)', border: '1px solid var(--card-border)', padding: '5px', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '28px', width: '28px' }}
                >
                  <MoreVertical size={14} />
                </button>
                {showSidebarMenu && (
                  <div className="sidebar-menu-container" style={{ position: 'absolute', top: '45px', right: 0, background: 'var(--bg-card)', borderRadius: '18px', width: '220px', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                    <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1rem', color: 'var(--text-main)' }}>Actions <X size={16} style={{ cursor: 'pointer' }} onClick={() => setShowSidebarMenu(false)} /></div>
                    {[
                      { label: 'All Chats', icon: Inbox, act: () => setActiveTab('All') },
                      { label: 'Archived', icon: Archive, act: () => setActiveTab('Archived') },
                      { label: 'Feedback Dashboard', icon: FileText, act: () => setActiveTab('Feedback') },
                      {
                        label: 'View Locked', icon: LockIcon, act: () => {
                          if (isPinVerified) {
                            setActiveTab('Locked');
                            setSearchTerm('');
                          }
                          else {
                            setPinEntry(['', '', '', '']);
                            setShowMasterPinModal(true);
                          }
                        }
                      },
                      {
                        label: 'Change System PIN', icon: Key, act: () => {
                          setShowChangeMasterPinModal(true);
                        }
                      }
                    ].map((m, i) => (
                      <div key={i} onClick={() => { m.act(); if (!m.className) setShowSidebarMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 18px', cursor: 'pointer', color: m.color || '#475569', fontSize: '0.85rem', fontWeight: '700', background: m.bg || 'transparent' }} onMouseEnter={(e) => !m.bg && (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)')} onMouseLeave={(e) => !m.bg && (e.currentTarget.style.background = 'transparent')}>
                        <m.icon size={16} className={m.className || ''} /> {m.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          {isSelectionMode && (
            <div style={{ background: '#3b82f6', color: '#fff', padding: '12px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 'bold', animation: 'slideDown 0.3s ease' }}>
              <span>{selectedSessionIds.length} Accountants Selected</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '15px' }}>
                <span
                  style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '8px 20px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.3)', fontSize: '0.8rem', fontWeight: '800', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onClick={() => { setIsSelectionMode(false); setSelectedSessionIds([]); }}
                >
                  Cancel
                </span>
                {selectedSessionIds.length > 0 && (
                  <span
                    style={{ cursor: 'pointer', background: 'var(--bg-card)', color: '#3b82f6', padding: '8px 20px', borderRadius: '30px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '0.8rem', fontWeight: '800', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                    onClick={() => setShowGroupModal(true)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    Create Group
                  </span>
                )}
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredSessions.map(s => (
              <div key={s.session_id} onClick={() => {
                if (isSelectionMode && s.user_role?.toLowerCase() === 'accountant') {
                  if (selectedSessionIds.includes(s.session_id)) setSelectedSessionIds(selectedSessionIds.filter(id => id !== s.session_id));
                  else setSelectedSessionIds([...selectedSessionIds, s.session_id]);
                } else {
                  setActiveSession(s);
                  if (s.unread_count > 0) {
                    api.put(`/chat/admin/sessions/${s.session_id}/read`).then(() => fetchSessions());
                  }
                }
              }}
                onMouseEnter={(e) => {
                  if (activeSession?.session_id !== s.session_id) e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                }}
                onMouseLeave={(e) => {
                  if (activeSession?.session_id !== s.session_id) e.currentTarget.style.background = 'transparent';
                }}
                style={{ padding: '10px 10px', cursor: 'pointer', display: 'flex', gap: '10px', borderBottom: '1px solid var(--card-border)', transition: 'all 0.2s', background: activeSession?.session_id === s.session_id ? 'rgba(59, 130, 246, 0.04)' : (selectedSessionIds.includes(s.session_id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent'), borderLeft: activeSession?.session_id === s.session_id ? '4px solid #3b82f6' : '4px solid transparent' }}>
                {isSelectionMode && (s.user_role?.toLowerCase() === 'accountant') && (
                  <div style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid #3b82f6',
                      borderRadius: '4px',
                      background: selectedSessionIds.includes(s.session_id) ? '#3b82f6' : 'rgba(59, 130, 246, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}>
                      {selectedSessionIds.includes(s.session_id) && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>
                  </div>
                )}
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '0.75rem', background: getProfileColor(s.session_id || s.id, s.user_name) }}>{getInitials(s.user_name)}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                      <span style={{ fontWeight: '800', fontSize: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.user_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '600' }}>{getTime(s.last_message_time || s.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {s.user_role === 'group' ? (s.group_members ? `Members: ${s.group_members}` : 'No members') : s.user_email}
                    </span>
                    {s.unread_count > 0 && (
                      <div style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: '900', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)', marginLeft: '8px', flexShrink: 0 }}>
                        {s.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MESSAGES CONSOLE */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-main)',
          position: 'relative',
          height: '100%',
          overflow: 'hidden'
        }}>
          {activeTab === 'Feedback' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', padding: '30px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>Chat Feedback Dashboard</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Detailed breakdown of candidate satisfaction across all interactions.</p>
                </div>
                <button
                  onClick={fetchChatFeedbacks}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}
                >
                  <RefreshCw size={18} /> Refresh Data
                </button>
              </div>

              <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Candidate</th>
                      <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Admin Reply</th>
                      <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Helpful</th>
                      <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Clear</th>
                      <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Polite</th>
                      <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Speed</th>
                      <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Satis.</th>
                      <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Final Stars</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                          <Inbox size={40} style={{ display: 'block', margin: '0 auto 15px', opacity: 0.3 }} />
                          No feedback data available yet.
                        </td>
                      </tr>
                    ) : feedbacks.map((f, i) => (
                      <tr key={f.id} style={{ borderBottom: i === feedbacks.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>{f.candidate_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(f.created_at).toLocaleDateString()}</div>
                        </td>
                        <td style={{ padding: '16px 20px', maxWidth: '250px' }}>
                          <div style={{ fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.admin_reply}</div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800', background: f.helpfulness >= 4 ? '#dcfce7' : '#fee2e2', color: f.helpfulness >= 4 ? '#166534' : '#991b1b' }}>{f.helpfulness}</span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800', background: f.clarity >= 4 ? '#dcfce7' : '#fee2e2', color: f.clarity >= 4 ? '#166534' : '#991b1b' }}>{f.clarity}</span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800', background: f.communication >= 4 ? '#dcfce7' : '#fee2e2', color: f.communication >= 4 ? '#166534' : '#991b1b' }}>{f.communication}</span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800', background: f.response_speed >= 4 ? '#dcfce7' : '#fee2e2', color: f.response_speed >= 4 ? '#166534' : '#991b1b' }}>{f.response_speed}</span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800', background: f.satisfaction >= 4 ? '#dcfce7' : '#fee2e2', color: f.satisfaction >= 4 ? '#166534' : '#991b1b' }}>{f.satisfaction}</span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <span key={star} style={{ color: star <= f.final_rating ? '#fbbf24' : '#e2e8f0', fontSize: '1rem' }}>★</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeSession ? (() => {
            const currentSession = sessions.find(s => s.session_id === activeSession.session_id) || activeSession;
            return (
              <>
                <header style={{ padding: '15px 25px', background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, zIndex: 100 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getProfileColor(currentSession.session_id || currentSession.id, currentSession.user_name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800' }}>{getInitials(currentSession.user_name)}</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-main)' }}>{currentSession.user_name}</h3>
                      <span style={{ fontSize: '0.75rem', color: currentSession.status === 'active' ? '#10b981' : 'var(--text-muted)', fontWeight: '600' }}>
                        {currentSession.user_role === 'group' ? (currentSession.group_members || 'Group Chat') : (currentSession.status === 'active' ? 'Online' : 'Offline')}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'center', color: 'var(--text-muted)', position: 'relative' }}>
                    {isChatSearchMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', padding: '4px 10px', borderRadius: '20px', border: '1px solid #3b82f6' }}>
                        <Search size={12} color="#3b82f6" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search..."
                          value={chatSearchQuery}
                          onChange={(e) => handleChatSearch(e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontSize: '0.75rem', width: '100px' }}
                        />
                        {searchResultIndices.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid var(--card-border)', paddingLeft: '8px' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{currentSearchIndex + 1}/{searchResultIndices.length}</span>
                            <ChevronUp size={14} style={{ cursor: 'pointer' }} onClick={prevSearchResult} />
                            <ChevronDown size={14} style={{ cursor: 'pointer' }} onClick={nextSearchResult} />
                          </div>
                        )}
                        <X size={14} style={{ cursor: 'pointer' }} onClick={() => { setIsChatSearchMode(false); setChatSearchQuery(''); setSearchResultIndices([]); setCurrentSearchIndex(-1); }} />
                      </div>
                    ) : (
                      <Search size={20} style={{ cursor: 'pointer' }} onClick={() => setIsChatSearchMode(true)} />
                    )}
                    <MoreVertical
                      size={20}
                      className="header-menu-trigger"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        const newVal = !showHeaderMenu;
                        if (newVal) closeAllMenus('header');
                        setShowHeaderMenu(newVal);
                      }}
                    />
                    {showHeaderMenu && (
                      <div className="header-menu-container" style={{ position: 'absolute', top: '40px', right: 0, background: 'var(--bg-card)', borderRadius: '15px', width: '200px', zIndex: 500, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        {[
                          { label: 'Export History', icon: Download, act: handleExportChat },
                          { label: activeSession.archived ? 'Unarchive Chat' : 'Archive Chat', icon: Archive, act: handleArchive },
                          {
                            label: activeSession.pin ? 'Unlock Chat' : 'Lock Chat',
                            icon: LockIcon,
                            act: async () => {
                              try {
                                if (activeSession.pin) {
                                  // Instantly unlock if they are already in the verified vault
                                  await api.put(`/chat/admin/sessions/${activeSession.session_id}/pin`, { pin: null });
                                  await fetchSessions();
                                  const res = await api.get(`/chat/admin/sessions/${activeSession.session_id}`);
                                  if (res.data && res.data.length > 0) setActiveSession(res.data[0]);
                                } else {
                                  // Instantly lock using the Master PIN
                                  const currentMasterPin = localStorage.getItem('masterPin') || '1234';
                                  await api.put(`/chat/admin/sessions/${activeSession.session_id}/pin`, { pin: currentMasterPin });
                                  await fetchSessions();
                                  setActiveSession(null);
                                }
                              } catch (err) { console.error(err); }
                            }
                          },
                          { label: 'Close Query', icon: Trash2, act: handleCloseQuery, color: '#ef4444' },
                          activeSession.user_role === 'group' ? { label: 'Delete Group', icon: Trash2, act: handleDeleteSession, color: '#ef4444' } : null
                        ].filter(Boolean).map((m, i) => (
                          <div key={i} onClick={() => { m.act(); setShowHeaderMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', cursor: 'pointer', color: m.color || '#475569', fontSize: '0.85rem', fontWeight: '700' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><m.icon size={16} /> {m.label}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </header>

                <main
                  ref={chatMainRef}
                  style={{ flex: 1, overflowY: 'auto', padding: '25px 8%', display: 'flex', flexDirection: 'column', gap: '4px' }}
                >
                  <div style={{ alignSelf: 'center', background: 'rgba(0,0,0,0.03)', padding: '5px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '15px' }}>Chat History</div>

                  {messages.map(m => {
                    if (m.message_type === 'clear_history_request') return null;
                    const isAdmin = m.sender === 'admin';
                    return (
                      <div key={m.id} style={{
                        alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        position: 'relative',
                        marginBottom: (m.reactions && m.reactions.length > 0) ? '12px' : '4px'
                      }}>
                        <div
                          ref={el => messageRefs.current[m.id] = el}
                          onMouseEnter={() => setHoveredMessage(m.id)}
                          onMouseLeave={() => setHoveredMessage(null)}
                          style={{
                            background: isAdmin ? '#3b82f6' : 'var(--bg-card)',
                            color: isAdmin ? '#fff' : 'var(--text-main)',
                            padding: '12px 16px',
                            borderRadius: isAdmin ? '20px 20px 0 20px' : '20px 20px 20px 0',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                            position: 'relative',
                            minWidth: '140px',
                            border: (isChatSearchMode && chatSearchQuery && m.message?.toLowerCase().includes(chatSearchQuery.toLowerCase())) ? '2px solid #fbbf24' : (isAdmin ? 'none' : '1px solid var(--card-border)')
                          }}
                        >
                          {m.reply_to_id && (
                            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '6px 10px', borderRadius: '8px', borderLeft: '4px solid #60a5fa', marginBottom: '8px', fontSize: '0.75rem', opacity: 0.8 }}>
                              {messages.find(x => x.id === m.reply_to_id)?.message || 'Original message deleted'}
                            </div>
                          )}
                          {m.message_type === 'image' && (
                            <div style={{ marginBottom: '8px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <img src={getMediaUrl(m.file_path)} alt="attachment" style={{ maxWidth: '100%', display: 'block', cursor: 'pointer' }} onClick={() => handleDownloadFile(m.file_path, m.message, 'image')} />
                            </div>
                          )}

                          {(m.message_type === 'doc' || (m.message_type === 'text' && m.message?.includes('[DOCUMENT:'))) && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              background: 'rgba(0,0,0,0.2)',
                              padding: '12px',
                              borderRadius: '12px',
                              marginBottom: '8px',
                              cursor: 'pointer'
                            }} onClick={() => handleDownloadFile(m.file_path, m.message, 'doc')}>
                              <div style={{ background: '#ef4444', padding: '8px', borderRadius: '8px' }}><FileText size={20} color="#fff" /></div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.message.replace('[DOCUMENT: ', '').replace(']', '')}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{m.file_path ? 'Document • Click to view' : 'Legacy Document (Text only)'}</div>
                              </div>
                              {m.file_path && <Download size={16} />}
                            </div>
                          )}

                          {(m.message_type === 'audio' || (m.message_type === 'text' && m.message?.includes('[Attachment: voice_message.webm]'))) && (
                            <div style={{ marginBottom: '8px', padding: '5px 0' }}>
                              {m.file_path ? (
                                <audio controls key={m.file_path} style={{ height: '35px', width: '220px' }}>
                                  <source src={getMediaUrl(m.file_path)} type="audio/webm" />
                                </audio>
                              ) : (
                                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '0.8rem', opacity: 0.6 }}>
                                  Legacy Voice Message (Text format)
                                </div>
                              )}
                            </div>
                          )}

                          <span style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
                            {m.sender_name && <div style={{ fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '4px', opacity: 0.8 }}>{m.sender_name}</div>}
                            {m.message_type === 'deleted' ? (
                              <span style={{ fontStyle: 'italic', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Eraser size={14} /> This message was deleted
                              </span>
                            ) : (m.message_type === 'text' && !m.message?.includes('[DOCUMENT:') && !m.message?.includes('[Attachment:')) ? (
                              isChatSearchMode && chatSearchQuery ? (
                                m.message.split(new RegExp(`(${chatSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, i) => (
                                  part.toLowerCase() === chatSearchQuery.toLowerCase() ? <mark key={i} style={{ background: '#fbbf24', color: '#000', borderRadius: '2px', padding: '0 2px' }}>{part}</mark> : part
                                ))
                              ) : m.message
                            ) : ''}
                          </span>

                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            marginTop: '8px',
                            gap: '4px'
                          }}>
                            {/* Feedback status rendering removed as per requirements */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.65rem',
                              color: isAdmin ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                              fontWeight: '700',
                              justifyContent: 'flex-end',
                              marginTop: '2px'
                            }}>
                              <span>{getTime(m.created_at)}</span>
                              {isAdmin && <Check size={12} color={isAdmin ? 'rgba(255,255,255,0.7)' : '#60a5fa'} />}
                            </div>
                          </div>

                          {/* Reactions Display */}
                          {/* Reactions display removed as per requirements */}

                          <div
                            className="msg-trigger"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMessageMenu === m.id) {
                                setOpenMessageMenu(null);
                              } else {
                                closeAllMenus('message');

                                // Check space below and above relative to the scrollable container
                                const rect = e.currentTarget.getBoundingClientRect();
                                const containerRect = chatMainRef.current?.getBoundingClientRect();

                                let spaceBelow = window.innerHeight - rect.bottom;
                                let spaceAbove = rect.top;

                                if (containerRect) {
                                  spaceBelow = containerRect.bottom - rect.bottom;
                                  spaceAbove = rect.top - containerRect.top;
                                }

                                // Improved logic: show up ONLY if space below is tight AND space above is better
                                const shouldShowUp = spaceBelow < 280 && spaceAbove > spaceBelow;
                                setMenuPosition({ ...menuPosition, direction: shouldShowUp ? 'up' : 'down', spaceBelow, spaceAbove });

                                setOpenMessageMenu(m.id);
                              }
                            }}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              cursor: 'pointer',
                              opacity: (hoveredMessage === m.id || openMessageMenu === m.id) ? 1 : 0,
                              visibility: (hoveredMessage === m.id || openMessageMenu === m.id) ? 'visible' : 'hidden',
                              transition: 'opacity 0.2s ease, visibility 0.2s',
                              padding: '6px',
                              background: 'transparent',
                              borderTopRightRadius: '18px',
                              color: isAdmin ? '#fff' : 'var(--text-muted)',
                              zIndex: 10,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <ChevronDown size={18} strokeWidth={2.5} />
                          </div>
                          {openMessageMenu === m.id && (
                            <div className="message-menu" style={{
                              position: 'absolute',
                              [menuPosition.direction === 'up' ? 'bottom' : 'top']: '100%',
                              [menuPosition.direction === 'up' ? 'marginBottom' : 'marginTop']: '4px',
                              [isAdmin ? 'right' : 'left']: '0',
                              background: 'var(--bg-card)',
                              borderRadius: '8px',
                              width: '185px',
                              zIndex: 1000,
                              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                              border: '1px solid #e2e8f0',
                              overflowY: 'auto',
                              overflowX: 'hidden',
                              maxHeight: menuPosition.direction === 'up' ? `${Math.max((menuPosition.spaceAbove || 0) - 10, 180)}px` : `${Math.max((menuPosition.spaceBelow || 0) - 10, 180)}px`,
                              animation: menuPosition.direction === 'up' ? 'slideUpMenu 0.15s cubic-bezier(0, 0, 0.2, 1)' : 'slideDownMenu 0.15s cubic-bezier(0, 0, 0.2, 1)',
                              display: 'block'
                            }}>
                              {/* Emoji Quick Bar inside menu */}
                              {/* Emoji Quick Bar removed as per requirements */}
                              {m.message_type !== 'deleted' ? [
                                { label: 'Reply', icon: Reply, act: () => setReplyingTo(m), color: '#475569' },
                                { label: 'Forward', icon: Forward, act: () => { setForwardingMessage(m); setShowForwardModal(true); }, color: '#475569' },
                                { label: 'Copy', icon: Copy, act: () => handleCopyMessage(m.message), color: '#475569' },
                                ...(isAdmin ? [
                                  { label: 'Edit', icon: Edit2, act: () => { setInput(m.message); setEditingMessage(m); }, color: '#475569' },
                                  { label: 'Delete for me', icon: Trash2, act: () => handleDeleteMessage(m.id, 'me'), color: '#ef4444' },
                                  { label: 'Delete for everyone', icon: Trash2, act: () => handleDeleteMessage(m.id, 'everyone'), color: '#ef4444' }
                                ] : [
                                  { label: 'Delete for me', icon: Trash2, act: () => handleDeleteMessage(m.id, 'me'), color: '#ef4444' }
                                ])
                              ].map((ax, idx) => (
                                <div key={idx} onClick={() => { ax.act(); setOpenMessageMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', cursor: 'pointer', color: ax.color || '#475569', fontSize: '0.82rem', fontWeight: '600', whiteSpace: 'nowrap', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><ax.icon size={14} /> <span>{ax.label}</span></div>
                              )) : [
                                { label: 'Delete for me', icon: Trash2, act: () => handleDeleteMessage(m.id, 'me'), color: '#ef4444' }
                              ].map((ax, idx) => (
                                <div key={idx} onClick={() => { ax.act(); setOpenMessageMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', cursor: 'pointer', color: ax.color || '#ef4444', fontSize: '0.82rem', fontWeight: '600', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><ax.icon size={14} /> <span>{ax.label}</span></div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </main>

                <footer style={{ padding: '12px 25px', background: 'var(--bg-card)', borderTop: '1px solid var(--card-border)', flexShrink: 0 }}>
                  {replyingTo && (
                    <div style={{ padding: '8px 12px', background: 'var(--bg-main)', borderLeft: '4px solid #3b82f6', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{replyingTo.message}</div>
                      <X size={16} onClick={() => setReplyingTo(null)} style={{ cursor: 'pointer' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative' }}>
                    {!isRecording ? (
                      <>
                        <div style={{ display: 'flex', gap: '20px', color: 'var(--text-muted)' }}>
                          <div style={{ position: 'relative' }}>
                            <Paperclip
                              size={24}
                              className="attachment-trigger"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                const newVal = !showAttachmentMenu;
                                if (newVal) closeAllMenus('attachment');
                                setShowAttachmentMenu(newVal);
                              }}
                            />
                            {showAttachmentMenu && (
                              <div className="attachment-menu-container" style={{ position: 'absolute', bottom: '40px', left: 0, background: 'var(--bg-card)', borderRadius: '12px', width: '200px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 1000, padding: '5px' }}>
                                <div onClick={() => docInputRef.current.click()} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}><FileText size={16} color="#7f66ff" /> Document</div>
                                <div onClick={() => fileInputRef.current.click()} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}><ImageIcon size={16} color="#007bfc" /> Gallery</div>
                                <input type="file" ref={docInputRef} style={{ display: 'none' }} onChange={(e) => handleSendAttachment(e.target.files[0], 'doc')} />
                                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleSendAttachment(e.target.files[0], 'image')} />
                              </div>
                            )}
                          </div>
                          <div style={{ position: 'relative' }}>
                            <Smile
                              size={24}
                              className="emoji-trigger"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                const newVal = !showEmojiPicker;
                                if (newVal) closeAllMenus('emoji');
                                setShowEmojiPicker(newVal);
                              }}
                            />
                            {showEmojiPicker && (
                              <div className="emoji-picker-container" style={{ position: 'absolute', bottom: '40px', left: 0, background: 'var(--bg-card)', borderRadius: '15px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 1000 }}>
                                {['😀', '😂', '😍', '😊', '🙏', '👍', '🔥', '❤️', '🎉', '✅'].map(em => <span key={em} onClick={() => { setInput(input + em); setShowEmojiPicker(false); }} style={{ fontSize: '1.4rem', cursor: 'pointer' }}>{em}</span>)}
                              </div>
                            )}
                          </div>
                        </div>
                        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={editingMessage ? "Edit message..." : "Type a message..."} style={{ flex: 1, background: 'var(--bg-main)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '12px 18px', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} />
                        {input.trim() ? <Send size={24} color="#3b82f6" onClick={handleSend} style={{ cursor: 'pointer' }} /> : <Mic size={24} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={startRecording} />}
                      </>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px', color: '#ef4444', fontWeight: '800' }}>
                        <div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                        <span style={{ flex: 1 }}>Recording... 0:{recordingTime < 10 ? '0' : ''}{recordingTime}</span>
                        <X size={24} style={{ cursor: 'pointer' }} onClick={() => {
                          if (mediaRecorderRef.current) mediaRecorderRef.current.shouldSave = false;
                          setIsRecording(false);
                          mediaRecorderRef.current?.stop();
                        }} />
                        <Check size={24} color="#10b981" style={{ cursor: 'pointer' }} onClick={() => {
                          if (mediaRecorderRef.current) mediaRecorderRef.current.shouldSave = true;
                          stopRecording();
                        }} />
                      </div>
                    )}
                  </div>
                </footer>
              </>
            );
          })() : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
              <div style={{ background: 'var(--glass)', padding: '50px', borderRadius: '50%', color: '#3b82f6', marginBottom: '30px', border: '1px solid var(--card-border)' }}><Inbox size={80} /></div>
              <h1 style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '10px' }}>Shnoor Console</h1>
            </div>
          )}

        </div>
      </div>

      {/* MODALS */}
      {showFilterModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header"><h3>Filter Chats</h3> <X onClick={() => setShowFilterModal(false)} style={{ cursor: 'pointer' }} /></div>
            <div className="modal-body">
              <select value={accountTypeFilter} onChange={(e) => setAccountTypeFilter(e.target.value)} style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--card-border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', outline: 'none' }}>
                {['All Users', 'Accountant', 'Client'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--card-border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setShowFilterModal(false)} style={{ padding: '10px 24px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ width: '360px', padding: '30px' }}>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              {activeSession?.pin ? (
                <>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                    <LockIcon size={30} color="#ef4444" />
                  </div>
                  <h3 style={{ marginBottom: '10px' }}>Unlock Chat</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Enter the Master PIN to view this locked conversation.</p>
                </>
              ) : (
                <>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                    <Key size={30} color="#3b82f6" />
                  </div>
                  <h3 style={{ marginBottom: '10px' }}>Lock Chat</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Enter the Master PIN to lock this conversation.</p>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px' }}>
                {[0, 1, 2, 3].map(i => (
                  <input
                    key={i}
                    type="password"
                    maxLength={1}
                    value={tempPin[i] || ''}
                    autoFocus={i === 0}
                    autoComplete="one-time-code"
                    className="pin-input"
                    onChange={(e) => {
                      const val = e.target.value;
                      const newPin = tempPin.split('');
                      newPin[i] = val;
                      setTempPin(newPin.join(''));
                      if (val && e.target.nextSibling) {
                        e.target.nextSibling.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !tempPin[i] && e.target.previousSibling) {
                        e.target.previousSibling.focus();
                      }
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowPinModal(false)} style={{ flex: 1, padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--card-border)', color: 'var(--text-main)', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSetPin} style={{ flex: 1, padding: '12px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMasterPinModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ width: '360px', padding: '30px' }}>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                <LockIcon size={30} color="#3b82f6" />
              </div>
              <h3 style={{ marginBottom: '10px' }}>Access Locked Chats</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Enter your System Master PIN to view all locked conversations.</p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px' }}>
                {[0, 1, 2, 3].map(i => (
                  <input
                    key={i}
                    type="password"
                    maxLength={1}
                    value={pinEntry[i]}
                    autoFocus={i === 0}
                    autoComplete="one-time-code"
                    className="pin-input"
                    onChange={(e) => {
                      const val = e.target.value;
                      const newPin = [...pinEntry];
                      newPin[i] = val;
                      setPinEntry(newPin);
                      if (val && e.target.nextSibling) {
                        e.target.nextSibling.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !pinEntry[i] && e.target.previousSibling) {
                        e.target.previousSibling.focus();
                      }
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setShowMasterPinModal(false); setPinEntry(['', '', '', '']); }} style={{ flex: 1, padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--card-border)', color: 'var(--text-main)', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleVerifyMasterPin} style={{ flex: 1, padding: '12px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Verify</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showChangeMasterPinModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ width: '400px', padding: '30px' }}>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                <Key size={30} color="#3b82f6" />
              </div>
              <h3 style={{ marginBottom: '10px' }}>Change System PIN</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Update the Master PIN used for locking and viewing private chats.</p>

              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>Current PIN</label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  {[0, 1, 2, 3].map(i => (
                    <input
                      key={i}
                      type="password"
                      maxLength={1}
                      value={oldMasterPinEntry[i]}
                      autoFocus={i === 0}
                      autoComplete="one-time-code"
                      className="pin-input"
                      onChange={(e) => {
                        const val = e.target.value;
                        const newPin = [...oldMasterPinEntry];
                        newPin[i] = val;
                        setOldMasterPinEntry(newPin);
                        if (val && e.target.nextSibling) e.target.nextSibling.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !oldMasterPinEntry[i] && e.target.previousSibling) {
                          e.target.previousSibling.focus();
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '25px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>New PIN</label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  {[0, 1, 2, 3].map(i => (
                    <input
                      key={i}
                      type="password"
                      maxLength={1}
                      value={newMasterPinEntry[i]}
                      autoFocus={i === 0}
                      autoComplete="one-time-code"
                      className="pin-input"
                      onChange={(e) => {
                        const val = e.target.value;
                        const newPin = [...newMasterPinEntry];
                        newPin[i] = val;
                        setNewMasterPinEntry(newPin);
                        if (val && e.target.nextSibling) e.target.nextSibling.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !newMasterPinEntry[i] && e.target.previousSibling) {
                          e.target.previousSibling.focus();
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setShowChangeMasterPinModal(false); setOldMasterPinEntry(['', '', '', '']); setNewMasterPinEntry(['', '', '', '']); }} style={{ flex: 1, padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--card-border)', color: 'var(--text-main)', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleChangeMasterPin} style={{ flex: 1, padding: '12px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Update PIN</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForwardModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header"><h3>Forward Message</h3> <X onClick={() => setShowForwardModal(false)} style={{ cursor: 'pointer' }} /></div>
            <div className="modal-body" style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px 0' }}>
              {sessions.filter(s => s.session_id !== activeSession?.session_id && s.user_name?.toLowerCase() !== 'manual test user').map(s => (
                <div key={s.session_id} onClick={() => handleForwardMessage(s.session_id)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: getProfileColor(s.session_id || s.id, s.user_name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '0.7rem' }}>{getInitials(s.user_name)}</div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)' }}>{s.user_name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.user_role}</div>
                  </div>
                </div>
              ))}
              {sessions.filter(s => s.session_id !== activeSession?.session_id && s.user_name?.toLowerCase() !== 'manual test user').length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No other active chats to forward to.</div>}
            </div>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header"><h3>Create Group Chat</h3> <X onClick={() => setShowGroupModal(false)} style={{ cursor: 'pointer' }} /></div>
            <div className="modal-body">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="E.g., Accounting Team A"
                style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--card-border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', outline: 'none', marginBottom: '20px' }}
              />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Selected Members ({selectedSessionIds.length})</div>
              <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'var(--bg-main)', borderRadius: '10px', padding: '10px', border: '1px solid var(--card-border)' }}>
                {sessions.filter(s => selectedSessionIds.includes(s.session_id)).map(s => (
                  <div key={s.session_id} style={{ padding: '6px', fontSize: '0.85rem', color: 'var(--text-main)' }}>• {s.user_name}</div>
                ))}
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--card-border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setShowGroupModal(false)} style={{ padding: '10px 24px', background: 'var(--bg-main)', border: '1px solid var(--card-border)', color: 'var(--text-main)', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateGroup} style={{ padding: '10px 24px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminChats;
