import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  Award,
  Plus,
  Search,
  Sparkles,
  BookOpen,
  Clock,
  ShieldCheck,
  AlertCircle,
  Printer,
  ChevronRight,
  Filter,
  Users,
  RefreshCw,
  Trophy,
  X,
  HelpCircle,
  Check,
  FileCheck
} from 'lucide-react';
import api from '../api';

const LearningLms = () => {
  const [activeTab, setActiveTab] = useState('onboarding'); // onboarding, modules, certificates, admin
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Onboarding Checklist State
  const [onboardingData, setOnboardingData] = useState({
    employee: null,
    tasks: [],
    progress_percentage: 0,
    completed_count: 0,
    total_count: 0,
  });
  const [taskCategoryFilter, setTaskCategoryFilter] = useState('All');
  const [taskStatusFilter, setTaskStatusFilter] = useState('All');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'HR & Compliance',
    due_days: 1,
    priority: 'medium',
  });

  // LMS Modules State
  const [modules, setModules] = useState([]);
  const [moduleCategoryFilter, setModuleCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState(null);
  const [showModuleModal, setShowModuleModal] = useState(false);

  // Quiz State
  const [quizModule, setQuizModule] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Certificates State
  const [certificates, setCertificates] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Stats State
  const [lmsStats, setLmsStats] = useState({
    total_modules: 0,
    completed_modules: 0,
    certificates_earned: 0,
    avg_score: 0,
  });

  // Admin Module Creation State
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    category: 'Compliance',
    content_type: 'document',
    content_url: '',
    document_text: '',
    estimated_minutes: 15,
    passing_score: 80,
    questions: [
      {
        question: '',
        options: ['', '', '', ''],
        correct_option: 0,
        explanation: '',
      },
    ],
  });

  const isAdminOrManager = ['admin', 'manager'].includes(user.role);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOnboardingTasks(),
        fetchModules(),
        fetchCertificates(),
        fetchStats(),
      ]);
    } catch (err) {
      console.error('Error loading LMS data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnboardingTasks = async () => {
    try {
      const res = await api.get('/onboarding/tasks');
      setOnboardingData(res.data);
    } catch (err) {
      console.error('Failed to fetch onboarding tasks', err);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await api.get('/lms/modules');
      setModules(res.data);
    } catch (err) {
      console.error('Failed to fetch learning modules', err);
    }
  };

  const fetchCertificates = async () => {
    try {
      const res = await api.get('/lms/certificates');
      setCertificates(res.data);
    } catch (err) {
      console.error('Failed to fetch certificates', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/lms/stats');
      setLmsStats(res.data);
    } catch (err) {
      console.error('Failed to fetch LMS stats', err);
    }
  };

  // Onboarding Actions
  const handleToggleTask = async (taskId) => {
    try {
      const res = await api.patch(`/onboarding/tasks/${taskId}/toggle`);
      fetchOnboardingTasks();
    } catch (err) {
      console.error('Error toggling task', err);
    }
  };

  const handleSeedDefaults = async () => {
    setRefreshing(true);
    try {
      await api.post('/onboarding/seed-defaults');
      await fetchOnboardingTasks();
    } catch (err) {
      console.error('Error seeding tasks', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/onboarding/tasks', newTask);
      setShowAddTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        category: 'HR & Compliance',
        due_days: 1,
        priority: 'medium',
      });
      fetchOnboardingTasks();
    } catch (err) {
      console.error('Error creating task', err);
    }
  };

  // Module & Quiz Actions
  const handleOpenModule = async (moduleId) => {
    try {
      const res = await api.get(`/lms/modules/${moduleId}`);
      setSelectedModule(res.data);
      setShowModuleModal(true);
    } catch (err) {
      console.error('Error fetching module detail', err);
    }
  };

  const handleStartQuiz = async (moduleItem) => {
    try {
      const res = await api.get(`/lms/modules/${moduleItem.id}`);
      setQuizModule(res.data.module);
      setQuizQuestions(res.data.questions || []);
      setQuizAnswers({});
      setCurrentQuestionIndex(0);
      setQuizResult(null);
      setShowModuleModal(false);
      setShowQuizModal(true);
    } catch (err) {
      console.error('Error starting quiz', err);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quizModule) return;
    setSubmittingQuiz(true);
    try {
      const res = await api.post(`/lms/modules/${quizModule.id}/submit-quiz`, {
        answers: quizAnswers,
      });
      setQuizResult(res.data);
      fetchModules();
      fetchCertificates();
      fetchStats();
    } catch (err) {
      console.error('Error submitting quiz', err);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Certificate Verification Action
  const handleVerifyCertificate = async (e) => {
    e.preventDefault();
    if (!verifyCodeInput.trim()) return;
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await api.get(`/lms/certificates/verify/${verifyCodeInput.trim()}`);
      setVerificationResult(res.data);
    } catch (err) {
      setVerificationResult({
        valid: false,
        message: err.response?.data?.message || 'Certificate record not found.',
      });
    } finally {
      setVerifying(false);
    }
  };

  // Create Module Action (Admin)
  const handleAddQuestionToNewModule = () => {
    setNewModule((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correct_option: 0,
          explanation: '',
        },
      ],
    }));
  };

  const handleCreateModuleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lms/modules', newModule);
      setShowCreateModuleModal(false);
      fetchModules();
      fetchStats();
    } catch (err) {
      console.error('Error creating module', err);
    }
  };

  // Filters
  const filteredTasks = (onboardingData.tasks || []).filter((task) => {
    const matchesCategory =
      taskCategoryFilter === 'All' || task.category === taskCategoryFilter;
    const matchesStatus =
      taskStatusFilter === 'All'
        ? true
        : taskStatusFilter === 'Completed'
        ? task.is_completed
        : !task.is_completed;
    return matchesCategory && matchesStatus;
  });

  const filteredModules = modules.filter((mod) => {
    const matchesCategory =
      moduleCategoryFilter === 'All' || mod.category === moduleCategoryFilter;
    const matchesSearch =
      mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="content-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} className="spin-icon" style={{ color: 'var(--primary)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading Learning & Onboarding Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-page">
      {/* Top Banner & Hub Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <GraduationCap size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Employee Training & Onboarding LMS</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
              Interactive onboarding checklists, skill modules, completion quizzes, and verified digital certificates.
            </p>
          </div>
        </div>

        {isAdminOrManager && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={handleSeedDefaults} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} style={{ marginRight: '6px' }} />
              Reset Default Tasks
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreateModuleModal(true)}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              Add Course Module
            </button>
          </div>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="dashboard-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Day 1 Onboarding</span>
            <div className="stat-value">{onboardingData.progress_percentage}%</div>
            <span className="stat-subtext">
              {onboardingData.completed_count} of {onboardingData.total_count} tasks completed
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <BookOpen size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Modules Completed</span>
            <div className="stat-value">{lmsStats.completed_modules} / {lmsStats.total_modules}</div>
            <span className="stat-subtext">Available training modules</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <Award size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Certificates Earned</span>
            <div className="stat-value">{lmsStats.certificates_earned}</div>
            <span className="stat-subtext">Official skill accreditations</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fae8ff', color: '#a855f7' }}>
            <Trophy size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Average Quiz Score</span>
            <div className="stat-value">{lmsStats.avg_score}%</div>
            <span className="stat-subtext">Pass threshold is 80%</span>
          </div>
        </div>
      </div>

      {/* LMS Navigation Tabs */}
      <div style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '24px', display: 'flex', gap: '8px' }}>
        <button
          className={`tab-button ${activeTab === 'onboarding' ? 'active' : ''}`}
          onClick={() => setActiveTab('onboarding')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontWeight: '600',
            fontSize: '14px',
            color: activeTab === 'onboarding' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'onboarding' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FileCheck size={18} />
          Day 1 Onboarding Checklist
        </button>

        <button
          className={`tab-button ${activeTab === 'modules' ? 'active' : ''}`}
          onClick={() => setActiveTab('modules')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontWeight: '600',
            fontSize: '14px',
            color: activeTab === 'modules' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'modules' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <BookOpen size={18} />
          Learning Modules & Quizzes
        </button>

        <button
          className={`tab-button ${activeTab === 'certificates' ? 'active' : ''}`}
          onClick={() => setActiveTab('certificates')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontWeight: '600',
            fontSize: '14px',
            color: activeTab === 'certificates' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'certificates' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Award size={18} />
          Certificates Vault ({certificates.length})
        </button>
      </div>

      {/* TAB 1: ONBOARDING CHECKLIST */}
      {activeTab === 'onboarding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Progress Header Card */}
          <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', tracking: '1px', color: '#94a3b8', fontWeight: '600' }}>
                  New Hire Onboarding Tracker
                </span>
                <h2 style={{ color: '#ffffff', margin: '4px 0 8px 0', fontSize: '20px' }}>
                  Welcome aboard, {onboardingData.employee?.full_name || user.name}! 👋
                </h2>
                <p style={{ color: '#cbd5e1', fontSize: '14px', margin: 0 }}>
                  Complete your day-one orientation roadmap to unlock workspace tools and team access.
                </p>
              </div>

              <div style={{ width: '220px', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#e2e8f0' }}>
                  <span>Progress</span>
                  <span style={{ fontWeight: '700', color: '#38bdf8' }}>{onboardingData.progress_percentage}%</span>
                </div>
                <div style={{ height: '10px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${onboardingData.progress_percentage}%`,
                      backgroundColor: '#38bdf8',
                      transition: 'width 0.4s ease',
                      borderRadius: '5px',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'HR & Compliance', 'IT Setup', 'Team & Operations'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTaskCategoryFilter(cat)}
                  className={`btn ${taskCategoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="form-control"
                style={{ padding: '6px 12px', fontSize: '13px', width: '150px' }}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending Only</option>
                <option value="Completed">Completed Only</option>
              </select>

              {isAdminOrManager && (
                <button className="btn btn-primary" onClick={() => setShowAddTaskModal(true)} style={{ padding: '6px 14px', fontSize: '13px' }}>
                  <Plus size={14} style={{ marginRight: '4px' }} />
                  Add Task
                </button>
              )}
            </div>
          </div>

          {/* Tasks List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTasks.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={36} style={{ marginBottom: '10px', color: 'var(--primary)' }} />
                <p>No onboarding tasks found matching the selected filters.</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="card"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    borderLeft: task.is_completed ? '4px solid var(--success)' : '4px solid var(--primary)',
                    backgroundColor: task.is_completed ? '#f8fafc' : '#ffffff',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: task.is_completed ? 'var(--success)' : '#94a3b8',
                        marginTop: '2px',
                        padding: 0,
                      }}
                      title={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {task.is_completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '15px',
                            fontWeight: '600',
                            textDecoration: task.is_completed ? 'line-through' : 'none',
                            color: task.is_completed ? 'var(--text-muted)' : 'var(--text-dark)',
                          }}
                        >
                          {task.title}
                        </h4>
                        <span
                          className="badge"
                          style={{
                            backgroundColor:
                              task.category === 'IT Setup'
                                ? '#e0f2fe'
                                : task.category === 'HR & Compliance'
                                ? '#fef3c7'
                                : '#f3e8ff',
                            color:
                              task.category === 'IT Setup'
                                ? '#0369a1'
                                : task.category === 'HR & Compliance'
                                ? '#b45309'
                                : '#6b21a8',
                            fontSize: '11px',
                            padding: '2px 8px',
                          }}
                        >
                          {task.category}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: task.priority === 'high' ? '#ef4444' : '#64748b',
                            textTransform: 'uppercase',
                          }}
                        >
                          Day {task.due_days} • {task.priority} priority
                        </span>
                      </div>

                      {task.description && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    {task.is_completed ? (
                      <span className="badge badge-success" style={{ fontSize: '12px' }}>
                        Completed
                      </span>
                    ) : (
                      <span className="badge badge-pending" style={{ fontSize: '12px' }}>
                        Action Required
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LEARNING MODULES */}
      {activeTab === 'modules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['All', 'Compliance', 'Security', 'Company Culture'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setModuleCategoryFilter(cat)}
                  className={`btn ${moduleCategoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Modules Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredModules.map((mod) => (
              <div
                key={mod.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px',
                  borderRadius: '14px',
                  borderTop:
                    mod.status === 'completed'
                      ? '4px solid var(--success)'
                      : mod.status === 'failed'
                      ? '4px solid var(--danger)'
                      : '4px solid var(--primary)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className="badge badge-info" style={{ fontSize: '11px' }}>
                      {mod.category}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {mod.content_type === 'video' ? <PlayCircle size={14} /> : <FileText size={14} />}
                      {mod.estimated_minutes} mins
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-dark)' }}>
                    {mod.title}
                  </h3>

                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                    {mod.description}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Quiz: {mod.questions_count} Qs (Pass: {mod.passing_score}%)
                    </span>

                    {mod.status === 'completed' && (
                      <span className="badge badge-success" style={{ fontSize: '11px' }}>
                        Score: {mod.quiz_score}% Passed
                      </span>
                    )}

                    {mod.status === 'failed' && (
                      <span className="badge badge-danger" style={{ fontSize: '11px' }}>
                        Score: {mod.quiz_score}% Failed
                      </span>
                    )}

                    {mod.status === 'not_started' && (
                      <span className="badge badge-pending" style={{ fontSize: '11px' }}>
                        Not Started
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleOpenModule(mod.id)}
                      style={{ flex: 1, padding: '8px', fontSize: '13px', justifyContent: 'center' }}
                    >
                      View Content
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleStartQuiz(mod)}
                      style={{ flex: 1, padding: '8px', fontSize: '13px', justifyContent: 'center' }}
                    >
                      {mod.status === 'completed' ? 'Retake Quiz' : 'Take Quiz'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CERTIFICATES VAULT */}
      {activeTab === 'certificates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Certificate Verification Box */}
          <div className="card" style={{ padding: '20px 24px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>🔍 Verify Official Digital Certificate</h4>
            <form onSubmit={handleVerifyCertificate} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Certificate Code (e.g. CERT-2026-X892)"
                value={verifyCodeInput}
                onChange={(e) => setVerifyCodeInput(e.target.value)}
                style={{ flex: 1, minWidth: '240px', fontSize: '13px' }}
              />
              <button type="submit" className="btn btn-primary" disabled={verifying} style={{ padding: '8px 18px', fontSize: '13px' }}>
                {verifying ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>

            {verificationResult && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: verificationResult.valid ? '#f0fdf4' : '#fef2f2',
                  border: verificationResult.valid ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  color: verificationResult.valid ? '#15803d' : '#b91c1c',
                  fontSize: '13px',
                }}
              >
                {verificationResult.valid ? (
                  <div>
                    <strong>✅ Official Verified Certificate:</strong> Issued to{' '}
                    <u>{verificationResult.certificate.employee_name}</u> for passing course{' '}
                    <strong>"{verificationResult.certificate.course_title}"</strong> with score{' '}
                    <strong>{verificationResult.certificate.score}%</strong> on{' '}
                    {new Date(verificationResult.certificate.issued_at).toLocaleDateString()}.
                  </div>
                ) : (
                  <div>❌ {verificationResult.message}</div>
                )}
              </div>
            )}
          </div>

          {/* Certificates Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {certificates.length === 0 ? (
              <div className="card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Award size={40} style={{ marginBottom: '12px', color: 'var(--primary)' }} />
                <h3>No Certificates Earned Yet</h3>
                <p>Pass any course completion quiz with an 80%+ score to earn your accredited digital certificate.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveTab('modules')}
                  style={{ marginTop: '12px', display: 'inline-flex' }}
                >
                  Browse Training Modules
                </button>
              </div>
            ) : (
              certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="card"
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '2px solid #e2e8f0',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      width: '60px',
                      height: '60px',
                      background: 'radial-gradient(circle, #fef08a 0%, #eab308 100%)',
                      borderRadius: '50%',
                      opacity: 0.2,
                    }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: '#fef3c7',
                        color: '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Award size={24} />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '700', letterSpacing: '0.5px' }}>
                        ACCREDITED CERTIFICATE
                      </span>
                      <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-dark)' }}>{cert.course_title}</h4>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    <div>
                      <strong>Issued to:</strong> {cert.employee_name}
                    </div>
                    <div>
                      <strong>Score:</strong> {cert.score}% • <strong>Issued:</strong>{' '}
                      {new Date(cert.issued_at).toLocaleDateString()}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', marginTop: '4px', color: 'var(--primary)' }}>
                      Code: {cert.certificate_code}
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedCert(cert);
                      setShowCertModal(true);
                    }}
                    style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}
                  >
                    View & Print Certificate
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODULE DETAIL CONTENT MODAL */}
      {showModuleModal && selectedModule && (
        <div className="modal-backdrop" onClick={() => setShowModuleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '90%' }}>
            <div className="modal-header">
              <h3>{selectedModule.module.title}</h3>
              <button className="close-btn" onClick={() => setShowModuleModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <span className="badge badge-info">{selectedModule.module.category}</span>
                <span className="badge badge-secondary">{selectedModule.module.estimated_minutes} min read</span>
                <span className="badge badge-warning">Pass Score: {selectedModule.module.passing_score}%</span>
              </div>

              {selectedModule.module.content_type === 'video' && selectedModule.module.content_url && (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, marginBottom: '20px', borderRadius: '12px', overflow: 'hidden' }}>
                  <iframe
                    src={selectedModule.module.content_url}
                    title={selectedModule.module.title}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allowFullScreen
                  />
                </div>
              )}

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  padding: '20px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-line',
                }}
              >
                {selectedModule.module.document_text || selectedModule.module.description}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-secondary" onClick={() => setShowModuleModal(false)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => handleStartQuiz(selectedModule.module)}>
                Proceed to Quiz ({selectedModule.questions?.length || 0} Questions)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ INTERACTIVE MODAL */}
      {showQuizModal && quizModule && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '640px', width: '90%' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Quiz: {quizModule.title}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Minimum Passing Score: {quizModule.passing_score}%
                </span>
              </div>
              {!quizResult && (
                <button className="close-btn" onClick={() => setShowQuizModal(false)}>
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="modal-body">
              {!quizResult ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px', color: 'var(--text-muted)' }}>
                    <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                    <span>Score needed: {quizModule.passing_score}%</span>
                  </div>

                  {quizQuestions[currentQuestionIndex] && (
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                        {quizQuestions[currentQuestionIndex].question}
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {quizQuestions[currentQuestionIndex].options.map((opt, optIdx) => {
                          const isSelected = quizAnswers[quizQuestions[currentQuestionIndex].id] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleAnswerSelect(quizQuestions[currentQuestionIndex].id, optIdx)}
                              style={{
                                textAlign: 'left',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                backgroundColor: isSelected ? 'var(--primary-light)' : '#ffffff',
                                color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                                fontWeight: isSelected ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              {String.fromCharCode(65 + optIdx)}. {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Quiz Results View */
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      margin: '0 auto 16px auto',
                      backgroundColor: quizResult.passed ? '#d1fae5' : '#fee2e2',
                      color: quizResult.passed ? '#059669' : '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {quizResult.passed ? <Trophy size={36} /> : <AlertCircle size={36} />}
                  </div>

                  <h2 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 6px 0' }}>
                    {quizResult.passed ? '🎉 Congratulations! You Passed!' : 'Quiz Attempt Failed'}
                  </h2>

                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                    Your Score: <strong style={{ fontSize: '18px', color: quizResult.passed ? 'var(--success)' : 'var(--danger)' }}>{quizResult.score}%</strong> (Required: {quizResult.passing_score}%)
                  </p>

                  <div style={{ textAlign: 'left', maxHeight: '240px', overflowY: 'auto', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Question Breakdown</h5>
                    {quizResult.breakdown.map((item, idx) => (
                      <div key={idx} style={{ marginBottom: '12px', fontSize: '13px' }}>
                        <div style={{ fontWeight: '600', color: item.is_correct ? 'var(--success)' : 'var(--danger)' }}>
                          {idx + 1}. {item.question} {item.is_correct ? '✓ Correct' : '✗ Incorrect'}
                        </div>
                        {item.explanation && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                            {item.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {quizResult.passed && quizResult.certificate && (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedCert(quizResult.certificate);
                        setShowQuizModal(false);
                        setShowCertModal(true);
                      }}
                      style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                    >
                      <Award size={18} style={{ marginRight: '8px' }} />
                      View Generated Certificate
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              {!quizResult ? (
                <>
                  <button
                    className="btn btn-secondary"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  >
                    Previous
                  </button>

                  {currentQuestionIndex < quizQuestions.length - 1 ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={handleSubmitQuiz}
                      disabled={submittingQuiz}
                    >
                      {submittingQuiz ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                  )}
                </>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowQuizModal(false)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Close Quiz Window
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE DIGITAL CERTIFICATE MODAL */}
      {showCertModal && selectedCert && (
        <div className="modal-backdrop" onClick={() => setShowCertModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', width: '95%', padding: '0', background: 'transparent' }}>
            {/* Certificate Canvas Box */}
            <div
              id="printable-certificate"
              style={{
                backgroundColor: '#ffffff',
                border: '12px solid #1e293b',
                outline: '3px solid #d97706',
                outlineOffset: '-8px',
                padding: '40px 30px',
                textAlign: 'center',
                fontFamily: 'serif',
                position: 'relative',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                borderRadius: '8px',
              }}
            >
              {/* Corner Embellishments */}
              <div style={{ position: 'absolute', top: '15px', left: '15px', fontSize: '20px', color: '#d97706' }}>⚜</div>
              <div style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '20px', color: '#d97706' }}>⚜</div>
              <div style={{ position: 'absolute', bottom: '15px', left: '15px', fontSize: '20px', color: '#d97706' }}>⚜</div>
              <div style={{ position: 'absolute', bottom: '15px', right: '15px', fontSize: '20px', color: '#d97706' }}>⚜</div>

              <div style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '4px', color: '#64748b', fontFamily: 'sans-serif', fontWeight: '700' }}>
                Apex Employee Management System
              </div>

              <h1 style={{ fontSize: '32px', fontFamily: 'Outfit, serif', fontWeight: '800', color: '#0f172a', margin: '10px 0 0 0' }}>
                CERTIFICATE OF COMPLETION
              </h1>

              <div style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 24px 0', fontFamily: 'sans-serif' }}>
                This official accreditation certifies that
              </div>

              <div style={{ fontSize: '28px', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 'bold', color: '#0284c7', borderBottom: '2px solid #cbd5e1', display: 'inline-block', paddingBottom: '4px', paddingLeft: '24px', paddingRight: '24px', marginBottom: '20px' }}>
                {selectedCert.employee_name}
              </div>

              <div style={{ fontSize: '14px', color: '#475569', fontFamily: 'sans-serif', lineHeight: '1.6', maxWidth: '520px', margin: '0 auto 24px auto' }}>
                has successfully completed the mandatory corporate training module on
                <br />
                <strong style={{ fontSize: '18px', color: '#0f172a' }}>"{selectedCert.course_title}"</strong>
                <br />
                demonstrating competency with a quiz score of <strong>{selectedCert.score}%</strong>.
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '30px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1', fontFamily: 'sans-serif' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Date Issued</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    {new Date(selectedCert.issued_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px double #d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                  <Award size={32} />
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Certificate Verification Code</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'monospace', color: '#0284c7' }}>
                    {selectedCert.certificate_code}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setShowCertModal(false)} style={{ backgroundColor: '#ffffff' }}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Printer size={16} />
                Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CREATE MODULE MODAL */}
      {showCreateModuleModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModuleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '90%' }}>
            <div className="modal-header">
              <h3>Create Learning Module & Quiz</h3>
              <button className="close-btn" onClick={() => setShowCreateModuleModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateModuleSubmit}>
              <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Course Title</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={newModule.title}
                    onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                    placeholder="e.g. Workplace Safety & Emergency Guidelines"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    required
                    value={newModule.description}
                    onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={newModule.category}
                      onChange={(e) => setNewModule({ ...newModule, category: e.target.value })}
                    >
                      <option value="Compliance">Compliance</option>
                      <option value="Security">Security</option>
                      <option value="Company Culture">Company Culture</option>
                      <option value="Technical Skills">Technical Skills</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Content Type</label>
                    <select
                      className="form-control"
                      value={newModule.content_type}
                      onChange={(e) => setNewModule({ ...newModule, content_type: e.target.value })}
                    >
                      <option value="document">Document Reader</option>
                      <option value="video">Video Embed</option>
                    </select>
                  </div>
                </div>

                {newModule.content_type === 'video' ? (
                  <div className="form-group">
                    <label className="form-label">Video Embed URL</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newModule.content_url}
                      onChange={(e) => setNewModule({ ...newModule, content_url: e.target.value })}
                      placeholder="https://www.youtube.com/embed/..."
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Document Content (Markdown / Text)</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={newModule.document_text}
                      onChange={(e) => setNewModule({ ...newModule, document_text: e.target.value })}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Estimated Minutes</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newModule.estimated_minutes}
                      onChange={(e) => setNewModule({ ...newModule, estimated_minutes: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Passing Score (%)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newModule.passing_score}
                      onChange={(e) => setNewModule({ ...newModule, passing_score: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>Quiz Questions ({newModule.questions.length})</h4>
                    <button type="button" className="btn btn-secondary" onClick={handleAddQuestionToNewModule} style={{ padding: '4px 10px', fontSize: '12px' }}>
                      + Add Question
                    </button>
                  </div>

                  {newModule.questions.map((q, qIdx) => (
                    <div key={qIdx} style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={`Question ${qIdx + 1} text`}
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...newModule.questions];
                            updated[qIdx].question = e.target.value;
                            setNewModule({ ...newModule, questions: updated });
                          }}
                          required
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                        {q.options.map((opt, oIdx) => (
                          <input
                            key={oIdx}
                            type="text"
                            className="form-control"
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            value={opt}
                            onChange={(e) => {
                              const updated = [...newModule.questions];
                              updated[qIdx].options[oIdx] = e.target.value;
                              setNewModule({ ...newModule, questions: updated });
                            }}
                            required
                          />
                        ))}
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Correct Option Index (0 = A, 1 = B, 2 = C, 3 = D)</label>
                        <select
                          className="form-control"
                          value={q.correct_option}
                          onChange={(e) => {
                            const updated = [...newModule.questions];
                            updated[qIdx].correct_option = parseInt(e.target.value);
                            setNewModule({ ...newModule, questions: updated });
                          }}
                        >
                          <option value={0}>Option A</option>
                          <option value={1}>Option B</option>
                          <option value={2}>Option C</option>
                          <option value={3}>Option D</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModuleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ADD TASK MODAL */}
      {showAddTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowAddTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Add Onboarding Checklist Task</h3>
              <button className="close-btn" onClick={() => setShowAddTaskModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Task Title</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={newTask.category}
                      onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    >
                      <option value="HR & Compliance">HR & Compliance</option>
                      <option value="IT Setup">IT Setup</option>
                      <option value="Team & Operations">Team & Operations</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Due Day</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={newTask.due_days}
                      onChange={(e) => setNewTask({ ...newTask, due_days: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningLms;
