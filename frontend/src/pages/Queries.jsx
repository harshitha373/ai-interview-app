import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, User, Clock, Search, Send, Trash2, CheckCircle, Inbox, X, MoreVertical, Filter, RefreshCw, ChevronRight } from 'lucide-react';

const AdminLayout = ({ children, pageTitle }) => (
  <div className="admin-layout" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
    <header style={{ height: '72px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{pageTitle}</h1>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Admin Control Panel</div>
    </header>
    <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
  </div>
);

const Queries = () => {
  const themeStyles = `
    .query-item {
      transition: all 0.2s;
    }
    .query-item:hover {
      background: rgba(59, 130, 246, 0.04);
    }
  `;

  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchQueries = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/chat/admin/queries`);
      setQueries(res.data);
    } catch (err) {
      console.error('Error fetching queries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
    const interval = setInterval(fetchQueries, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/queries/reply`, { id: selectedQuery.id, reply: replyText });
      setQueries(queries.map(q => q.id === selectedQuery.id ? { ...q, status: 'replied' } : q));
      setSelectedQuery({ ...selectedQuery, status: 'replied' });
      alert('Reply sent successfully! (Simulation: In production, this triggers an email)');
      setReplyText('');
    } catch (err) {
      alert(`Failed to send reply: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this query?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/chat/admin/queries/${id}`);
      setQueries(queries.filter(q => q.id !== id));
      if (selectedQuery?.id === id) setSelectedQuery(null);
    } catch (err) {
      alert('Delete failed');
    }
  };

  const filteredQueries = queries.filter(q =>
    (q.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTime = (t) => {
    if (!t) return '';
    try {
      const d = new Date(t);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (err) { return ''; }
  };

  const getFullTime = (t) => {
    if (!t) return '';
    try {
      const d = new Date(t);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleString([], { dateStyle: 'long', timeStyle: 'short' });
    } catch (err) { return ''; }
  };

  return (
    <AdminLayout pageTitle="Support Queries">
      <div className="queries-container" style={{ height: '100%' }}>
        <style>{themeStyles}</style>
        <div style={{
          display: 'grid', gridTemplateColumns: '300px 1fr', height: '100%',
          background: 'var(--bg-light)', color: 'var(--text-main)', overflow: 'hidden'
        }}>

          {/* LEFT SIDEBAR - QUERY LIST */}
          <div style={{ borderRight: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-sidebar)', width: '300px', minWidth: '300px' }}>

            <header style={{ padding: '14px 15px', borderBottom: '1px solid var(--card-border)', background: 'var(--bg-sidebar)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>Inbox</h2>
              <div style={{
                background: 'var(--bg-main)', borderRadius: '6px', padding: '0 8px',
                display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--card-border)',
                height: '28px'
              }}>
                <Search size={13} color="#64748b" />
                <input
                  type="text" placeholder="Search support..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontSize: '0.7rem' }}
                />
              </div>
            </header>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredQueries.map(q => (
                <div
                  key={q.id} onClick={() => setSelectedQuery(q)}
                  className="query-item"
                  style={{
                    padding: '10px 10px', cursor: 'pointer', display: 'flex', gap: '10px',
                    borderBottom: '1px solid var(--card-border)',
                    background: selectedQuery?.id === q.id ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                    borderLeft: selectedQuery?.id === q.id ? '4px solid #3b82f6' : '4px solid transparent'
                  }}
                >
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '0.75rem',
                    background: `hsl(${q.id * 137.5 % 360}, 60%, 50%)`
                  }}>
                    {q.name?.[0]?.toUpperCase() || 'Q'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-main)' }}>{q.name}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '600' }}>{getTime(q.created_at)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.subject || q.message}</span>
                      {q.status === 'replied' && <CheckCircle size={12} color="#10b981" />}
                    </div>
                  </div>
                </div>
              ))}
              {!loading && filteredQueries.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <Inbox size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                  <p style={{ fontWeight: 600 }}>No Support Requests Found</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT AREA - QUERY DETAIL */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
            {selectedQuery ? (
              <>
                {/* Header */}
                <header style={{
                  padding: '20px 32px', background: 'var(--bg-card)',
                  borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%', background: `hsl(${selectedQuery.id * 137.5 % 360}, 60%, 50%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800'
                    }}>
                      {selectedQuery.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedQuery.name}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedQuery.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(selectedQuery.id)}
                    style={{ background: '#fee2e2', border: 'none', color: '#ef4444', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <Trash2 size={20} />
                  </button>
                </header>

                {/* Message Feed */}
                <main style={{ flex: 1, overflowY: 'auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.75rem', color: '#4f46e5', textTransform: 'uppercase' }}>Subject: {selectedQuery.subject || 'N/A'}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{getFullTime(selectedQuery.created_at)}</span>
                    </div>
                    <div style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{selectedQuery.message}</div>
                  </div>

                  {selectedQuery.status === 'replied' && (
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ background: '#ecfdf5', padding: '6px 16px', borderRadius: '100px', color: '#059669', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #d1fae5' }}>
                        RESOLVED • REPLY SENT
                      </span>
                    </div>
                  )}
                </main>

                {/* Action Footer */}
                <footer style={{ padding: '32px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Response to Candidate</label>
                    <textarea
                      value={replyText} onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Write your response to ${selectedQuery.name.split(' ')[0]}...`}
                      rows={4}
                      style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '16px', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', resize: 'none' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={handleReply} disabled={isSending || !replyText.trim()}
                        style={{
                          background: '#001B3D', color: '#fff', border: 'none',
                          padding: '12px 32px', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'
                        }}
                      >
                        {isSending ? 'Sending...' : <><Send size={18} /> Send Official Reply</>}
                      </button>
                    </div>
                  </div>
                </footer>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px' }}>
                <div style={{ width: '120px', height: '120px', background: 'var(--bg-card)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Inbox size={56} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>Support Center Inbox</h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.5 }}>Select a support request from the left panel to read the details and respond to the candidate.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Queries;
