import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import AdminChats from "./AdminChats";
import axios from "axios";
import ThemeToggle from "../components/ThemeToggle";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';
import { io } from "socket.io-client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import "./Dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const IconLive = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
);
const IconUsers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const IconChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
);
const IconAlert = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);
const IconDownload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const IconVideo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);
const IconWebcam = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="8"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 22h10"></path><path d="M12 18v4"></path></svg>
);
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const IconSchool = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
);
const IconBuilding = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path></svg>
);
const IconPause = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
);
const IconPower = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
);
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);
const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const IconMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);
const IconSearchSmall = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const IconMenu = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const IconSend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);
const IconInbox = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
);
const IconRefresh = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
);

const DownloadDropdown = ({ label, onDownloadPDF, onDownloadExcel, className, style, icon }) => (
  <div className="download-dropdown">
    <button className={className || "header-btn"} style={style} onClick={(e) => e.stopPropagation()}>
      {icon} {label}
    </button>
    <div className="download-dropdown-content">
      <div className="download-dropdown-inner">
        <button className="download-item pdf-type" onClick={(e) => { e.stopPropagation(); onDownloadPDF(); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          PDF Document
        </button>
        <button className="download-item excel-type" onClick={(e) => { e.stopPropagation(); onDownloadExcel(); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          Excel Sheet
        </button>
      </div>
    </div>
  </div>
);

const EmptyState = ({ title, message }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px' }} className="animate-fade">
    <div style={{ marginBottom: '32px', opacity: 0.8 }}>
      <svg width="280" height="200" viewBox="0 0 280 200" fill="none">
        <rect x="40" y="40" width="200" height="120" rx="20" fill="#f0f7ff" stroke="#dbeafe" strokeWidth="2" />
        <rect x="60" y="60" width="160" height="80" rx="10" fill="white" stroke="#e2e8f0" strokeWidth="2" />
        <circle cx="140" cy="85" r="20" fill="#dbeafe" />
        <path d="M110 135c0-10 10-20 30-20s30 10 30 20" stroke="#1d61d1" strokeWidth="3" strokeLinecap="round" />
        <circle cx="140" cy="30" r="12" fill="white" stroke="#1d61d1" strokeWidth="3" />
        <circle cx="140" cy="30" r="4" fill="#1d61d1" />
        <path d="M140 42v10" stroke="#1d61d1" strokeWidth="2" />
        <path d="M120 180h40" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
    <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>{title}</h3>
    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>{message}</p>
  </div>
);

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(location.pathname === "/admin/chats" ? "chats" : "live");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Password Change States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  const [usersList, setUsersList] = useState([]);
  const [reports, setReports] = useState([]);
  const [todayReports, setTodayReports] = useState([]);
  const [violations, setViolations] = useState([]);
  const [liveFeeds, setLiveFeeds] = useState([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [currentCandidateName, setCurrentCandidateName] = useState("");
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [colleges, setColleges] = useState([]);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterCollege, setFilterCollege] = useState("all");
  const [filterJobRole, setFilterJobRole] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [filterReportsStatus, setFilterReportsStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);

  // Applications / Manage Interviews States
  const [applications, setApplications] = useState([]);
  const [appFilterRole, setAppFilterRole] = useState("all");
  const [appFilterStatus, setAppFilterStatus] = useState("all");
  const [appFilterIT, setAppFilterIT] = useState("all");
  const [appSearch, setAppSearch] = useState("");

  // Support Queries States
  const [queriesList, setQueriesList] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [querySearchTerm, setQuerySearchTerm] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminChatUnreadCount, setAdminChatUnreadCount] = useState(0);
  const [experienceStats, setExperienceStats] = useState(null);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [chatFeedbackStats, setChatFeedbackStats] = useState(null);



  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month} ${day}`;
  };

  const fetchStats = async () => {
    try {
      const appRes = await axios.get(`${API_BASE}/api/admin/applications`);
      setApplications(appRes.data);

      const res = await axios.get(`${API_BASE}/api/admin/stats`);
      setUsersList(res.data.allUsers.filter(u => u.role !== 'admin').map(u => {
        const userInterviews = res.data.allInterviews.filter(i => i.user_id === u.id);
        let displayRole = 'Non-student';
        if (u.role === 'candidate-student') displayRole = 'Student';
        return {
          id: u.id, name: u.name, email: u.email,
          role: displayRole,
          collegeName: u.college_name || u.collegeName || '-',
          rollNumber: u.roll_number || u.rollNumber || '-',
          date: formatDate(u.created_at),
          count: userInterviews.length,
          lastRole: userInterviews.length > 0 ? (userInterviews[0].role || "General Resume") : "No Interview",
          lastInterviewType: userInterviews.length > 0 ? (userInterviews[0].interview_type || "Technical") : "N/A",
          lastInterviewDate: userInterviews.length > 0 ? formatDate(userInterviews[0].created_at) : "N/A",
          status: 'Registered'
        };
      }));
      const parsed = res.data.allInterviews.map(i => ({
        id: i.id,
        name: i.candidate_name,
        collegeName: i.college_name || i.collegeName || '-',
        rollNumber: i.roll_number || i.rollNumber || '-',
        score: i.score || 0,
        answered: i.answered_count || 0,
        status: i.status,
        role: i.role || "General Resume",
        userRole: i.user_role || 'candidate-non-student',
        videoUrl: i.video_url || null,
        analysisData: i.result || i.evaluation || i.analysis || "",
        createdAt: i.created_at,
        candidateEmail: i.candidate_email || i.candidate_email_address || '',
        mobile: i.mobile_count || 0,
        multiFace: i.multi_face_count || 0,
        noFace: i.no_face_count || 0,
        voice: i.voice_count || 0,
        tabSwitch: i.tab_switch_count || 0,
        cheating: i.cheating_count || 0,
        interviewType: i.interview_type || "Technical",
        finalStatus: i.final_status || "pending",
        application_id: i.application_id
      }));
      setReports(parsed);
      const today = new Date().toDateString();
      setTodayReports(parsed.filter(p => new Date(p.createdAt).toDateString() === today));
      setViolations(res.data.allInterviews.map(i => ({
        id: i.id, name: i.candidate_name,
        collegeName: i.college_name || i.collegeName || '-',
        rollNumber: i.roll_number || i.rollNumber || '-',
        userRole: i.user_role || 'candidate-non-student',
        date: formatDate(i.created_at),
        interviewType: i.interview_type || "Technical",
        mobile: i.mobile_count || 0, multiFace: i.multi_face_count || 0,
        noFace: i.no_face_count || 0, voice: i.voice_count || 0,
        tabSwitch: i.tab_switch_count || 0, cheating: i.cheating_count || 0
      })));
      setLiveFeeds(res.data.allInterviews.filter(i => i.status === 'ongoing'));
      if (res.data.stats) {
        if (res.data.stats.unreadQueries !== undefined) setUnreadCount(res.data.stats.unreadQueries);
        if (res.data.stats.unreadAdminChats !== undefined) setAdminChatUnreadCount(res.data.stats.unreadAdminChats);
        if (res.data.stats.experience) setExperienceStats(res.data.stats.experience);
      }
      if (res.data.recentFeedbacks) setRecentFeedbacks(res.data.recentFeedbacks);
      if (res.data.stats && res.data.stats.chatFeedback) setChatFeedbackStats(res.data.stats.chatFeedback);
    } catch (err) { console.error(err); }
  };

  const handleGlobalRefresh = async () => {
    setIsGlobalRefreshing(true);
    await Promise.all([
      fetchStats(),
      fetchColleges(),
      fetchQueries()
    ]);
    setTimeout(() => setIsGlobalRefreshing(false), 800);
  };

  const fetchColleges = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/colleges`);
      setColleges(res.data);
    } catch (err) { console.error(err); }
  };

  const getFilteredUsers = () => {
    return usersList.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMap = {
        'candidate-student': 'Student',
        'candidate-non-student': 'Non-student'
      };
      const targetRole = roleMap[filterRole];
      const matchesRole = filterRole === 'all' || u.role === targetRole;
      const matchesCollege = filterRole !== 'candidate-student' ||
        filterCollege === 'all' ||
        u.collegeName === filterCollege;
      return matchesSearch && matchesRole && matchesCollege;
    });
  };

  const getFilteredReports = () => {
    return reports.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.candidateEmail && r.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = filterRole === 'all' || r.userRole === filterRole;
      const matchesCollege = filterRole !== 'candidate-student' ||
        filterCollege === 'all' ||
        r.collegeName === filterCollege;
      const matchesJobRole = filterJobRole === 'all' || r.role === filterJobRole;

      // Date Range Filter logic
      let matchesDateRange = true;
      if (r.createdAt) {
        const reportDate = new Date(r.createdAt);
        reportDate.setHours(0, 0, 0, 0);

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (reportDate < start) matchesDateRange = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(0, 0, 0, 0);
          if (reportDate > end) matchesDateRange = false;
        }
      } else if (startDate || endDate) {
        matchesDateRange = false;
      }

      const rDate = r.createdAt ? formatDate(r.createdAt) : null;
      const matchesDate = filterDate === 'all' || rDate === filterDate;
      const matchesStatus = filterReportsStatus === 'all' || (r.finalStatus || 'pending') === filterReportsStatus;
      return matchesSearch && matchesRole && matchesCollege && matchesJobRole && matchesDate && matchesDateRange && matchesStatus;
    });
  };


  const getFilteredViolations = () => {
    return violations.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || v.userRole === filterRole;
      const matchesCollege = filterRole !== 'candidate-student' ||
        filterCollege === 'all' ||
        v.collegeName === filterCollege;
      return matchesSearch && matchesRole && matchesCollege;
    });
  };

  const getFilteredApplications = () => {
    return applications.filter(a => {
      const matchesSearch = (a.candidate_name || '').toLowerCase().includes(appSearch.toLowerCase()) ||
        (a.candidate_email || '').toLowerCase().includes(appSearch.toLowerCase());
      const matchesRole = appFilterRole === "all" || a.role === appFilterRole;
      const matchesStatus = appFilterStatus === "all" || a.final_status === appFilterStatus;
      const matchesIT = appFilterIT === "all" || (appFilterIT === "IT" ? a.is_it_role : !a.is_it_role);
      return matchesSearch && matchesRole && matchesStatus && matchesIT;
    });
  };

  const handleDownloadAppsPDF = () => {
    try {
      const filteredApps = getFilteredApplications();
      const doc = new jsPDF('landscape');
      doc.setFillColor(8, 20, 36);
      doc.rect(0, 0, 297, 28, 'F');
      const logoImg = new Image();
      logoImg.src = "/shnoor_logo.png";
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 4, 20, 20, 3, 3, 'F');
      doc.addImage(logoImg, 'PNG', 13, 5, 18, 18);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SHNOOR AI SYSTEMS", 40, 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text("MASTER APPLICATIONS REPORT", 40, 20);
      doc.text(`Generated: ${formatDate(new Date())}`, 280, 12, { align: 'right' });

      const head = [["Candidate", "Role", "Type", "TR Status", "TR Score", "HR Status", "HR Score", "Final Status", "Date"]];
      const body = filteredApps.map(app => {
        const isIT = app.is_it_role;
        let trStatus = 'Pending';
        if (!isIT) trStatus = 'Not Req';
        else if (app.status === 'tr_completed' || app.tr_score) trStatus = (app.tr_score >= 60 && parseInt(app.tr_violations || 0) === 0) ? 'Qualified' : 'Rejected';

        let hrStatus = 'Pending';
        if (app.status === 'hr_completed' || app.hr_score) hrStatus = (app.hr_score >= 60 && parseInt(app.hr_violations || 0) === 0) ? 'Qualified' : 'Rejected';
        else if (isIT && app.tr_score && (app.tr_score < 60 || parseInt(app.tr_violations || 0) > 0)) hrStatus = 'Locked';

        return [
          `${app.candidate_name}\n${app.candidate_email}`,
          app.role,
          isIT ? 'IT' : 'NON-IT',
          trStatus,
          (app.tr_score !== null && app.tr_score !== undefined) ? app.tr_score : '-',
          hrStatus,
          (app.hr_score !== null && app.hr_score !== undefined) ? app.hr_score : '-',
          app.final_status === 'pending' ? 'Pending' : (app.final_status === 'selected' ? 'Selected' : 'Rejected'),
          formatDate(app.created_at)
        ];
      });

      autoTable(doc, {
        startY: 35, head, body, theme: 'striped',
        headStyles: { fillColor: [0, 27, 61], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
        columnStyles: { 0: { halign: 'left' }, 1: { halign: 'left' } },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
      doc.save('Applications_Report.pdf');
    } catch (err) { console.error('Failed to generate Applications PDF', err); }
  };

  const handleDownloadAppsExcel = () => {
    try {
      const filteredApps = getFilteredApplications();
      const data = filteredApps.map(app => {
        const isIT = app.is_it_role;
        let trStatus = 'Pending';
        if (!isIT) trStatus = 'Not Required';
        else if (app.status === 'tr_completed' || app.tr_score) trStatus = (app.tr_score >= 60 && parseInt(app.tr_violations || 0) === 0) ? 'Qualified' : 'Rejected';

        let hrStatus = 'Pending';
        if (app.status === 'hr_completed' || app.hr_score) hrStatus = (app.hr_score >= 60 && parseInt(app.hr_violations || 0) === 0) ? 'Qualified' : 'Rejected';
        else if (isIT && app.tr_score && (app.tr_score < 60 || parseInt(app.tr_violations || 0) > 0)) hrStatus = 'Locked';

        return {
          "Candidate Name": app.candidate_name,
          "Candidate Email": app.candidate_email,
          "Role": app.role,
          "Role Type": isIT ? 'IT' : 'NON-IT',
          "TR Status": trStatus,
          "TR Score": (app.tr_score !== null && app.tr_score !== undefined) ? `${app.tr_score}%` : '-',
          "HR Status": hrStatus,
          "HR Score": (app.hr_score !== null && app.hr_score !== undefined) ? `${app.hr_score}%` : '-',
          "Final Status": app.final_status === 'pending' ? 'Pending' : (app.final_status === 'selected' ? 'Selected' : 'Rejected'),
          "Current Stage": app.status.replace('_', ' ').toUpperCase(),
          "Application Date": formatDate(app.created_at)
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const colWidths = Object.keys(data[0] || {}).map(key => {
        let maxLen = key.length;
        data.forEach(row => {
          const val = row[key] ? row[key].toString() : "";
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(maxLen + 4, 50) };
      });
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
      XLSX.writeFile(workbook, "Applications_Report.xlsx");
    } catch (err) { console.error('Failed to generate Applications Excel', err); }
  };

  const handleDownloadSingleAppPDF = (app) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(8, 20, 36);
      doc.rect(0, 0, 210, 28, 'F');
      const logoImg = new Image();
      logoImg.src = "/shnoor_logo.png";
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 4, 20, 20, 3, 3, 'F');
      doc.addImage(logoImg, 'PNG', 13, 5, 18, 18);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SHNOOR AI SYSTEMS", 40, 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text("INDIVIDUAL APPLICATION REPORT", 40, 20);
      doc.text(`Generated: ${formatDate(new Date())}`, 190, 12, { align: 'right' });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Candidate: ${app.candidate_name}`, 14, 40);
      doc.text(`Email: ${app.candidate_email}`, 14, 48);
      doc.text(`Role: ${app.role} (${app.is_it_role ? 'IT' : 'NON-IT'})`, 14, 56);
      doc.text(`Status: ${app.status.replace('_', ' ').toUpperCase()}`, 14, 64);
      doc.text(`Final Decision: ${app.final_status.toUpperCase()}`, 14, 72);

      const head = [["Round", "Status", "Score"]];
      const body = [
        ["Technical Round (TR)", app.is_it_role ? ((app.tr_score !== null && app.tr_score !== undefined) ? (app.tr_score >= 60 ? 'Qualified' : 'Rejected') : 'Pending') : 'Not Required', (app.tr_score !== null && app.tr_score !== undefined) ? `${app.tr_score}%` : '-'],
        ["HR Round", (app.hr_score !== null && app.hr_score !== undefined) ? (app.hr_score >= 60 ? 'Qualified' : 'Rejected') : 'Pending', (app.hr_score !== null && app.hr_score !== undefined) ? `${app.hr_score}%` : '-']
      ];

      autoTable(doc, {
        startY: 85, head, body, theme: 'striped',
        headStyles: { fillColor: [0, 27, 61], textColor: 255, fontStyle: 'bold' }
      });
      doc.save(`Application_Report_${app.candidate_name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) { console.error('Failed to generate Single PDF', err); }
  };

  const handleDeleteApplication = async (id) => {
    if (!window.confirm("Are you sure you want to completely delete this application and all of its associated interview data? This action cannot be undone.")) return;
    try {
      await axios.delete(`${API_BASE}/api/applications/${id}`);
      fetchStats();
    } catch (err) { console.error("Error deleting application", err); }
  };

  const handleDownloadMasterPDF = () => {
    try {
      const filteredReports = getFilteredReports();
      const doc = new jsPDF();
      doc.setFillColor(8, 20, 36);
      doc.rect(0, 0, 210, 28, 'F');
      const logoImg = new Image();
      logoImg.src = "/shnoor_logo.png";
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 4, 20, 20, 3, 3, 'F');
      doc.addImage(logoImg, 'PNG', 13, 5, 18, 18);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SHNOOR AI SYSTEMS", 40, 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text("MASTER INTERVIEW ANALYTICS REPORT", 40, 20);
      doc.text(`Generated: ${formatDate(new Date())}`, 196, 12, { align: 'right' });
      const head = [["ID", "Candidate", "College", "Role", "Round", "Score", "Answered", "Final Status", "Violations", "Date"]];
      const body = filteredReports.map(r => {
        const vStr = `MF:${r.multiFace || 0}, NF:${r.noFace || 0}, MB:${r.mobile || 0}, TS:${r.tabSwitch || 0}, V:${r.voice || 0}, C:${r.cheating || 0}`;
        return [
          r.id,
          r.name,
          r.collegeName,
          r.role,
          r.interviewType,
          r.score || 0,
          r.answered || 0,
          (r.finalStatus || 'pending').toString().toUpperCase(),
          vStr,
          r.createdAt ? formatDate(r.createdAt) : ''
        ];
      });
      autoTable(doc, {
        startY: 35,
        head,
        body,
        theme: 'striped',
        headStyles: { fillColor: [0, 27, 61], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2, halign: 'left' },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`Page ${i} of ${pageCount} | Confidential System Report`, 105, 287, { align: 'center' });
      }
      doc.save('Master_Report.pdf');
    } catch (err) {
      console.error('Failed to generate master PDF', err);
    }
  };

  const handleDownloadMasterExcel = () => {
    try {
      const filteredReports = getFilteredReports();
      const data = filteredReports.map(r => ({
        "ID": r.id.toString(),
        "Candidate": r.name,
        "College": r.collegeName,
        "Roll No": r.rollNumber,
        "Role": r.role,
        "Round": r.interviewType,
        "Score": (r.score || 0).toString(),
        "Answered": (r.answered || 0).toString(),
        "Final Status": (r.finalStatus || 'pending').toString().toUpperCase(),
        "Multi-Face": (r.multiFace || 0).toString(),
        "No-Face": (r.noFace || 0).toString(),
        "Mobile": (r.mobile || 0).toString(),
        "Tab-Switch": (r.tabSwitch || 0).toString(),
        "Voice": (r.voice || 0).toString(),
        "Cheating": (r.cheating || 0).toString(),
        "Date": r.createdAt ? formatDate(r.createdAt) : ''
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Auto-size columns
      const colWidths = Object.keys(data[0] || {}).map(key => {
        let maxLen = key.length;
        data.forEach(row => {
          const val = row[key] ? row[key].toString() : "";
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(maxLen + 4, 50) };
      });
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Master Report");
      XLSX.writeFile(workbook, "Master_Interview_Report.xlsx");
    } catch (err) {
      console.error('Failed to generate master Excel', err);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      if (parsedUser.role !== 'admin') navigate("/candidate");
      setUser(parsedUser);
      fetchStats();
      fetchColleges();
      const interval = setInterval(fetchStats, 5000);
      const socket = io(API_BASE);
      socket.emit("join-admins");
      socket.on("live-snapshot", (data) => {
        setLiveFeeds(prev => prev.map(feed =>
          feed.id === parseInt(data.interviewId) ? { ...feed, last_snapshot: data.image } : feed
        ));
      });
      return () => {
        clearInterval(interval);
        socket.disconnect();
      };
    } else { navigate("/login"); }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Delete this candidate?")) {
      try {
        await axios.delete(`${API_BASE}/api/admin/user/${id}`);
        setUsersList(usersList.filter(u => u.id !== id));
      } catch (err) { alert("Error deleting user."); }
    }
  };

  const handleAddCollege = async () => {
    if (!collegeSearch.trim()) return;
    try {
      const res = await axios.post(`${API_BASE}/api/colleges`, { name: collegeSearch });
      setColleges(prev => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setCollegeSearch("");
    } catch (err) { alert(err.response?.data?.message || "Failed to add college"); }
  };

  const handleToggleCollege = async (id) => {
    try {
      const res = await axios.put(`${API_BASE}/api/colleges/${id}/toggle`);
      setColleges(prev => prev.map(c => c.id === id ? res.data : c));
    } catch (err) { alert("Failed to toggle college status"); }
  };

  const handleDeleteCollege = async (id) => {
    if (window.confirm("Are you sure you want to delete this college?")) {
      try {
        await axios.delete(`${API_BASE}/api/colleges/${id}`);
        setColleges(prev => prev.filter(c => c.id !== id));
      } catch (err) { alert("Failed to delete college"); }
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPwdError("New password must be at least 8 characters.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/api/change-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPwdSuccess(res.data.message || "Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwdError(err.response?.data?.message || "Failed to update password.");
    }
  };

  const fetchQueries = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/chat/admin/queries`);
      setQueriesList(res.data);
    } catch (err) { console.error("Error fetching queries:", err); }
  };

  const handleReplyToQuery = async () => {
    if (!replyText.trim()) return;
    setIsSendingReply(true);
    try {
      await axios.post(`${API_BASE}/api/admin/queries/reply`, { id: selectedQuery.id, reply: replyText });
      setQueriesList(prev => prev.map(q => q.id === selectedQuery.id ? { ...q, status: 'replied' } : q));
      setSelectedQuery(prev => ({ ...prev, status: 'replied' }));
      setUnreadCount(prev => Math.max(0, prev - 1));
      alert("Reply sent successfully!");
      setReplyText("");
    } catch (err) { alert("Failed to send reply."); }
    finally { setIsSendingReply(false); }
  };

  const handleDeleteQuery = async (id) => {
    if (window.confirm("Delete this support query?")) {
      const qToDelete = queriesList.find(q => q.id === id);
      const wasPending = qToDelete && qToDelete.status === 'pending';
      try {
        await axios.delete(`${API_BASE}/api/chat/admin/queries/${id}`);
        setQueriesList(prev => prev.filter(q => q.id !== id));
        if (wasPending) setUnreadCount(prev => Math.max(0, prev - 1));
        if (selectedQuery?.id === id) setSelectedQuery(null);
      } catch (err) { alert("Failed to delete query."); }
    }
  };

  const getFilteredQueries = () => {
    return queriesList.filter(q =>
      (q.name || '').toLowerCase().includes(querySearchTerm.toLowerCase()) ||
      (q.email || '').toLowerCase().includes(querySearchTerm.toLowerCase()) ||
      (q.subject || '').toLowerCase().includes(querySearchTerm.toLowerCase()) ||
      (q.message || '').toLowerCase().includes(querySearchTerm.toLowerCase())
    );
  };

  const handleDownloadUsersPDF = () => {
    try {
      const filteredUsers = getFilteredUsers();
      const doc = new jsPDF();
      doc.setFillColor(8, 20, 36);
      doc.rect(0, 0, 210, 28, 'F');
      const logoImg = new Image();
      logoImg.src = "/shnoor_logo.png";
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 4, 20, 20, 3, 3, 'F');
      doc.addImage(logoImg, 'PNG', 13, 5, 18, 18);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SHNOOR AI SYSTEMS", 40, 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text("CANDIDATE DIRECTORY REPORT", 40, 20);
      doc.text(`Generated: ${formatDate(new Date())}`, 196, 12, { align: 'right' });
      const head = [["ID", "Name", "Email", "College", "Roll No", "Last Target Role", "Last Round", "Last Int. Date", "Interviews"]];
      const body = filteredUsers.map(u => [u.id, u.name, u.email, u.collegeName, u.rollNumber, u.lastRole, u.lastInterviewType, u.lastInterviewDate, u.count]);
      autoTable(doc, {
        startY: 35, head, body, theme: 'striped',
        headStyles: { fillColor: [0, 27, 61], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3, halign: 'left' },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
      doc.save('Candidate_Directory.pdf');
    } catch (err) { console.error('Failed to generate PDF', err); }
  };

  const handleDownloadUsersExcel = () => {
    try {
      const filteredUsers = getFilteredUsers();
      const data = filteredUsers.map(u => ({
        "ID": u.id.toString(),
        "Name": u.name,
        "Email": u.email,
        "User Type": u.role,
        "College": u.collegeName,
        "Roll No": u.rollNumber,
        "Last Target Role": u.lastRole,
        "Last Round Type": u.lastInterviewType,
        "Last Interview Date": u.lastInterviewDate,
        "Registered Date": u.date,
        "Interviews Count": u.count.toString()
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Auto-size columns
      const colWidths = Object.keys(data[0] || {}).map(key => {
        let maxLen = key.length;
        data.forEach(row => {
          const val = row[key] ? row[key].toString() : "";
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(maxLen + 4, 50) };
      });
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
      XLSX.writeFile(workbook, "Candidate_Directory.xlsx");
    } catch (err) { console.error('Failed to generate Excel', err); }
  };

  const handleDownloadViolationsPDF = () => {
    try {
      const filteredViolations = getFilteredViolations();
      const doc = new jsPDF();
      doc.setFillColor(8, 20, 36);
      doc.rect(0, 0, 210, 28, 'F');
      const logoImg = new Image();
      logoImg.src = "/shnoor_logo.png";
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 4, 20, 20, 3, 3, 'F');
      doc.addImage(logoImg, 'PNG', 13, 5, 18, 18);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SHNOOR AI SYSTEMS", 40, 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text("PROCTORING VIOLATIONS REPORT", 40, 20);
      doc.text(`Generated: ${formatDate(new Date())}`, 196, 12, { align: 'right' });
      const head = [["Candidate Name", "Date", "Round", "Mobile", "Multi-Face", "No Face", "Voice", "Tab Switch", "Cheating"]];
      const body = filteredViolations.map(v => [v.name, v.date, v.interviewType, v.mobile.toString(), v.multiFace.toString(), v.noFace.toString(), v.voice.toString(), v.tabSwitch.toString(), v.cheating.toString()]);
      autoTable(doc, {
        startY: 35, head, body, theme: 'striped',
        headStyles: { fillColor: [0, 27, 61], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
        columnStyles: { 0: { halign: 'left' }, 1: { halign: 'left' } },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
      doc.save('Violations_Report.pdf');
    } catch (err) { console.error('Failed to generate PDF', err); }
  };

  const handleDownloadViolationsExcel = () => {
    try {
      const filteredViolations = getFilteredViolations();
      const data = filteredViolations.map(v => ({
        "Candidate Name": v.name,
        "College": v.collegeName,
        "Roll No": v.rollNumber,
        "Date": v.date,
        "Round": v.interviewType,
        "Mobile": v.mobile.toString(),
        "Multi-Face": v.multiFace.toString(),
        "No Face": v.noFace.toString(),
        "Voice": v.voice.toString(),
        "Tab Switch": v.tabSwitch.toString(),
        "Cheating": v.cheating.toString()
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Auto-size columns
      const colWidths = Object.keys(data[0] || {}).map(key => {
        let maxLen = key.length;
        data.forEach(row => {
          const val = row[key] ? row[key].toString() : "";
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(maxLen + 4, 50) };
      });
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Violations");
      XLSX.writeFile(workbook, "Violations_Report.xlsx");
    } catch (err) { console.error('Failed to generate Excel', err); }
  };

  const handleDownloadSinglePDF = (report) => {
    const doc = new jsPDF();

    // Header styling
    doc.setFillColor(0, 27, 61);
    doc.rect(0, 0, 210, 28, 'F');

    // Logo inclusion
    const logoImg = new Image();
    logoImg.src = "/shnoor_logo.png";
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, 4, 20, 20, 4, 4, 'F');
    doc.addImage(logoImg, 'PNG', 14, 6, 16, 16);

    // Header text next to logo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("EVALUATION REPORT", 40, 14);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("SHNOOR AI SYSTEMS • TECHNICAL ASSESSMENT PORTAL", 40, 20);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 40, 24);

    // Candidate Info Table
    autoTable(doc, {
      startY: 38,
      head: [["CANDIDATE PROFILE", "INFORMATION"]],
      body: [
        ["Full Name", report.name],
        ["Assessed Role", report.role],
        ["Round Type", report.interviewType],
        ["Interview Date", report.createdAt ? formatDate(report.createdAt) : '-'],
        ["Final Score", `${report.score} / 40`],
        ["Interview Status", report.status.toUpperCase()],
        ["Final Selection Status", (report.finalStatus || 'PENDING').toUpperCase()]
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 86, 210], fontSize: 10, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
    });

    // Proctoring Summary Section
    doc.setTextColor(0, 27, 61);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PROCTORING & SECURITY SUMMARY", 15, doc.lastAutoTable.finalY + 12);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [["SECURITY ALERT TYPE", "COUNT", "LEVEL"]],
      body: [
        ["Multiple Faces Detected", report.multiFace || 0, (report.multiFace || 0) > 2 ? "HIGH" : (report.multiFace || 0) > 0 ? "LOW" : "NONE"],
        ["No Face Detected", report.noFace || 0, (report.noFace || 0) > 5 ? "HIGH" : (report.noFace || 0) > 0 ? "LOW" : "NONE"],
        ["Mobile Device Detected", report.mobile || 0, (report.mobile || 0) > 0 ? "CRITICAL" : "NONE"],
        ["Tab Switching Events", report.tabSwitch || 0, (report.tabSwitch || 0) > 3 ? "HIGH" : (report.tabSwitch || 0) > 0 ? "LOW" : "NONE"],
        ["Voice / Noise Alerts", report.voice || 0, (report.voice || 0) > 5 ? "MEDIUM" : (report.voice || 0) > 0 ? "LOW" : "NONE"],
        ["Cheating Probability", report.cheating || 0, (report.cheating || 0) > 0 ? "CRITICAL" : "NONE"]
      ],
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 9, fontStyle: 'bold', halign: 'left' },
      bodyStyles: { fontSize: 8, cellPadding: 3, halign: 'left' },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'center', fontStyle: 'bold' }
      },
      didParseCell: function (data) {
        if (data.section === 'head' && data.column.index > 0) {
          data.cell.styles.halign = 'center';
        }
      }
    });

    // Technical Judgement Section
    let finalY = doc.lastAutoTable.finalY + 15;

    doc.setTextColor(0, 27, 61);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TECHNICAL ASSESSMENT & JUDGEMENT", 15, finalY);

    finalY += 10;
    let cleanAnalysis = (report.analysisData || "No detailed technical analysis recorded.")
      .replace(/<total_score>/g, '')
      .replace(/\*\*/g, '').replace(/###/g, '').replace(/#{1,6}\s?/g, '').replace(/^-\s/gm, '').trim();

    // Add gaps between sections
    let formattedText = cleanAnalysis
      .replace(/Strengths:/g, 'Strengths:')
      .replace(/Weaknesses:/g, '\n\nWeaknesses:')
      .replace(/Verdict:/g, '\n\nVerdict:')
      .replace(/Score:/g, '\n\nScore:')
      .trim();

    // Render analysis using autoTable for clean professional wrapping
    autoTable(doc, {
      startY: finalY,
      body: [[formattedText]],
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 0,
        halign: 'left',
        textColor: [51, 65, 85],
        lineHeight: 1.5
      },
      margin: { left: 15, right: 15 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount} - Private & Confidential evaluation by Shnoor AI Systems`, 15, 285);
    }

    doc.save(`Evaluation_${report.name.replace(/\s+/g, '_')}_Technical_Report.pdf`);
  };

  const handleDownloadSingleExcel = (report) => {
    try {
      const data = [
        { "Section": "CANDIDATE PROFILE", "Value": "" },
        { "Section": "Full Name", "Value": report.name },
        { "Section": "Assessed Role", "Value": report.role },
        { "Section": "Round Type", "Value": report.interviewType },
        { "Section": "Interview Date", "Value": report.createdAt ? formatDate(report.createdAt) : '-' },
        { "Section": "Final Score", "Value": `${report.score} / 40` },
        { "Section": "Status", "Value": report.status.toUpperCase() },
        { "Section": "", "Value": "" },
        { "Section": "PROCTORING SUMMARY", "Value": "" },
        { "Section": "Multi-Face Detection", "Value": (report.multiFace || 0).toString() },
        { "Section": "No-Face Detection", "Value": (report.noFace || 0).toString() },
        { "Section": "Mobile Detection", "Value": (report.mobile || 0).toString() },
        { "Section": "Tab-Switching", "Value": (report.tabSwitch || 0).toString() },
        { "Section": "Voice/Noise alerts", "Value": (report.voice || 0).toString() },
        { "Section": "Cheating Probability", "Value": (report.cheating || 0).toString() },
        { "Section": "", "Value": "" },
        { "Section": "TECHNICAL ASSESSMENT", "Value": "" },
        { "Section": "Analysis", "Value": report.analysisData || "No detailed technical analysis recorded." }
      ];
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Set column widths for report style
      worksheet['!cols'] = [
        { wch: 25 }, // Section name
        { wch: 80 }  // Value (especially analysis)
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Evaluation Report");
      XLSX.writeFile(workbook, `Evaluation_${report.name.replace(/\s+/g, '_')}.xlsx`);
    } catch (err) { console.error('Failed to generate Excel', err); }
  };

  const COLORS = ['#10b981', '#1d61d1', '#f59e0b', '#ef4444', '#8b5cf6'];
  const currentFilteredReports = getFilteredReports();
  const violationSummary = [
    { name: 'No Face', value: currentFilteredReports.reduce((s, v) => s + (v.noFace || 0), 0) },
    { name: 'Mobile', value: currentFilteredReports.reduce((s, v) => s + (v.mobile || 0), 0) },
    { name: 'Tab Switch', value: currentFilteredReports.reduce((s, v) => s + (v.tabSwitch || 0), 0) },
    { name: 'Voice', value: currentFilteredReports.reduce((s, v) => s + (v.voice || 0), 0) },
    { name: 'Cheating', value: currentFilteredReports.reduce((s, v) => s + (v.cheating || 0), 0) }
  ].filter(v => v.value > 0);


  const uniqueJobRoles = Array.from(new Set(reports.map(r => r.role))).filter(Boolean);
  const uniqueDates = Array.from(new Set(reports.map(r => r.createdAt ? formatDate(r.createdAt) : null))).filter(Boolean).sort((a, b) => new Date(b) - new Date(a));

  if (!user) return null;

  return (
    <div className="dashboard-container">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1500, backdropFilter: 'blur(2px)' }} 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="global-logo-container" style={{ width: '42px', height: '42px' }}>
            <img src="/shnoor_logo.png" alt="Shnoor" className="sidebar-logo" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
          </div>
          <div className="sidebar-brand">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Shnoor AI</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Admin Portal</p>
          </div>
        </div>
        <nav className="sidebar-menu">
          <button className={`sidebar-tab ${activeTab === 'live' ? 'active' : ''}`} onClick={() => { setActiveTab('live'); setIsSidebarOpen(false); }}>
            <IconLive /> <span>Live Proctoring</span>
          </button>
          <button className={`sidebar-tab ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => { setActiveTab('manage'); fetchStats(); setIsSidebarOpen(false); }}>
            <IconUser /> <span>Manage Interviews</span>
          </button>
          <button className={`sidebar-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); fetchStats(); setIsSidebarOpen(false); }}>
            <IconUsers /> <span>User Management</span>
          </button>
          <button className={`sidebar-tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => { setActiveTab('reports'); fetchStats(); setIsSidebarOpen(false); }}>
            <IconChart /> <span>Reports</span>
          </button>
          <button className={`sidebar-tab ${activeTab === 'violations' ? 'active' : ''}`} onClick={() => { setActiveTab('violations'); fetchStats(); setIsSidebarOpen(false); }}>
            <IconAlert /> <span>Violations</span>
          </button>
          <button className={`sidebar-tab ${activeTab === 'colleges' ? 'active' : ''}`} onClick={() => { setActiveTab('colleges'); fetchColleges(); setIsSidebarOpen(false); }}>
            <IconSchool /> <span>Manage Colleges</span>
          </button>
          <button className={`sidebar-tab ${activeTab === 'queries' ? 'active' : ''}`} onClick={() => { setActiveTab('queries'); fetchQueries(); setIsSidebarOpen(false); }}>
            <IconMail />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Support Queries</span>
              {unreadCount > 0 && (
                <span style={{
                  background: '#EF4444',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 8px',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
          </button>
          <button className={`sidebar-tab ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => { setActiveTab('chats'); setIsSidebarOpen(false); }}>
            <IconMail />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Admin Chats</span>
              {adminChatUnreadCount > 0 && (
                <span style={{
                  background: '#EF4444',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 8px',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {adminChatUnreadCount}
                </span>
              )}
            </div>
          </button>
        </nav>
      </aside>

      <main className="dash-main-wrapper">
        <header className="dash-header-top">
          <div className="header-brand-mobile-container">
            <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(true)}>
              <IconMenu />
            </button>
            <div className="user-welcome">
              <h1>Hello, Admin! 👋</h1>
              <p>System Overview & Control Center</p>
            </div>
          </div>
          <div className="header-actions">
            <ThemeToggle />

            <button className={`header-btn ${activeTab === 'profile' ? 'profile-active' : ''}`} onClick={() => setActiveTab('profile')}>
              <IconUser /> <span>My Profile</span>
            </button>
            <button className="header-btn logout" onClick={handleLogout}><IconLogout /> <span>Logout</span></button>
          </div>
        </header>

        <div className="dash-content-area" style={{ marginTop: '72px' }}>
          {activeTab === 'live' && (
            <div className="animate-fade">
              <div className="dash-overview-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <IconWebcam />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Live Proctoring</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Monitoring active candidate cameras during live sessions.</p>
                  </div>
                </div>
                {liveFeeds.length > 0 ? (
                  <div className="proctor-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    {liveFeeds.map(feed => (
                      <div className="live-feed-box" key={feed.id}>
                        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                          {feed.last_snapshot ? <img src={feed.last_snapshot} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> :
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', opacity: 0.5 }}>INITIALIZING...</div>
                          }
                          <div className="status-badge" style={{ position: 'absolute', top: 12, left: 12, background: '#ef4444', color: 'white' }}>LIVE</div>
                        </div>
                        <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{feed.candidate_name}</span>
                          <span className="status-badge status-completed">{feed.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState title="No active interviews." message="Active sessions will appear here." />}
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="animate-fade">
              <div className="dash-overview-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 'max-content' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                      <IconUser />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Manage Interviews</h2>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }}>Track end-to-end applicant stages and decisions.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                    <select className="form-select" style={{ width: '110px', background: 'var(--bg-main)', fontSize: '0.75rem', padding: '6px 24px 6px 10px', height: '34px' }} value={appFilterIT} onChange={(e) => setAppFilterIT(e.target.value)}>
                      <option value="all">All Types</option>
                      <option value="IT">IT Role</option>
                      <option value="NON-IT">NON-IT</option>
                    </select>
                    <select className="form-select" style={{ width: '125px', background: 'var(--bg-main)', fontSize: '0.75rem', padding: '6px 24px 6px 10px', height: '34px' }} value={appFilterRole} onChange={(e) => setAppFilterRole(e.target.value)}>
                      <option value="all">All Roles</option>
                      {Array.from(new Set(applications.map(a => a.role))).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select className="form-select" style={{ width: '125px', background: 'var(--bg-main)', fontSize: '0.75rem', padding: '6px 24px 6px 10px', height: '34px' }} value={appFilterStatus} onChange={(e) => setAppFilterStatus(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="selected">Selected</option>
                      <option value="rejected">Rejected</option>
                      <option value="pending">Pending</option>
                    </select>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <IconSearch size={14} />
                      </div>
                      <input
                        type="text"
                        placeholder="Search..."
                        className="form-select"
                        style={{ paddingLeft: '30px', width: '140px', background: 'var(--bg-main)', fontSize: '0.75rem', height: '34px' }}
                        value={appSearch}
                        onChange={(e) => setAppSearch(e.target.value)}
                      />
                    </div>
                    <DownloadDropdown
                      label="Export"
                      onDownloadPDF={handleDownloadAppsPDF}
                      onDownloadExcel={handleDownloadAppsExcel}
                      icon={<IconDownload size={14} />}
                      style={{ background: 'var(--primary)', color: 'white', padding: '8px 14px', fontSize: '0.75rem', height: '34px', display: 'flex', alignItems: 'center' }}
                    />
                  </div>
                </div>

                {getFilteredApplications().length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: '1200px', borderCollapse: 'separate', borderSpacing: '0' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '5%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.65rem', textAlign: 'center', padding: '12px 8px' }}>APP ID</th>
                          <th style={{ width: '18%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.65rem', textAlign: 'left', padding: '12px 8px' }}>CANDIDATE</th>
                          <th style={{ width: '15%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.65rem', textAlign: 'left', padding: '12px 8px' }}>ROLE</th>
                          <th style={{ width: '6%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.65rem', textAlign: 'center', padding: '12px 8px' }}>TYPE</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.65rem', textAlign: 'center', padding: '12px 8px' }}>TR STATUS</th>
                          <th style={{ width: '7%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.65rem', textAlign: 'center', padding: '12px 8px' }}>TR SCORE</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.65rem', textAlign: 'center', padding: '12px 8px' }}>HR STATUS</th>
                          <th style={{ width: '7%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.65rem', textAlign: 'center', padding: '12px 8px' }}>HR SCORE</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.65rem', textAlign: 'center', padding: '12px 8px' }}>FINAL STATUS</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.65rem', textAlign: 'left', padding: '12px 8px' }}>STAGE</th>
                          <th style={{ width: '6%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.65rem', textAlign: 'center', padding: '12px 8px' }}>DATE</th>
                          <th style={{ width: '9%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.65rem', textAlign: 'center', padding: '12px 8px' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredApplications().map(app => {
                          const isIT = app.is_it_role;
                          let trStatus = 'Pending';
                          if (!isIT) trStatus = 'Not Required';
                          else if (app.status === 'tr_completed' || app.tr_score) {
                            trStatus = (app.tr_score >= 60 && parseInt(app.tr_violations || 0) === 0) ? 'Qualified' : 'Rejected';
                          }

                          let hrStatus = 'Pending';
                          if (app.status === 'hr_completed' || app.hr_score) {
                            hrStatus = (app.hr_score >= 60 && parseInt(app.hr_violations || 0) === 0) ? 'Qualified' : 'Rejected';
                          } else if (isIT && app.tr_score && (app.tr_score < 60 || parseInt(app.tr_violations || 0) > 0)) {
                            hrStatus = 'Locked';
                          }

                          const renderStatusBadge = (status) => {
                            let color = '#F59E0B'; let bg = '#FFFBEB';
                            if (status === 'Qualified' || status === 'Selected') { color = '#10B981'; bg = '#D1FAE5'; }
                            else if (status === 'Rejected') { color = '#EF4444'; bg = '#FEE2E2'; }
                            else if (status === 'Not Required' || status === 'Locked') { color = '#6B7280'; bg = '#F3F4F6'; }
                            return <span style={{ color, background: bg, padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>{status.toUpperCase()}</span>;
                          };

                          return (
                            <tr key={app.id}>
                              <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.75rem', color: 'var(--primary)' }}>#{app.id}</td>
                              <td style={{ padding: '10px 8px', textAlign: 'left', overflow: 'hidden' }}>
                                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.candidate_name}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.candidate_email}</div>
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 'bold', fontSize: '0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={app.role}>{app.role}</td>
                              <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.7rem' }}>{isIT ? 'IT' : 'NON-IT'}</td>
                              <td style={{ padding: '10px 8px', textAlign: 'center' }}>{renderStatusBadge(trStatus)}</td>
                              <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>{(app.tr_score !== null && app.tr_score !== undefined) ? `${app.tr_score}%` : '-'}</td>
                              <td style={{ padding: '10px 8px', textAlign: 'center' }}>{renderStatusBadge(hrStatus)}</td>
                              <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>{(app.hr_score !== null && app.hr_score !== undefined) ? `${app.hr_score}%` : '-'}</td>
                              <td style={{ padding: '10px 8px', textAlign: 'center' }}>{renderStatusBadge(app.final_status === 'pending' ? 'Pending' : (app.final_status === 'selected' ? 'Selected' : 'Rejected'))}</td>
                              <td style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.7rem', color: '#475569', fontWeight: 'bold' }}>{app.status.replace('_', ' ').toUpperCase()}</td>
                              <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(app.created_at)}</td>
                              <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                                  <button onClick={() => handleDownloadSingleAppPDF(app)} style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', color: '#16A34A', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }} title="Download PDF Report"><IconDownload /> PDF</button>
                                  <button onClick={() => handleDeleteApplication(app.id)} style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#DC2626', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Application"><IconTrash /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <EmptyState title="No applications found." message="Try adjusting your filters or search term." />}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="animate-fade">
              <div className="dash-overview-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 'max-content' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                      <IconUsers />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Candidate Directory</h2>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }}>Filter, search, and manage candidate registration records.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                    <select className="form-select" style={{ width: '120px', background: 'var(--bg-main)', fontSize: '0.75rem', padding: '6px 24px 6px 10px', height: '34px' }} value={filterRole} onChange={(e) => { setFilterRole(e.target.value); if (e.target.value !== 'candidate-student') setFilterCollege('all'); }}>
                      <option value="all">All Users</option>
                      <option value="candidate-student">Student</option>
                      <option value="candidate-non-student">Non-Student</option>
                    </select>
                    {filterRole === 'candidate-student' && (
                      <select className="form-select" style={{ width: '140px', background: 'var(--bg-main)', fontSize: '0.75rem', padding: '6px 24px 6px 10px', height: '34px' }} value={filterCollege} onChange={(e) => setFilterCollege(e.target.value)}>
                        <option value="all">All Colleges</option>
                        {colleges.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    )}
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <IconSearch size={14} />
                      </div>
                      <input
                        type="text"
                        placeholder="Search..."
                        className="form-select"
                        style={{ paddingLeft: '30px', width: '140px', background: 'var(--bg-main)', fontSize: '0.75rem', height: '34px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <DownloadDropdown
                      label="Export"
                      onDownloadPDF={handleDownloadUsersPDF}
                      onDownloadExcel={handleDownloadUsersExcel}
                      icon={<IconDownload size={14} />}
                      style={{ background: 'var(--primary)', color: 'white', padding: '8px 14px', fontSize: '0.75rem', height: '34px', display: 'flex', alignItems: 'center' }}
                    />
                  </div>
                </div>

                {usersList.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: '1200px', borderCollapse: 'separate', borderSpacing: '0' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '18%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.05em', textAlign: 'left', padding: '12px 8px' }}>CANDIDATE</th>
                          <th style={{ width: '10%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.05em', textAlign: 'left', padding: '12px 8px' }}>ROLE</th>
                          <th style={{ width: '14%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.05em', textAlign: 'left', padding: '12px 8px' }}>COLLEGE / INSTITUTION</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.05em', textAlign: 'left', padding: '12px 8px' }}>ROLL NO</th>
                          <th style={{ width: '13%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.05em', textAlign: 'left', padding: '12px 8px' }}>LAST TARGET ROLE</th>
                          <th style={{ width: '6%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.05em', textAlign: 'center', padding: '12px 8px' }}>ROUND</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.05em', textAlign: 'center', padding: '12px 8px' }}>LATEST INT.</th>
                          <th style={{ width: '10%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.05em', textAlign: 'left', padding: '12px 8px' }}>REGISTERED</th>
                          <th style={{ width: '5%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.05em', textAlign: 'center', padding: '12px 8px' }}>IC</th>
                          <th style={{ width: '12%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.05em', textAlign: 'center', padding: '12px 8px' }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredUsers().map(u => {
                          const initials = (u.name || 'User').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                          const isStudent = u.role === 'Student';
                          const isActive = u.status !== 'Suspended';
                          return (
                            <tr key={u.id}>
                              <td style={{ padding: '10px 8px', textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>
                                    {initials}
                                  </div>
                                  <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ textAlign: 'left', padding: '10px 8px' }}>
                                <span className={`status-badge ${isStudent ? 'status-completed' : 'status-pending'}`} style={{ borderRadius: '6px', padding: '2px 6px', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                                  {isStudent ? 'STUDENT' : 'NON-STU'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'left', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '10px 8px' }}>{u.collegeName}</td>
                              <td style={{ textAlign: 'left', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.75rem', padding: '10px 8px' }}>{u.rollNumber}</td>
                              <td style={{ textAlign: 'left', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '10px 8px' }} title={u.lastRole}>{u.lastRole}</td>
                              <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                                <span style={{
                                  fontSize: '0.55rem',
                                  fontWeight: 800,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: u.lastInterviewType === 'HR' ? '#FDF4FF' : '#F0F7FF',
                                  color: u.lastInterviewType === 'HR' ? '#701A75' : '#1D4ED8',
                                  border: `1px solid ${u.lastInterviewType === 'HR' ? '#F5D0FE' : '#DBEAFE'}`
                                }}>
                                  {u.lastInterviewType}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem', padding: '10px 8px' }}>{u.lastInterviewDate}</td>
                              <td style={{ textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', padding: '10px 8px' }}>{u.date}</td>
                              <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.75rem', padding: '10px 8px' }}>{u.count}</td>
                              <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                                <button
                                  style={{
                                    background: '#FFF1F1',
                                    color: '#F87171',
                                    border: '1px solid #FEE2E2',
                                    padding: '4px 8px',
                                    fontSize: '0.65rem',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    margin: '0 auto',
                                    whiteSpace: 'nowrap',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleDeleteUser(u.id)}
                                >
                                  <IconTrash /> Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <EmptyState title="No candidates yet." message="Sign-ups will appear here." />}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="animate-fade">
              <div className="dash-overview-card" style={{ padding: '32px' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                      <IconChart />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Evaluation Reports</h2>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }}>Review candidate performance.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select className="form-select" style={{ width: '120px', background: 'var(--bg-main)', fontSize: '0.75rem', padding: '6px 24px 6px 10px', height: '34px' }} value={filterRole} onChange={(e) => { setFilterRole(e.target.value); if (e.target.value !== 'candidate-student') setFilterCollege('all'); }}>
                      <option value="all">All Users</option>
                      <option value="candidate-student">Student</option>
                      <option value="candidate-non-student">Non-Student</option>
                    </select>
                    {filterRole === 'candidate-student' && (
                      <select className="form-select" style={{ width: '140px', background: 'var(--bg-main)', fontSize: '0.75rem', padding: '6px 24px 6px 10px', height: '34px' }} value={filterCollege} onChange={(e) => setFilterCollege(e.target.value)}>
                        <option value="all">All Colleges</option>
                        {colleges.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    )}
                    <select className="form-select" style={{ width: '125px', background: 'var(--bg-main)', fontSize: '0.75rem', padding: '6px 24px 6px 10px', height: '34px' }} value={filterJobRole} onChange={(e) => setFilterJobRole(e.target.value)}>
                      <option value="all">All Roles</option>
                      {uniqueJobRoles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select className="form-select" style={{ width: '125px', background: 'var(--bg-main)', fontSize: '0.75rem', padding: '6px 24px 6px 10px', height: '34px' }} value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
                      <option value="all">All Dates</option>
                      {uniqueDates.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <IconSearch size={14} />
                      </div>
                      <input
                        type="text"
                        placeholder="Search..."
                        className="form-select"
                        style={{ paddingLeft: '30px', width: '140px', background: 'var(--bg-main)', fontSize: '0.75rem', height: '34px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <DownloadDropdown
                      label="Export"
                      onDownloadPDF={handleDownloadMasterPDF}
                      onDownloadExcel={handleDownloadMasterExcel}
                      icon={<IconDownload size={14} />}
                      style={{ background: 'var(--primary)', color: 'white', padding: '8px 14px', fontSize: '0.75rem', height: '34px', display: 'flex', alignItems: 'center' }}
                    />
                  </div>
                </div>

                {/* Experience & Feedback Summary Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                  <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)', padding: '20px', borderRadius: '18px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '4px', fontWeight: 'bold' }}>AVG. SATISFACTION</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{experienceStats?.avgRating || 0}</div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>/ 5.0</div>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', color: '#fbbf24', fontSize: '0.9rem', marginTop: '4px' }}>
                      {'★'.repeat(Math.round(experienceStats?.avgRating || 0))}{'☆'.repeat(5 - Math.round(experienceStats?.avgRating || 0))}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F0FDF4', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconCheck />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>TOP RATING</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{Math.round(((experienceStats?.distribution?.[0]?.count || 0) + (experienceStats?.distribution?.[1]?.count || 0)) / (experienceStats?.totalFeedback || 1) * 100)}%</div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FDF4FF', color: '#A855F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconUsers />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>TOTAL FEEDBACK</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{experienceStats?.totalFeedback || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="reports-charts-grid" style={{ marginBottom: '32px' }}>
                  <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px', textAlign: 'center', letterSpacing: '0.05em' }}>CANDIDATE SCORES</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={currentFilteredReports.slice(0, 8).map(r => ({ name: r.name.split(' ')[0], score: r.score }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 40]} fontSize={9} axisLine={false} tickLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'var(--bg-disabled)' }} 
                          contentStyle={{ 
                            background: 'var(--bg-card)', 
                            color: 'var(--text-main)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }} 
                        />
                        <Bar dataKey="score" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px', textAlign: 'center', letterSpacing: '0.05em' }}>VIOLATIONS</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px' }}>
                      {violationSummary.length > 0 ? (
                        <>
                          <ResponsiveContainer width="50%" height="100%">
                            <PieChart>
                              <Pie data={violationSummary} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={4} dataKey="value" stroke="none">
                                {violationSummary.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                          <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '10px' }}>
                            {violationSummary.slice(0, 4).map((item, index) => (
                              <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: COLORS[index % COLORS.length] }}></div>
                                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.name}</span>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: '#10B981', fontSize: '1.5rem', marginBottom: '5px' }}>✓</div>
                          <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem' }}>Secure Session</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px', textAlign: 'center', letterSpacing: '0.05em' }}>EXPERIENCE RATING</h3>
                    <div style={{ height: '180px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[...(experienceStats?.distribution || [])].reverse()} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="stars" type="category" tick={{ fontSize: 9, fontWeight: 'bold' }} width={45} tickFormatter={(v) => `${v} ★`} />
                          <Tooltip cursor={{ fill: 'transparent' }} />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12}>
                            {[...(experienceStats?.distribution || [])].reverse().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#EF4444', '#FB923C', '#FBBF24', '#34D399', '#10B981'][index]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Chat Feedback Analysis */}
                <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '25px', border: '1px solid var(--border-color)', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EEF2FF', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconMail size={18} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>CHAT SUPPORT PERFORMANCE</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0, fontWeight: 600 }}>Real-time satisfaction metrics from candidate interactions</p>
                      </div>
                    </div>
                    <div style={{ background: 'var(--primary-light)', padding: '6px 14px', borderRadius: '10px', textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>{chatFeedbackStats?.avgRating || 0} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>/ 5.0</span></div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Overall Rating</div>
                    </div>
                  </div>

                  <div className="reports-feedback-grid" style={{ marginBottom: '32px', maxWidth: '1100px' }}>
                    {/* Chat Feedback Rating Distribution - Tightened Legend */}
                    <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px', textAlign: 'center', letterSpacing: '0.05em' }}>CHAT RATING DISTRIBUTION</h3>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px' }}>
                        {chatFeedbackStats?.distribution ? (
                          <>
                            <div style={{ width: '40%', height: '100%' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie 
                                    data={chatFeedbackStats.distribution.map(d => ({ name: `${d.stars} Star`, value: d.count }))} 
                                    cx="50%" cy="50%" innerRadius={48} outerRadius={65} paddingAngle={4} dataKey="value" stroke="none"
                                  >
                                    {['#10B981', '#34D399', '#FBBF24', '#FB923C', '#EF4444'].map((color, index) => (
                                      <Cell key={`cell-${index}`} fill={color} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '15px' }}>
                              {chatFeedbackStats.distribution.map((item, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.65rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '60px' }}>
                                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: ['#10B981', '#34D399', '#FBBF24', '#FB923C', '#EF4444'][index] }}></div>
                                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.stars} Star</span>
                                  </div>
                                  <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{item.count}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem' }}>No Feedback Yet</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat Performance Metrics - Tightened Legend */}
                    <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px', textAlign: 'center', letterSpacing: '0.05em' }}>SUPPORT PERFORMANCE</h3>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px' }}>
                        <div style={{ width: '40%', height: '100%' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={[
                                  { name: 'Helpful', value: chatFeedbackStats?.metrics?.helpfulness || 0 },
                                  { name: 'Clarity', value: chatFeedbackStats?.metrics?.clarity || 0 },
                                  { name: 'Comm.', value: chatFeedbackStats?.metrics?.communication || 0 },
                                  { name: 'Speed', value: chatFeedbackStats?.metrics?.speed || 0 },
                                  { name: 'Satis.', value: chatFeedbackStats?.metrics?.satisfaction || 0 }
                                ]} 
                                cx="50%" cy="50%" innerRadius={48} outerRadius={65} paddingAngle={4} dataKey="value" stroke="none"
                              >
                                {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'].map((color, index) => (
                                  <Cell key={`cell-${index}`} fill={color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '15px' }}>
                          {[
                            { label: 'Helpfulness', val: chatFeedbackStats?.metrics?.helpfulness || 0, color: '#3b82f6' },
                            { label: 'Clarity', val: chatFeedbackStats?.metrics?.clarity || 0, color: '#10b981' },
                            { label: 'Comm.', val: chatFeedbackStats?.metrics?.communication || 0, color: '#8b5cf6' },
                            { label: 'Speed', val: chatFeedbackStats?.metrics?.speed || 0, color: '#f59e0b' },
                            { label: 'Satisfaction', val: chatFeedbackStats?.metrics?.satisfaction || 0, color: '#ec4899' }
                          ].map((item, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.65rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '85px' }}>
                                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.color }}></div>
                                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.label}</span>
                              </div>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{item.val}</span>
                            </div>
                          ))}
                        </div>
                    </div>
                  </div>
                </div>
              </div>

                {/* Additional Filters */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px', padding: '18px 24px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: 'var(--primary)' }}><IconSearch /></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filters:</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8' }}>STATUS</label>
                    <select className="form-select" style={{ width: '120px', background: 'var(--bg-card)', fontSize: '0.8rem', height: '38px' }} value={filterReportsStatus} onChange={(e) => setFilterReportsStatus(e.target.value)}>
                      <option value="all">All</option>
                      <option value="selected">Selected</option>
                      <option value="rejected">Rejected</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8' }}>START DATE</label>
                    <input
                      type="date"
                      className="form-select"
                      style={{ width: '130px', background: 'var(--bg-card)', fontSize: '0.8rem', height: '38px' }}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8' }}>END DATE</label>
                    <input
                      type="date"
                      className="form-select"
                      style={{ width: '130px', background: 'var(--bg-card)', fontSize: '0.8rem', height: '38px' }}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  {(startDate || endDate || filterReportsStatus !== 'all') && (
                    <button
                      className="header-btn"
                      style={{ background: '#FFF1F1', color: '#EF4444', border: '1px solid #FEE2E2', padding: '8px 16px', fontSize: '0.75rem', borderRadius: '8px' }}
                      onClick={() => { setStartDate(""); setEndDate(""); setFilterReportsStatus("all"); }}
                    >
                      Reset Filters
                    </button>
                  )}
                  <div style={{ marginLeft: 'auto', background: 'var(--primary-light)', color: 'var(--primary)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                    Matches: {currentFilteredReports.length}
                  </div>
                </div>

                {/* Table Section */}

                {currentFilteredReports.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: '1400px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '4%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em' }}>APP ID</th>
                          <th style={{ width: '11%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em' }}>CANDIDATE</th>
                          <th style={{ width: '7%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em' }}>ROLE</th>
                          <th style={{ width: '6%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em' }}>ROUND</th>
                          <th style={{ width: '9%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em' }}>COLLEGE</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em' }}>ROLL NO</th>
                          <th style={{ width: '4%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textAlign: 'center' }}>ANS</th>
                          <th style={{ width: '4%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textAlign: 'center' }}>PEN</th>
                          <th style={{ width: '6%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textAlign: 'center' }}>SCORE</th>
                          <th style={{ width: '7%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textAlign: 'center' }}>STATUS</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textAlign: 'center' }}>FINAL</th>
                          <th style={{ width: '12%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textAlign: 'center' }}>VIOLATIONS</th>
                          <th style={{ width: '9%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textAlign: 'center' }}>ANALYSIS</th>
                          <th style={{ width: '9%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentFilteredReports.map(r => {
                          const vTotal = (r.multiFace || 0) + (r.noFace || 0) + (r.mobile || 0) + (r.tabSwitch || 0) + (r.voice || 0) + (r.cheating || 0);
                          return (
                            <tr key={r.id}>
                              <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.75rem', color: 'var(--primary)' }}>{r.application_id ? `#${r.application_id}` : '-'}</td>
                              <td style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.85rem' }}>{r.name}</td>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.role}>{r.role}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: r.interviewType === 'HR' ? '#FDF4FF' : '#F0F7FF',
                                  color: r.interviewType === 'HR' ? '#701A75' : '#1D4ED8',
                                  border: `1px solid ${r.interviewType === 'HR' ? '#F5D0FE' : '#DBEAFE'}`
                                }}>
                                  {r.interviewType}
                                </span>
                              </td>
                              <td style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.collegeName}</td>
                              <td style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.8rem' }}>{r.rollNumber}</td>
                              <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--text-main)' }}>{r.answered || 0}</td>
                              <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--text-muted)' }}>{Math.max(0, 20 - (r.answered || 0))}</td>
                              <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--primary)' }}>{r.score}/40</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={`status-badge ${r.status === 'completed' ? 'status-completed' : 'status-pending'}`} style={{ borderRadius: '8px', padding: '4px 8px', fontSize: '0.65rem', fontWeight: 700 }}>
                                  {r.status}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ color: r.finalStatus === 'selected' ? '#10B981' : r.finalStatus === 'rejected' ? '#EF4444' : '#F59E0B', background: r.finalStatus === 'selected' ? '#D1FAE5' : r.finalStatus === 'rejected' ? '#FEE2E2' : '#FEF3C7', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                  {(r.finalStatus || 'pending').toUpperCase()}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {vTotal > 0 ? (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                                    {r.multiFace > 0 && <span style={{ fontSize: '0.65rem', background: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>MF:{r.multiFace}</span>}
                                    {r.noFace > 0 && <span style={{ fontSize: '0.65rem', background: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>NF:{r.noFace}</span>}
                                    {r.mobile > 0 && <span style={{ fontSize: '0.65rem', background: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>MB:{r.mobile}</span>}
                                    {r.tabSwitch > 0 && <span style={{ fontSize: '0.65rem', background: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>TS:{r.tabSwitch}</span>}
                                    {r.voice > 0 && <span style={{ fontSize: '0.65rem', background: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>V:{r.voice}</span>}
                                    {r.cheating > 0 && <span style={{ fontSize: '0.65rem', background: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>C:{r.cheating}</span>}
                                  </div>
                                ) : <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>None</span>}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button className="btn-view-analysis" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid #DBEAFE', padding: '6px 10px', fontSize: '0.7rem', borderRadius: '8px', fontWeight: 700 }} onClick={() => { setSelectedAnalysis(r.analysisData); setCurrentCandidateName(r.name); setShowAnalysisModal(true); }}>Analysis</button>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <button 
                                    className="btn-view-analysis" 
                                    style={{ 
                                      background: 'rgba(59, 130, 246, 0.1)', 
                                      color: '#3b82f6', 
                                      border: '1px solid rgba(59, 130, 246, 0.2)', 
                                      padding: '6px 10px', 
                                      fontSize: '0.7rem', 
                                      borderRadius: '8px', 
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease'
                                    }} 
                                    onClick={() => { setCurrentVideoUrl(`${API_BASE}${r.videoUrl}`); setCurrentCandidateName(r.name); setShowVideoModal(true); }}
                                  >
                                    Video
                                  </button>
                                  <button 
                                    className="btn-view-analysis" 
                                    style={{ 
                                      background: 'rgba(239, 68, 68, 0.1)', 
                                      color: '#ef4444', 
                                      border: '1px solid rgba(239, 68, 68, 0.2)', 
                                      padding: '6px 10px', 
                                      fontSize: '0.7rem', 
                                      borderRadius: '8px', 
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease'
                                    }} 
                                    onClick={() => handleDownloadSinglePDF(r)}
                                  >
                                    PDF
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <EmptyState title="No reports available." message="Completed evaluations will appear here." />}
              </div>
            </div>
          )}

          {activeTab === 'violations' && (
            <div className="animate-fade">
              <div className="dash-overview-card" style={{ padding: '32px' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 'max-content' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFF1F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                      <IconAlert />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Proctoring Violations</h2>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }}>Real-time security and integrity alerts.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                    <select className="form-select" style={{ width: '120px', background: 'var(--bg-main)', fontSize: '0.75rem', padding: '6px 24px 6px 10px', height: '34px' }} value={filterRole} onChange={(e) => { setFilterRole(e.target.value); if (e.target.value !== 'candidate-student') setFilterCollege('all'); }}>
                      <option value="all">All Users</option>
                      <option value="candidate-student">Student</option>
                      <option value="candidate-non-student">Non-Student</option>
                    </select>
                    {filterRole === 'candidate-student' && (
                      <select className="form-select" style={{ width: '140px', background: 'var(--bg-main)', fontSize: '0.75rem', padding: '6px 24px 6px 10px', height: '34px' }} value={filterCollege} onChange={(e) => setFilterCollege(e.target.value)}>
                        <option value="all">All Colleges</option>
                        {colleges.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    )}
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <IconSearch size={14} />
                      </div>
                      <input
                        type="text"
                        placeholder="Search..."
                        className="form-select"
                        style={{ paddingLeft: '30px', width: '140px', background: 'var(--bg-main)', fontSize: '0.75rem', height: '34px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <DownloadDropdown
                      label="Export"
                      onDownloadPDF={handleDownloadViolationsPDF}
                      onDownloadExcel={handleDownloadViolationsExcel}
                      icon={<IconDownload size={14} />}
                      style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 14px', fontSize: '0.75rem', height: '34px', display: 'flex', alignItems: 'center' }}
                    />
                  </div>
                </div>

                {/* Violations Table */}
                {getFilteredViolations().length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: '1100px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '15%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em' }}>CANDIDATE</th>
                          <th style={{ width: '15%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'left' }}>COLLEGE</th>
                          <th style={{ width: '10%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'left' }}>ROLL NO</th>
                          <th style={{ width: '12%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'center' }}>DATE</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'center' }}>ROUND</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'center' }}>MOBILE</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'center' }}>MULTI</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'center' }}>NO FACE</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'center' }}>VOICE</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'center' }}>SWITCH</th>
                          <th style={{ width: '8%', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'center' }}>CHEAT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredViolations().map((v, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>{v.name}</td>
                            <td style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.collegeName}</td>
                            <td style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.85rem' }}>{v.rollNumber}</td>
                            <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>{v.date}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: v.interviewType === 'HR' ? '#FDF4FF' : '#F0F7FF',
                                color: v.interviewType === 'HR' ? '#701A75' : '#1D4ED8',
                                border: `1px solid ${v.interviewType === 'HR' ? '#F5D0FE' : '#DBEAFE'}`
                              }}>
                                {v.interviewType}
                              </span>
                            </td>
                            <td className={`text-center ${v.mobile > 0 ? 'cell-critical' : ''}`} style={{ fontSize: '0.85rem', fontWeight: 700 }}>{v.mobile}</td>
                            <td className={`text-center ${v.multiFace > 0 ? 'cell-critical' : ''}`} style={{ fontSize: '0.85rem', fontWeight: 700 }}>{v.multiFace}</td>
                            <td className={`text-center ${v.noFace > 0 ? 'cell-critical' : ''}`} style={{ fontSize: '0.85rem', fontWeight: 700 }}>{v.noFace}</td>
                            <td className={`text-center ${v.voice > 0 ? 'cell-critical' : ''}`} style={{ fontSize: '0.85rem', fontWeight: 700 }}>{v.voice}</td>
                            <td className={`text-center ${v.tabSwitch > 0 ? 'cell-critical' : ''}`} style={{ fontSize: '0.85rem', fontWeight: 700 }}>{v.tabSwitch}</td>
                            <td className={`text-center ${v.cheating > 0 ? 'cell-critical' : ''}`} style={{ fontSize: '0.85rem', fontWeight: 700 }}>{v.cheating}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <EmptyState title="No violations recorded." message="Proctoring logs will appear here during live interviews." />}
              </div>
            </div>
          )}

          {activeTab === 'colleges' && (
            <div className="animate-fade">
              <div className="dash-overview-card" style={{ padding: '32px' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <IconSchool />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Manage Colleges</h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Control college visibility in registration.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <IconSearch />
                      </div>
                      <input
                        type="text"
                        placeholder="Search or Add college..."
                        className="form-select"
                        style={{ paddingLeft: '38px', width: '220px', background: 'var(--bg-main)' }}
                        value={collegeSearch}
                        onChange={(e) => setCollegeSearch(e.target.value)}
                      />
                    </div>
                    <button className="header-btn" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px' }} onClick={handleAddCollege}>
                      + Add College
                    </button>
                  </div>
                </div>

                {/* Summary Stats Grid */}
                <div className="colleges-stats-grid" style={{ marginBottom: '32px' }}>
                  {[
                    { label: 'Total Colleges', value: colleges.length, sub: 'All Institutions', icon: <IconBuilding />, bg: '#F0F7FF', color: 'var(--primary)' },
                    { label: 'Active Colleges', value: colleges.filter(c => c.status === 'active').length, sub: 'Currently Active', icon: <IconShield />, bg: '#DCFCE7', color: '#15803D' },
                    { label: 'Inactive Colleges', value: colleges.filter(c => c.status !== 'active').length, sub: 'Currently Inactive', icon: <IconPause />, bg: '#FFF7ED', color: '#EA580C' },
                    { label: 'Total Registrations', value: usersList.filter(u => u.role === 'Student').length, sub: 'Across All Colleges', icon: <IconUsers />, bg: '#FAF5FF', color: '#9333EA' }
                  ].map((stat, i) => (
                    <div key={i} style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                        {stat.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '2px' }}>{stat.label}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{stat.value.toLocaleString()}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94A3B8' }}>{stat.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table Section */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: '900px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '30%', textAlign: 'left' }}>COLLEGE NAME</th>
                        <th style={{ width: '12%', textAlign: 'center' }}>STATUS</th>
                        <th style={{ width: '15%', textAlign: 'center' }}>STUDENTS</th>
                        <th style={{ width: '15%', textAlign: 'center' }}>INTERVIEWS</th>
                        <th style={{ width: '28%', textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colleges.filter(c => c.name.toLowerCase().includes(collegeSearch.toLowerCase())).map(c => {
                        const studentCount = usersList.filter(u => u.collegeName === c.name).length;
                        const interviewCount = reports.filter(r => r.collegeName === c.name).length;
                        return (
                          <tr key={c.id}>
                            <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{c.name}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`status-badge ${c.status === 'active' ? 'status-completed' : 'status-pending'}`} style={{ borderRadius: '8px', padding: '4px 10px', fontSize: '0.7rem', fontWeight: 700 }}>
                                {c.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--text-main)' }}>{studentCount}</td>
                            <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--primary)' }}>{interviewCount}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button className="header-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', background: c.status === 'active' ? '#FFF1F1' : '#F0FDF4', color: c.status === 'active' ? '#EF4444' : '#16A34A', border: 'none' }} onClick={() => handleToggleCollege(c.id)}>
                                  {c.status === 'active' ? <><IconPower /> Disable</> : <><IconCheck /> Enable</>}
                                </button>
                                <button className="header-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#FFF1F1', color: '#EF4444', border: 'none' }} onClick={() => handleDeleteCollege(c.id)}>
                                  <IconTrash /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="animate-fade">
              <div className="dash-overview-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <IconUser />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>My Profile</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage your personal details and account security.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', marginTop: '20px' }}>
                  <div style={{ paddingRight: '40px', borderRight: '1px solid #F1F5F9' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Personal Information
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Full Name</label>
                        <input type="text" className="form-select" value={user.name} readOnly style={{ background: 'var(--bg-main)', cursor: 'default' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Email Address</label>
                        <input type="text" className="form-select" value={user.email} readOnly style={{ background: 'var(--bg-main)', cursor: 'default' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>User Role</label>
                        <input type="text" className="form-select" value="System Administrator" readOnly style={{ background: 'var(--bg-main)', cursor: 'default' }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconShield /> Account Security
                    </h3>

                    <form onSubmit={handlePasswordUpdate}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {pwdError && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>{pwdError}</div>}
                        {pwdSuccess && <div style={{ background: '#ECFDF5', color: '#059669', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>{pwdSuccess}</div>}

                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Current Password</label>
                          <input
                            type="password"
                            className="form-select"
                            placeholder="••••••••"
                            style={{ background: 'var(--bg-main)' }}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>New Password</label>
                          <input
                            type="password"
                            className="form-select"
                            placeholder="Min 8 characters"
                            style={{ background: 'var(--bg-main)' }}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Confirm New Password</label>
                          <input
                            type="password"
                            className="form-select"
                            placeholder="Repeat new password"
                            style={{ background: 'var(--bg-main)' }}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                        </div>

                        <button type="submit" className="header-btn" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px', justifyContent: 'center', fontSize: '0.9rem', marginTop: '8px' }}>
                          Update Password
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'queries' && (
            <div className="animate-fade" style={{ height: 'calc(100vh - 140px)' }}>
              <div className="queries-split-container">

                {/* Inbox Sidebar */}
                <div className="queries-sidebar">
                  <div style={{ padding: '14px 15px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>Inbox</h3>
                    <div style={{
                      background: 'var(--bg-secondary)', borderRadius: '6px', padding: '0 8px',
                      display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)',
                      height: '28px'
                    }}>
                      <IconSearchSmall />
                      <input
                        type="text" placeholder="Search inquiries..."
                        value={querySearchTerm} onChange={e => setQuerySearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.7rem', width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {getFilteredQueries().map(q => (
                      <div
                        key={q.id} onClick={() => setSelectedQuery(q)}
                        style={{
                          padding: '10px 10px', cursor: 'pointer', display: 'flex', gap: '10px', borderBottom: '1px solid var(--card-border)',
                          background: selectedQuery?.id === q.id ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                          borderLeft: selectedQuery?.id === q.id ? '4px solid #3b82f6' : '4px solid transparent'
                        }}
                      >
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%', background: `hsl(${q.id * 137.5 % 360}, 60%, 50%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.75rem'
                        }}>
                          {q.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-main)' }}>{q.name}</span>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '600' }}>{formatDate(q.created_at)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.subject || q.message}</span>
                            {q.status === 'replied' && <IconCheck />}
                          </div>
                        </div>
                      </div>
                    ))}
                    {getFilteredQueries().length === 0 && (
                      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8' }}>
                        <IconInbox />
                        <p style={{ marginTop: '12px', fontWeight: 700 }}>No inquiries found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detail View */}
                <div className="queries-detail-view">
                  {selectedQuery ? (
                    <>
                      <header style={{ padding: '20px 32px', background: 'var(--bg-card)', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '50%', background: `hsl(${selectedQuery.id * 137.5 % 360}, 60%, 50%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800
                          }}>
                            {selectedQuery.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--text-main)' }}>{selectedQuery.name}</h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedQuery.email}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteQuery(selectedQuery.id)}
                          style={{ background: '#FEE2E2', border: 'none', color: '#EF4444', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}
                        >
                          <IconTrash />
                        </button>
                      </header>

                      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Subject: {selectedQuery.subject || 'No Subject'}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(selectedQuery.created_at).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{selectedQuery.message}</div>
                        </div>

                        {selectedQuery.status === 'replied' && (
                          <div style={{ textAlign: 'center', marginTop: '24px' }}>
                            <span style={{ background: 'var(--bg-success-light)', color: 'var(--color-success)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid var(--border-color)' }}>
                              RESOLVED • OFFICIAL REPLY SENT
                            </span>
                          </div>
                        )}
                      </main>

                      <footer style={{ padding: '24px 32px', background: 'var(--bg-card)', borderTop: '1px solid var(--card-border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Response</label>
                          <textarea
                            value={replyText} onChange={e => setReplyText(e.target.value)}
                            placeholder={`Reply to ${selectedQuery.name.split(' ')[0]}...`}
                            style={{ height: '100px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', outline: 'none', resize: 'none', fontSize: '0.9rem' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={handleReplyToQuery} disabled={isSendingReply || !replyText.trim()}
                              className="header-btn"
                              style={{ background: '#001B3D', color: '#fff', border: 'none', padding: '12px 24px', margin: 0, justifyContent: 'center' }}
                            >
                              {isSendingReply ? "Sending..." : <><IconSend /> Send Official Reply</>}
                            </button>
                          </div>
                        </div>
                      </footer>
                    </>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
                      <div style={{ width: '100px', height: '100px', background: 'var(--bg-card)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <IconMail />
                      </div>
                      <h4 style={{ fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px' }}>Support Center</h4>
                      <p style={{ color: 'var(--text-muted)', maxWidth: '300px', fontSize: '0.9rem' }}>Select an inquiry from the inbox to read the details and respond.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="animate-fade" style={{ height: 'calc(100vh - 140px)', background: 'var(--bg-card)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <AdminChats />
            </div>
          )}
        </div>
      </main>

      {showVideoModal && (
        <div className="modal-overlay" onClick={() => setShowVideoModal(false)}>
          <div className="modal-content" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowVideoModal(false)}>✕</button>
            <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Interview Recording: <span style={{ color: 'var(--primary)' }}>{currentCandidateName}</span>
              </h3>
            </div>
            <div className="video-player-container">
              <video src={currentVideoUrl} controls autoPlay />
            </div>
            <div style={{ padding: '16px 24px', background: 'var(--bg-main)', textAlign: 'right' }}>
              <button className="header-btn" onClick={() => setShowVideoModal(false)} style={{ margin: 0 }}>Close Player</button>
            </div>
          </div>
        </div>
      )}

      {showAnalysisModal && (
        <div className="modal-overlay" onClick={() => setShowAnalysisModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowAnalysisModal(false)}>✕</button>
            <div style={{ padding: '32px' }}>
              <h3 style={{ color: 'var(--text-main)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <IconChart /> Technical Evaluation: <span style={{ color: 'var(--primary)' }}>{currentCandidateName}</span>
              </h3>
              <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '16px', maxHeight: '450px', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.7', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem' }}>
                {selectedAnalysis || "No analysis recorded."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
