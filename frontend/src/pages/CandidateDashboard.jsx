import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import ThemeToggle from "../components/ThemeToggle";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import ChatWidget from '../components/ChatWidget';
import "./Dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// --- Icons ---
const IconRobot = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
    <circle cx="12" cy="5" r="2"></circle>
    <path d="M12 7v4"></path>
    <line x1="8" y1="16" x2="8" y2="16"></line>
    <line x1="16" y1="16" x2="16" y2="16"></line>
  </svg>
);

const IconChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const IconCloudUpload = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19a5.5 5.5 0 0 0 1.5-10.5 8.5 8.5 0 1 0-14.5 4.5"></path>
    <polyline points="11 13 14 10 17 13"></polyline>
    <line x1="14" y1="10" x2="14" y2="18"></line>
  </svg>
);

const IconChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const IconCheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const IconFlag = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
    <line x1="4" y1="22" x2="4" y2="15"></line>
  </svg>
);

const IconFilter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const IconRocket = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
  </svg>
);

const IconChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const IconMobile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
    <line x1="12" y1="18" x2="12.01" y2="18"></line>
  </svg>
);

const IconLayout = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </svg>
);

const IconZap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const IconHelp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const IconMenu = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const DownloadDropdown = ({ label, onDownloadPDF, onDownloadExcel, className, style, icon }) => (
  <div className="download-dropdown">
    <button className={className || "btn-download-report"} style={style} onClick={(e) => e.stopPropagation()}>
      {icon} {label}
    </button>
    <div className="download-dropdown-content">
      <div className="download-dropdown-inner">
        <button className="download-item pdf-type" onClick={(e) => { e.stopPropagation(); onDownloadPDF(); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          PDF Report
        </button>
        <button className="download-item excel-type" onClick={(e) => { e.stopPropagation(); onDownloadExcel(); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          Excel Report
        </button>
      </div>
    </div>
  </div>
);

function CandidateDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("interviews");
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState("");
  const [selectedRole, setSelectedRole] = useState("General Resume");
  const [customRole, setCustomRole] = useState("");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [interviewType, setInterviewType] = useState("Technical");

  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Password Change States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  // Help/Query States
  const [queryForm, setQueryForm] = useState({ subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const [myResults, setMyResults] = useState([]);
  const [myViolations, setMyViolations] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [selectedAppForRound, setSelectedAppForRound] = useState(null);

  const technicalRoles = [
    "Software Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "Data Analyst", "Data Scientist", "Machine Learning Engineer", "DevOps Engineer",
    "Cybersecurity Analyst", "Quality Assurance (QA) Engineer", "UI/UX Designer"
  ];

  const nonTechnicalRoles = [
    "General Resume", "Product Manager", "Project Manager", "Business Analyst",
    "Digital Marketing Specialist", "Sales Executive", "Human Resources (HR) Manager",
    "Customer Support Executive", "Content Writer", "Graphic Designer"
  ];

  const rolesList = interviewType === 'Technical' ? technicalRoles : nonTechnicalRoles;

  useEffect(() => {
    if (interviewType === 'Technical') {
      if (!technicalRoles.includes(selectedRole)) {
        setSelectedRole(technicalRoles[0]);
      }
    } else {
      if (!nonTechnicalRoles.includes(selectedRole)) {
        setSelectedRole(nonTechnicalRoles[0]);
      }
    }
  }, [interviewType]);
  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month} ${day}`;
  };

  const formatJudgement = (text) => {
    if (!text) return "Analysis processing...";
    let clean = text.replace(/Score:.*?\n/i, "").replace(/Analysis:.*?\n/i, "").replace(/Summary:/i, "");
    return clean.trim();
  };

  const fetchUserData = async (userId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/candidate/results/${userId}`);
      setMyResults(res.data.map(i => ({
        id: i.id,
        date: formatDate(i.created_at),
        role: i.role || "General Application",
        score: i.score || 0,
        analysisData: i.analysis_data || i.result || "",
        status: i.status || "ongoing",
        interviewType: i.interview_type || "Technical",
        isItRole: i.is_it_role,
        finalStatus: i.final_status || "pending",
        answeredCount: i.answered_count || 0,
        pendingCount: i.pending_count || 0,
        mobile: Number(i.mobile_count || 0),
        multiFace: Number(i.multi_face_count || 0),
        noFace: Number(i.no_face_count || 0),
        voice: Number(i.voice_count || 0),
        tabSwitch: Number(i.tab_switch_count || 0),
        cheating: Number(i.cheating_count || 0)
      })));
      setMyViolations(res.data.map(i => {
        const v = {
          id: i.id,
          date: formatDate(i.created_at),
          mobile: Number(i.mobile_count || 0),
          multiFace: Number(i.multi_face_count || 0),
          noFace: Number(i.no_face_count || 0),
          voice: Number(i.voice_count || 0),
          tabSwitch: Number(i.tab_switch_count || 0),
          cheating: Number(i.cheating_count || 0),
          interviewType: i.interview_type || "Technical"
        };
        // Sum only the visible columns to match user's expected total of 72
        v.total_violations = v.mobile + v.noFace + v.voice + v.tabSwitch + v.cheating;
        return v;
      }));
    } catch (err) { console.error(err); }
  };

  const fetchUserProfile = async (userId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/user/${userId}`);
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (err) { console.error("Error fetching profile:", err); }
  };

  const fetchApplications = async (userId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/applications/${userId}`);
      setMyApplications(res.data);
    } catch (err) { console.error("Error fetching applications:", err); }
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

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Reference-based: Sending candidate support query
      await axios.post(`${API_BASE}/api/public/query`, {
        name: user.name,
        email: user.email,
        subject: queryForm.subject,
        message: queryForm.message
      });
      setSubmitStatus('Your support request has been sent successfully!');
      setQueryForm({ subject: '', message: '' });
      setTimeout(() => setSubmitStatus(null), 5000);
    } catch (err) {
      console.error('Support query error:', err);
      alert('Failed to send support request. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      fetchUserData(parsedUser.id);
      fetchApplications(parsedUser.id);
      fetchUserProfile(parsedUser.id);
    } else {
      handleLogout();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleUpload = async () => {
    const selectedFile = document.getElementById('resume-upload').files[0];
    if (!selectedFile) return alert("Please select your resume PDF.");
    setUploading(true);
    const formData = new FormData();
    formData.append("resume", selectedFile);
    formData.append("userId", user.id);
    formData.append("role", selectedAppForRound ? selectedAppForRound.role : (isCustomRole ? customRole : selectedRole));
    formData.append("interviewType", selectedAppForRound ? selectedAppForRound.type : interviewType);
    if (selectedAppForRound) {
      formData.append("applicationId", selectedAppForRound.appId);
    }
    try {
      const res = await axios.post(`${API_BASE}/api/upload-resume`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      navigate(`/interview/${res.data.interviewId}`);
    } catch (err) { alert("Upload error. Please try again."); } finally { setUploading(false); }
  };

  const handleDownloadPDF = (report) => {
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
    const isHR = report.interviewType === "HR";
    doc.text(`SHNOOR AI SYSTEMS • ${isHR ? 'BEHAVIORAL' : 'TECHNICAL'} ASSESSMENT PORTAL`, 40, 20);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 40, 24);

    // Candidate Info Table
    autoTable(doc, {
      startY: 38,
      head: [["CANDIDATE PROFILE", "INFORMATION"]],
      body: [
        ["Full Name", user.name],
        ["Target Role", report.role],
        ["Interview Date", report.date],
        ["Final Score", `${report.score} / 100`],
        ["Interview Type", report.interviewType || "Technical"],
        ["Status", report.status.toUpperCase()]
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
    doc.text(`${isHR ? 'BEHAVIORAL' : 'TECHNICAL'} ASSESSMENT & JUDGEMENT`, 15, finalY);

    finalY += 10;
    let cleanAnalysis = (report.analysisData || "No detailed technical analysis recorded.")
      .replace(/<total_score>/g, '')
      .replace(/\*\*/g, '').replace(/###/g, '').replace(/#{1,6}\s?/g, '').replace(/^-\s/gm, '').trim();

    // Add gaps between sections
    let formattedText = cleanAnalysis
      .replace(/Strengths:/g, 'Strengths:')
      .replace(/Weaknesses:/g, '\n\nWeaknesses:')
      .replace(/Communication Style:/g, '\n\nCommunication Style:')
      .replace(/STAR Method Usage:/g, '\n\nSTAR Method Usage:')
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

    doc.save(`Evaluation_${user.name.replace(/\s+/g, '_')}_Report.pdf`);
  };

  const handleDownloadExcel = (report) => {
    try {
      const data = [
        { "Section": "CANDIDATE PROFILE", "Value": "" },
        { "Section": "Full Name", "Value": user.name },
        { "Section": "Target Role", "Value": report.role },
        { "Section": "Round Type", "Value": report.interviewType },
        { "Section": "Interview Date", "Value": report.date },
        { "Section": "Final Score", "Value": `${report.score} / 100` },
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
      XLSX.writeFile(workbook, `Interview_Report_${report.role.replace(/\s+/g, '_')}.xlsx`);
    } catch (err) { console.error('Failed to generate Excel', err); }
  };

  const violationData = [
    { name: 'No Face', value: myViolations.reduce((s, v) => s + (v.noFace || 0), 0) },
    { name: 'Mobile', value: myViolations.reduce((s, v) => s + (v.mobile || 0), 0) },
    { name: 'Tab Switch', value: myViolations.reduce((s, v) => s + (v.tabSwitch || 0), 0) },
    { name: 'Voice', value: myViolations.reduce((s, v) => s + (v.voice || 0), 0) },
    { name: 'Cheating', value: myViolations.reduce((s, v) => s + (v.cheating || 0), 0) }
  ];
  const totalViolationsCount = violationData.reduce((sum, entry) => sum + entry.value, 0);
  const VIOLATION_COLORS = ['#10B981', '#2563EB', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (!user) return null;

  return (
    <div className="dashboard-container">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90, backdropFilter: 'blur(2px)' }} 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="global-logo-container" style={{ width: '42px', height: '42px' }}>
            <img src="/shnoor_logo.png" alt="Shnoor" className="sidebar-logo" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
          </div>
          <div className="sidebar-brand">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Shnoor AI</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Candidate Portal</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button className={`sidebar-tab ${activeTab === 'interviews' ? 'active' : ''}`} onClick={() => { setActiveTab('interviews'); setIsSidebarOpen(false); }}>
            <IconRobot /> <span>My Interviews</span>
          </button>
          <button className={`sidebar-tab ${activeTab === 'results' ? 'active' : ''}`} onClick={() => { setActiveTab('results'); fetchUserData(user.id); setIsSidebarOpen(false); }}>
            <IconChart /> <span>Results</span>
          </button>
          <button className={`sidebar-tab ${activeTab === 'violations' ? 'active' : ''}`} onClick={() => { setActiveTab('violations'); fetchUserData(user.id); setIsSidebarOpen(false); }}>
            <IconAlert /> <span>Violations</span>
          </button>
          <button className={`sidebar-tab ${activeTab === 'help' ? 'active' : ''}`} onClick={() => { setActiveTab('help'); setIsSidebarOpen(false); }}>
            <IconHelp /> <span>Help & Support</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dash-main-wrapper">
        <header className="dash-header-top">
          <div className="header-brand-mobile-container">
            <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(true)}>
              <IconMenu />
            </button>
            <div className="user-welcome">
              <h1>Hello, {user.name.split(' ')[0]}! 👋</h1>
              <p>Ready to ace your next interview?</p>
            </div>
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <button className={`header-btn ${activeTab === 'profile' ? 'profile-active' : ''}`} onClick={() => setActiveTab('profile')}>
              <IconUser /> My Profile
            </button>
            <button className="header-btn logout" onClick={handleLogout}><IconLogout /> Logout</button>
          </div>
        </header>

        <div className="dash-content-area" style={{ marginTop: '72px' }}>
          {activeTab === 'interviews' && (
            <div className="animate-fade">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <IconRobot />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>My Applications & Interviews</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Apply for a role and manage your interview rounds.</p>
                </div>
              </div>

              {!selectedAppForRound ? (
                <>
                  <div className="interview-setup-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="setup-step" style={{ gridColumn: 'span 1' }}>
                      <div className="step-header">
                        <h3>Apply for a New Role</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', background: 'var(--bg-main)', padding: '32px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                        <div className="segmented-control">
                          <button
                            className={`segment-btn ${interviewType === 'Technical' ? 'active' : ''}`}
                            onClick={() => setInterviewType('Technical')}
                          >
                            <span className="segment-icon">💻</span>
                            <span>IT Role</span>
                          </button>
                          <button
                            className={`segment-btn ${interviewType === 'HR' ? 'active' : ''}`}
                            onClick={() => setInterviewType('HR')}
                          >
                            <span className="segment-icon">🤝</span>
                            <span>Non-IT Role</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '800px', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div className="form-select-wrapper" style={{ marginBottom: 0 }}>
                              {isCustomRole ? (
                                <input type="text" className="form-select" style={{ height: '48px', fontSize: '1rem' }} placeholder="e.g. Senior Backend Engineer" value={customRole} onChange={e => setCustomRole(e.target.value)} />
                              ) : (
                                <select className="form-select" style={{ height: '48px', fontSize: '1rem' }} value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                                  {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                              )}
                              {!isCustomRole && <div className="select-arrow"><IconChevronDown /></div>}
                            </div>
                            <button className="add-custom-btn" onClick={() => setIsCustomRole(!isCustomRole)} style={{ background: 'none', border: 'none', color: '#6366f1', padding: '4px 0', fontSize: '0.8rem', marginTop: '6px' }}>
                              {isCustomRole ? "← Select Existing" : "+ Add Custom Role"}
                            </button>
                          </div>

                          <button className="start-interview-btn" style={{ width: '220px', height: '48px', margin: 0, padding: 0 }} onClick={async () => {
                            try {
                              const roleToApply = isCustomRole ? customRole : selectedRole;
                              // Force Non-IT if role is in nonTechnicalRoles
                              const isActuallyIT = interviewType === 'Technical' && !nonTechnicalRoles.includes(roleToApply);
                              
                              await axios.post(`${API_BASE}/api/applications`, {
                                userId: user.id,
                                role: roleToApply,
                                isItRole: isActuallyIT
                              });
                              fetchApplications(user.id);
                              alert("Applied successfully!");
                            } catch (e) { alert("Error applying"); }
                          }}>Apply Now</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '32px' }}>
                    <h3 style={{ marginBottom: '16px', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>Your Current Applications</h3>
                    {myApplications.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No applications yet. Apply above to start.</p> : (
                      <div className="applications-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {myApplications.map(app => (
                          <div key={app.id} style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{app.role}</h4>
                              <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                Type: <strong>{app.is_it_role ? 'IT Role' : 'Non-IT Role'}</strong> |
                                Status: <strong>{app.status.toUpperCase()}</strong> |
                                Final Status: <strong style={{ color: app.final_status === 'selected' ? 'var(--success-color)' : app.final_status === 'rejected' ? 'var(--error-color)' : 'var(--warning-color)' }}>{app.final_status.toUpperCase()}</strong>
                              </p>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                                {/* Hide all action buttons if finalized */}
                                {app.final_status !== 'pending' ? (
                                  <span style={{ 
                                    padding: '8px 16px', 
                                    borderRadius: '8px', 
                                    background: app.final_status === 'selected' ? '#ecfdf5' : '#fef2f2',
                                    color: app.final_status === 'selected' ? '#059669' : '#dc2626',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem'
                                  }}>
                                    Application Closed
                                  </span>
                                ) : (
                                  <>
                                    {/* IT Role Logic */}
                                    {app.is_it_role && (
                                      <>
                                        {/* TR Round Section */}
                                        {!app.tr_done ? (
                                          app.ongoing_interview_id && app.ongoing_interview_type === 'Technical' ? (
                                            <button className="start-interview-btn" onClick={() => navigate(`/interview/${app.ongoing_interview_id}`)} style={{ padding: '8px 16px', fontSize: '0.9rem', width: 'auto', background: '#059669' }}>Resume TR Round</button>
                                          ) : (
                                            <button className="start-interview-btn" onClick={() => setSelectedAppForRound({ appId: app.id, role: app.role, type: 'Technical' })} style={{ padding: '8px 16px', fontSize: '0.9rem', width: 'auto' }}>Take TR Round</button>
                                          )
                                        ) : (
                                          app.tr_score === null ? (
                                            <span className="animate-pulse" style={{ color: '#f59e0b', fontWeight: 'bold', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                              ⏳ Evaluating Technical Round...
                                            </span>
                                          ) : (
                                            /* HR Round Section (Practice vs Real) */
                                            app.tr_score >= 60 ? (
                                              /* REAL HR ROUND (Qualified) */
                                              <>
                                                {!app.hr_done && (
                                                  app.ongoing_interview_id && app.ongoing_interview_type === 'HR' ? (
                                                    <button className="start-interview-btn" onClick={() => navigate(`/interview/${app.ongoing_interview_id}`)} style={{ padding: '8px 16px', fontSize: '0.9rem', width: 'auto', background: '#059669' }}>Resume HR Round</button>
                                                  ) : (
                                                    <button className="start-interview-btn" onClick={() => setSelectedAppForRound({ appId: app.id, role: app.role, type: 'HR' })} style={{ padding: '8px 16px', fontSize: '0.9rem', width: 'auto' }}>Take HR Round Unlock!</button>
                                                  )
                                                )}
                                              </>
                                            ) : (
                                              /* PRACTICE HR ROUND (Not yet qualified or failed TR) */
                                              <>
                                                {!app.hr_done && (
                                                  app.ongoing_interview_id && app.ongoing_interview_type === 'HR' ? (
                                                    <button className="start-interview-btn" onClick={() => navigate(`/interview/${app.ongoing_interview_id}`)} style={{ padding: '8px 16px', fontSize: '0.9rem', width: 'auto', background: '#059669' }}>Resume HR Practice</button>
                                                  ) : (
                                                    <button className="start-interview-btn" onClick={() => setSelectedAppForRound({ appId: app.id, role: app.role, type: 'HR' })} style={{ padding: '8px 16px', fontSize: '0.9rem', width: 'auto', background: '#6366f1' }}>Practice HR Round</button>
                                                  )
                                                )}
                                              </>
                                            )
                                          )
                                        )}

                                        {app.tr_done && app.hr_done && (
                                          app.hr_score === null ? (
                                            <span className="animate-pulse" style={{ color: '#f59e0b', fontWeight: 'bold', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                              ⏳ Evaluating HR Round...
                                            </span>
                                          ) : (
                                            <span style={{ color: '#6366f1', fontWeight: 'bold', fontSize: '0.85rem', padding: '8px 16px' }}>All Rounds Completed</span>
                                          )
                                        )}
                                      </>
                                    )}

                                    {/* Non-IT Role Logic (No Practice Option) */}
                                    {!app.is_it_role && (
                                      <>
                                        {!app.hr_done ? (
                                          app.ongoing_interview_id && app.ongoing_interview_type === 'HR' ? (
                                            <button className="start-interview-btn" onClick={() => navigate(`/interview/${app.ongoing_interview_id}`)} style={{ padding: '8px 16px', fontSize: '0.9rem', width: 'auto', background: '#059669' }}>Resume HR Round</button>
                                          ) : (
                                            <button className="start-interview-btn" onClick={() => setSelectedAppForRound({ appId: app.id, role: app.role, type: 'HR' })} style={{ padding: '8px 16px', fontSize: '0.9rem', width: 'auto' }}>Take HR Round</button>
                                          )
                                        ) : (
                                          app.hr_score === null ? (
                                            <span className="animate-pulse" style={{ color: '#f59e0b', fontWeight: 'bold', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                              ⏳ Evaluating Performance...
                                            </span>
                                          ) : (
                                            <span style={{ color: '#10B981', fontWeight: 'bold', padding: '8px 16px' }}>HR Round Completed</span>
                                          )
                                        )}
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="interview-setup-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="setup-step" style={{ gridColumn: 'span 1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="step-header" style={{ marginBottom: 0 }}>
                        <h3>Upload Your Resume for {selectedAppForRound.type} Round</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Role: {selectedAppForRound.role}</p>
                      </div>
                        <button onClick={() => setSelectedAppForRound(null)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; }}>Cancel</button>
                    </div>

                    <label className="upload-drag-zone" htmlFor="resume-upload" style={{ marginTop: '20px' }}>
                      <div className="upload-icon"><IconCloudUpload /></div>
                      <div className="upload-text">Drag & drop your PDF here</div>
                      <div className="upload-subtext">or</div>
                      <div className="choose-file-btn">Choose File</div>
                      <input
                        type="file"
                        id="resume-upload"
                        accept=".pdf"
                        onChange={e => setFile(e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {file && <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, marginTop: '8px', textAlign: 'center' }}>Selected: {file.name}</p>}

                    <button className="start-interview-btn" onClick={handleUpload} disabled={uploading || !file} style={{ marginTop: '20px' }}>
                      <IconRocket />
                      <span>{uploading ? "Preparing Round..." : "Upload Resume & Start Round"}</span>
                      <IconChevronRight />
                    </button>
                  </div>
                </div>
              )}

              <div className="info-banner" style={{ marginTop: '32px' }}>
                <div className="info-icon"><IconShield /></div>
                <p>
                  <strong>Ensure your resume is updated and relevant to get the most accurate interview experience.</strong>
                  Our AI uses your resume to customize questions and evaluate your responses effectively.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="animate-fade">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <IconChart />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Interview Performance</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Track your technical assessment scores and evaluation history.</p>
                </div>
              </div>
              {/* 1. Metric Cards Grid */}
              <div className="results-stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-box" style={{ background: '#EFF6FF', color: 'var(--primary)' }}>
                    <IconRobot />
                  </div>
                  <div className="stat-info">
                    <h4>Total Interviews</h4>
                    <p className="stat-value">{myResults.length}</p>
                    <p className="stat-sub">All time</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-box" style={{ background: '#DCFCE7', color: '#15803D' }}>
                    <IconCheckCircle />
                  </div>
                  <div className="stat-info">
                    <h4>Completed</h4>
                    <p className="stat-value">{myResults.filter(r => r.status === 'completed').length}</p>
                    <p className="stat-sub">{((myResults.filter(r => r.status === 'completed').length / (myResults.length || 1)) * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-box" style={{ background: '#FEF3C7', color: '#B45309' }}>
                    <IconClock />
                  </div>
                  <div className="stat-info">
                    <h4>In Progress</h4>
                    <p className="stat-value">{myResults.filter(r => r.status === 'pending' || r.status === 'ongoing').length}</p>
                    <p className="stat-sub">Active</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-box" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                    <IconFlag />
                  </div>
                  <div className="stat-info">
                    <h4>Flagged</h4>
                    <p className="stat-value">{myResults.filter(r => r.status === 'flagged').length}</p>
                    <p className="stat-sub">Review needed</p>
                  </div>
                </div>
              </div>

              {/* 2. Charts Section */}
              <div className="results-main-grid">
                <div className="chart-card">
                  <div className="chart-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconChart /> Interview Score Progress
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-main)', padding: '4px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      Last 5 Interviews
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={myResults.slice(0, 5).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                      <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} fontSize={10} axisLine={false} tickLine={false} />
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
                      <Bar dataKey="score" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card" style={{ padding: '30px' }}>
                  <h3 style={{ textAlign: 'center', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Violations</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '30px' }}>
                    {totalViolationsCount > 0 ? (
                      <>
                        <ResponsiveContainer width="45%" height="100%">
                          <PieChart>
                            <Pie
                              data={violationData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                              startAngle={90}
                              endAngle={-270}
                            >
                              {violationData.map((entry, index) => <Cell key={index} fill={VIOLATION_COLORS[index]} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                          {violationData.map((entry, index) => {
                            const percentage = totalViolationsCount > 0 ? ((entry.value / totalViolationsCount) * 100).toFixed(2) : "0.00";
                            return (
                              <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: VIOLATION_COLORS[index] }}></div>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{entry.name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.85rem' }}>
                                  <span>{entry.value}</span>
                                  <span>({percentage}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#10B981', fontSize: '2rem', marginBottom: '10px' }}><IconCheckCircle /></div>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>No violations detected!</p>
                        <p style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Your interview integrity is excellent.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Results Table */}
              <div className="dash-overview-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid #E2E8F0' }}>
                    <IconLayout />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Interview Records</h3>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '10%' }}>DATE</th>
                        <th style={{ width: '18%' }}>APPLIED ROLE</th>
                        <th style={{ width: '12%', textAlign: 'center' }}>SELECTION STATUS</th>
                        <th style={{ width: '10%', textAlign: 'center' }}>ROUND</th>
                        <th style={{ width: '8%', textAlign: 'center' }}>ANS</th>
                        <th style={{ width: '8%', textAlign: 'center' }}>PEN</th>
                        <th style={{ width: '10%', textAlign: 'center' }}>SCORE</th>
                        <th style={{ width: '10%', textAlign: 'center' }}>INT. STATUS</th>
                        <th style={{ width: '14%', textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myResults.map(r => (
                        <tr key={r.id}>
                          <td style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem' }}>{r.date}</td>
                          <td style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.85rem' }} title={r.role}>{r.role}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ 
                              padding: '6px 12px', 
                              borderRadius: '8px', 
                              fontSize: '0.7rem', 
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              background: r.finalStatus === 'selected' ? '#D1FAE5' : r.finalStatus === 'rejected' ? '#FEE2E2' : '#F1F5F9',
                              color: r.finalStatus === 'selected' ? '#10B981' : r.finalStatus === 'rejected' ? '#EF4444' : '#475569',
                              border: 'none'
                            }}>
                              {r.finalStatus}
                            </span>
                          </td>
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
                          <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}>{r.answeredCount || 0}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}>{r.pendingCount || 0}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="score-bold" style={{ fontSize: '0.9rem', color: r.score >= 24 ? '#10B981' : r.score >= 16 ? '#F59E0B' : '#EF4444' }}>
                               {r.score}/40
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`status-badge ${r.status === 'completed' ? 'status-completed' : r.status === 'flagged' ? 'status-flagged' : 'status-pending'}`} style={{ fontSize: '0.65rem' }}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="action-buttons" style={{ justifyContent: 'center' }}>
                              <button className="btn-view-analysis" onClick={() => { setSelectedAnalysis(formatJudgement(r.analysisData)); setShowAnalysisModal(true); }}>
                                <IconEye />
                              </button>
                              <button className="btn-download-report" onClick={() => handleDownloadPDF(r)}>
                                <IconDownload />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'violations' && (
            <div className="animate-fade">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FFF1F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                  <IconShield />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Proctoring Violations</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Review security alerts detected during your interview sessions.</p>
                </div>
              </div>

              <div className="dash-overview-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid #E2E8F0' }}>
                    <IconLayout />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Detailed Violations Log</h3>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>INTERVIEW DATE</th>
                        <th style={{ textAlign: 'center' }}>ROUND</th>
                        <th>MULTI FACE</th>
                        <th>NO FACE</th>
                        <th>MOBILE DETECTED</th>
                        <th>TAB SWITCH</th>
                        <th>VOICE ALERT</th>
                        <th>CHEATING</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myViolations.map((v, idx) => (
                        <tr key={v.id || idx}>
                          <td>{v.date}</td>
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
                          <td className={(v.multiFace || 0) > 0 ? 'cell-critical' : ''}>{v.multiFace || 0}</td>
                          <td className={(v.noFace || 0) > 0 ? 'cell-critical' : ''}>{v.noFace || 0}</td>
                          <td className={(v.mobile || 0) > 0 ? 'cell-critical' : ''}>{v.mobile || 0}</td>
                          <td className={(v.tabSwitch || 0) > 0 ? 'cell-critical' : ''}>{v.tabSwitch || 0}</td>
                          <td className={(v.voice || 0) > 0 ? 'cell-critical' : ''}>{v.voice || 0}</td>
                          <td className={(v.cheating || 0) > 0 ? 'cell-critical' : ''}>{v.cheating || 0}</td>
                        </tr>
                      ))}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', marginTop: '10px' }}>
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>User Role</label>
                          <input type="text" className="form-select" value={user.role === 'candidate-student' ? 'Student' : 'Non-student'} readOnly style={{ background: 'var(--bg-main)', cursor: 'default' }} />
                        </div>
                        {user.role === 'candidate-student' && (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Roll Number</label>
                            <input type="text" className="form-select" value={user.roll_number || user.rollNumber || '-'} readOnly style={{ background: 'var(--bg-main)', cursor: 'default' }} />
                          </div>
                        )}
                      </div>
                      {user.role === 'candidate-student' && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>College Name</label>
                          <input type="text" className="form-select" value={user.college_name || user.collegeName || '-'} readOnly style={{ background: 'var(--bg-main)', cursor: 'default' }} />
                        </div>
                      )}
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

                        <button type="submit" className="start-interview-btn" style={{ padding: '12px', fontSize: '0.9rem', marginTop: '8px' }}>
                          Update Password
                        </button>
                      </div>
                    </form>

                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="animate-fade">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                  <IconHelp />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Help & Support Center</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Find answers to common questions or contact our support team.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                {/* FAQs */}
                <div className="dash-overview-card" style={{ padding: '32px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '24px' }}>Frequently Asked Questions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>How does the AI Proctoring work?</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Our AI monitors your camera and microphone for suspicious activities like tab switching, multiple faces, or unauthorized device usage to ensure interview integrity.</p>
                    </div>
                    <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Can I restart an interview if I disconnect?</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>If you face technical issues, please contact support immediately. Completed sessions cannot be restarted, but technical failures can be reviewed.</p>
                    </div>
                    <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>How are my scores calculated?</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Scores are based on technical accuracy, logic, and communication skills as evaluated by our specialized Solaris AI Interviewer.</p>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="dash-overview-card" style={{ padding: '32px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '24px' }}>Send us a Message</h3>
                  <form onSubmit={handleQuerySubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Subject</label>
                        <input
                          type="text"
                          className="form-select"
                          placeholder="e.g. Technical Issue"
                          value={queryForm.subject}
                          onChange={(e) => setQueryForm({ ...queryForm, subject: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Message</label>
                        <textarea
                          className="form-select"
                          placeholder="Describe your issue or question..."
                          style={{ height: '120px', resize: 'none', paddingTop: '12px' }}
                          value={queryForm.message}
                          onChange={(e) => setQueryForm({ ...queryForm, message: e.target.value })}
                          required
                        ></textarea>
                      </div>
                      <button type="submit" className="start-interview-btn" disabled={isSubmitting} style={{ padding: '12px', fontSize: '0.9rem' }}>
                        {isSubmitting ? "Sending..." : "Submit Support Request"}
                      </button>
                      {submitStatus && <p style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', marginTop: '12px' }}>{submitStatus}</p>}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showAnalysisModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAnalysisModal(false)}>
          <div style={{ background: 'var(--bg-card)', width: '90%', maxWidth: '700px', padding: '40px', borderRadius: '24px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setShowAnalysisModal(false)}>✕</button>
            <h2 style={{ marginBottom: '20px' }}>Technical Evaluation</h2>
            <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '16px', maxHeight: '400px', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {selectedAnalysis}
            </div>
          </div>
        </div>
      )}
      <ChatWidget />
    </div>
  );
}

export default CandidateDashboard;
