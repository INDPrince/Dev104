import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Edit, Trash2, Upload, ArrowUp, ArrowDown, LogOut, BookOpen, Settings, GraduationCap, RefreshCw, Eye, Flag, Shield, Menu, X, Database, Library, Palette } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { getAllSubjects, getChaptersBySubject, createSubject, createChapter, updateChapter, deleteSubject, deleteChapter, uploadQuestions, reorderChapters, updateAdminCredentials, getAdminCredentials, getAllReports, getQuestionsByChapter, getAllClasses, createClass, updateClass, deleteClass, reorderClasses, getWordMeaningSubjects, getWordMeaningChapters, getWordMeaningPages, createWordMeaningSubject, createWordMeaningChapter, createWordMeaningPage, deleteWordMeaningSubject, deleteWordMeaningChapter, deleteWordMeaningPage, uploadWordMeaningQuestions } from '../firebase/services';
import { toast } from '../hooks/use-toast';
import { PREDEFINED_THEMES, getThemeById, createCustomTheme } from '../config/themes';
import { generateClassIcon } from '../utils/iconGenerator';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialogs
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showChapterDialog, setShowChapterDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showClassDialog, setShowClassDialog] = useState(false);
  
  // Forms
  const [subjectName, setSubjectName] = useState('');
  const [chapterForm, setChapterForm] = useState({ name: '', timer: 30 });
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [jsonFile, setJsonFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'paste'
  const [pastedJson, setPastedJson] = useState('');
  const [settingsForm, setSettingsForm] = useState({ email: '', password: '', confirmPassword: '', cacheVersion: '1.0.0' });
  const [selectedClass, setSelectedClass] = useState(() => {
    // Load last selected class from localStorage
    return localStorage.getItem('adminSelectedClass') || '11th';
  });
  const [availableClasses, setAvailableClasses] = useState([]);
  const [classForm, setClassForm] = useState({ 
    name: '', 
    theme: PREDEFINED_THEMES[0],
    customHex: ''
  });
  const [editingClass, setEditingClass] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(PREDEFINED_THEMES[0]);
  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [updateMode, setUpdateMode] = useState('upload'); // 'upload' or 'update'
  const [isUploading, setIsUploading] = useState(false);
  const [showKeywordsHelp, setShowKeywordsHelp] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Reports
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  
  // Total stats for dashboard
  const [totalChapters, setTotalChapters] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // Tab management (Regular Quiz vs Word Meaning)
  const [activeTab, setActiveTab] = useState('regular'); // 'regular' or 'wordMeaning'
  
  // Word Meaning states
  const [wmSubjects, setWmSubjects] = useState([]);
  const [selectedWmSubject, setSelectedWmSubject] = useState(null);
  const [wmChapters, setWmChapters] = useState([]);
  const [selectedWmChapter, setSelectedWmChapter] = useState(null);
  const [wmPages, setWmPages] = useState([]);
  const [selectedWmPage, setSelectedWmPage] = useState(null);
  
  // Word Meaning dialogs
  const [showWmSubjectDialog, setShowWmSubjectDialog] = useState(false);
  const [showWmChapterDialog, setShowWmChapterDialog] = useState(false);
  const [showWmPageDialog, setShowWmPageDialog] = useState(false);
  const [showWmUploadDialog, setShowWmUploadDialog] = useState(false);
  
  // Word Meaning forms
  const [wmSubjectForm, setWmSubjectForm] = useState({ name: '', class: '11th' });
  const [wmChapterForm, setWmChapterForm] = useState({ name: '', serial: 1 });
  const [wmPageForm, setWmPageForm] = useState({ pageNumber: 1, name: '' });

  useEffect(() => {
    // Check auth
    const isAuth = localStorage.getItem('adminAuth');
    if (!isAuth) {
      navigate('/admin/login');
      return;
    }
    loadSubjects();
    loadReportCount();
    loadClasses();
    
    // Handle report update from AdminReports page
    if (location.state?.openReportUpdate && location.state?.reportData) {
      handleReportUpdate(location.state.reportData);
      // Clear the location state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [navigate, selectedClass]);
  
  const loadClasses = async () => {
    const classes = await getAllClasses();
    setAvailableClasses(classes);
  };

  // Save selected class to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminSelectedClass', selectedClass);
  }, [selectedClass]);

  const loadSubjects = async () => {
    setLoading(true);
    const data = await getAllSubjects();
    // Filter by selected class
    const filteredData = data.filter(s => s.class === selectedClass || !s.class);
    
    // Load total chapters and questions for stats - ONLY FOR SELECTED CLASS
    let allChapters = [];
    let allQuestionsCount = 0;
    
    // Update each subject's totalChapters count
    const updatedFilteredData = await Promise.all(filteredData.map(async (subject) => {
      const subjectChapters = await getChaptersBySubject(subject.id);
      allChapters = [...allChapters, ...subjectChapters];
      
      for (const chapter of subjectChapters) {
        allQuestionsCount += chapter.questionCount || 0;
      }
      
      return {
        ...subject,
        totalChapters: subjectChapters.length
      };
    }));
    
    setSubjects(updatedFilteredData);
    setTotalChapters(allChapters.length);
    setTotalQuestions(allQuestionsCount);
    
    setLoading(false);
  };

  const loadChapters = async (subjectId) => {
    const data = await getChaptersBySubject(subjectId);
    setChapters(data);
  };


  const loadReportCount = async () => {
    try {
      const allReports = await getAllReports();
      
      if (!Array.isArray(allReports)) {
        console.error('Invalid reports data');
        setPendingReportsCount(0);
        return;
      }
      
      // Group pending reports by question to get unique count
      const pendingReports = allReports.filter(r => r.status === 'pending');
      const uniquePendingGroups = {};
      
      pendingReports.forEach(report => {
        const cleanQuestionText = (text) => {
          if (!text) return '';
          let cleaned = text.replace(/!u\s*/gi, '').replace(/\s*!u/gi, '');
          cleaned = cleaned.replace(/!b/gi, '_____');
          return cleaned;
        };
        
        const cleanedQuestion = cleanQuestionText(report.questionText || '');
        const key = `${report.questionId}_${cleanedQuestion}`;
        
        if (!uniquePendingGroups[key]) {
          uniquePendingGroups[key] = true;
        }
      });
      
      const pendingCount = Object.keys(uniquePendingGroups).length;
      setPendingReportsCount(pendingCount);
    } catch (error) {
      console.error('Error loading report count:', error);
      setPendingReportsCount(0);
    }
  };

  const handleReportUpdate = async (reportData) => {
    // Load the question and prepare for update
    const questions = await getQuestionsByChapter(reportData.chapterId);
    const question = questions.find(q => q.id === reportData.questionId);
    
    if (question) {
      // Find subject and chapter
      const allSubjects = await getAllSubjects();
      for (const subject of allSubjects) {
        const subjectChapters = await getChaptersBySubject(subject.id);
        const matchingChapter = subjectChapters.find(ch => ch.id === reportData.chapterId);
        if (matchingChapter) {
          setSelectedSubject(subject);
          setChapters(subjectChapters);
          setSelectedChapter(matchingChapter);
          // Include all fields from question including remarks and verified status
          const questionData = { 
            question: question.question, 
            answer: question.answer, 
            options: question.options 
          };
          if (question.verified) {
            questionData.verified = true;
          }
          // Include remarks if present
          if (question.remarks) {
            questionData.remarks = question.remarks;
          }
          setPastedJson(JSON.stringify({ 
            questions: [questionData] 
          }, null, 2));
          setUpdateMode('update');
          setUploadMode('paste');
          setShowUploadDialog(true);
          break;
        }
      }
    }
  };

  // Word Meaning Functions
  const loadWmSubjects = async () => {
    const data = await getWordMeaningSubjects();
    // Filter by selected class
    const filteredData = data.filter(s => s.class === selectedClass || !s.class);
    
    // Update each subject's totalChapters count
    const updatedData = await Promise.all(filteredData.map(async (subject) => {
      const subjectChapters = await getWordMeaningChapters(subject.id);
      return {
        ...subject,
        totalChapters: subjectChapters.length
      };
    }));
    
    setWmSubjects(updatedData);
  };

  const loadWmChapters = async (subjectId) => {
    const data = await getWordMeaningChapters(subjectId);
    setWmChapters(data);
  };

  const loadWmPages = async (chapterId) => {
    const data = await getWordMeaningPages(chapterId);
    setWmPages(data);
  };

  const handleCreateWmSubject = async () => {
    if (!wmSubjectForm.name.trim()) return;
    
    const result = await createWordMeaningSubject({ 
      name: wmSubjectForm.name, 
      totalChapters: 0,
      class: wmSubjectForm.class
    });
    if (result.success) {
      toast({ 
        title: '✅ Success', 
        description: `Word Meaning Subject "${wmSubjectForm.name}" created successfully`,
        className: 'bg-emerald-50 border-emerald-200',
      });
      setShowWmSubjectDialog(false);
      setWmSubjectForm({ name: '', class: selectedClass });
      loadWmSubjects();
    }
  };

  const handleCreateWmChapter = async () => {
    if (!wmChapterForm.name.trim() || !selectedWmSubject) return;
    
    const serial = wmChapters.length + 1;
    const result = await createWordMeaningChapter(selectedWmSubject.id, {
      name: wmChapterForm.name,
      serial: wmChapterForm.serial || serial,
      totalPages: 0
    });
    
    if (result.success) {
      toast({ 
        title: '✅ Success', 
        description: `Word Meaning Chapter "${wmChapterForm.name}" created successfully`,
        className: 'bg-emerald-50 border-emerald-200',
      });
      setShowWmChapterDialog(false);
      setWmChapterForm({ name: '', serial: 1 });
      loadWmChapters(selectedWmSubject.id);
    }
  };

  const handleCreateWmPage = async () => {
    if (!wmPageForm.pageNumber || !selectedWmChapter) return;
    
    const result = await createWordMeaningPage(selectedWmChapter.id, {
      pageNumber: parseInt(wmPageForm.pageNumber),
      name: wmPageForm.name || `Page ${wmPageForm.pageNumber}`,
      questionCount: 0
    });
    
    if (result.success) {
      toast({ 
        title: '✅ Success', 
        description: `Word Meaning Page ${wmPageForm.pageNumber} created successfully`,
        className: 'bg-emerald-50 border-emerald-200',
      });
      setShowWmPageDialog(false);
      setWmPageForm({ pageNumber: 1, name: '' });
      loadWmPages(selectedWmChapter.id);
    }
  };

  const handleUploadWmQuestions = async () => {
    if (!selectedWmPage) return;
    
    setIsUploading(true);
    
    try {
      let json;
      
      if (uploadMode === 'file') {
        if (!jsonFile) {
          setIsUploading(false);
          return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const json = JSON.parse(e.target.result);
            const questions = json.questions || [];
            
            if (!Array.isArray(questions) || questions.length === 0) {
              toast({ title: 'Error', description: 'Invalid JSON format', variant: 'destructive' });
              setIsUploading(false);
              return;
            }
            
            const result = await uploadWordMeaningQuestions(selectedWmPage.id, questions);
            if (result.success) {
              toast({ 
                title: '✅ Success', 
                description: `${questions.length} questions uploaded successfully`,
                className: 'bg-emerald-50 border-emerald-200',
              });
              setShowWmUploadDialog(false);
              setJsonFile(null);
              setPastedJson('');
              setSelectedWmPage(null);
              if (selectedWmChapter) {
                loadWmPages(selectedWmChapter.id);
              }
            }
            setIsUploading(false);
          } catch (error) {
            toast({ title: '❌ Error', description: 'Failed to parse JSON', variant: 'destructive' });
            setIsUploading(false);
          }
        };
        reader.readAsText(jsonFile);
      } else {
        // Paste mode
        if (!pastedJson.trim()) {
          setIsUploading(false);
          return;
        }
        
        json = JSON.parse(pastedJson);
        const questions = json.questions || [];
        
        if (!Array.isArray(questions) || questions.length === 0) {
          toast({ title: 'Error', description: 'Invalid JSON format', variant: 'destructive' });
          setIsUploading(false);
          return;
        }
        
        const result = await uploadWordMeaningQuestions(selectedWmPage.id, questions);
        if (result.success) {
          toast({ 
            title: '✅ Success', 
            description: `${questions.length} questions uploaded successfully`,
            className: 'bg-emerald-50 border-emerald-200',
          });
          setShowWmUploadDialog(false);
          setJsonFile(null);
          setPastedJson('');
          setSelectedWmPage(null);
          if (selectedWmChapter) {
            loadWmPages(selectedWmChapter.id);
          }
        }
        setIsUploading(false);
      }
    } catch (error) {
      toast({ title: '❌ Error', description: 'Failed to parse JSON', variant: 'destructive' });
      setIsUploading(false);
    }
  };

  const handleDeleteWmSubject = async (subject) => {
    if (!window.confirm(`Delete word meaning subject "${subject.name}"? This will delete all chapters and questions.`)) return;
    
    const result = await deleteWordMeaningSubject(subject.id);
    if (result.success) {
      toast({ 
        title: '✅ Success', 
        description: `Word Meaning Subject "${subject.name}" deleted`,
        className: 'bg-emerald-50 border-emerald-200',
      });
      if (selectedWmSubject?.id === subject.id) {
        setSelectedWmSubject(null);
        setWmChapters([]);
        setWmPages([]);
      }
      loadWmSubjects();
    }
  };

  const handleDeleteWmChapter = async (chapter) => {
    if (!window.confirm(`Delete word meaning chapter "${chapter.name}"?`)) return;
    
    const result = await deleteWordMeaningChapter(selectedWmSubject.id, chapter.id);
    if (result.success) {
      toast({ 
        title: '✅ Success', 
        description: `Word Meaning Chapter "${chapter.name}" deleted`,
        className: 'bg-emerald-50 border-emerald-200',
      });
      if (selectedWmChapter?.id === chapter.id) {
        setSelectedWmChapter(null);
        setWmPages([]);
      }
      loadWmChapters(selectedWmSubject.id);
    }
  };

  const handleDeleteWmPage = async (page) => {
    if (!window.confirm(`Delete word meaning page ${page.pageNumber}?`)) return;
    
    const result = await deleteWordMeaningPage(selectedWmChapter.id, page.id);
    if (result.success) {
      toast({ 
        title: '✅ Success', 
        description: `Word Meaning Page ${page.pageNumber} deleted`,
        className: 'bg-emerald-50 border-emerald-200',
      });
      loadWmPages(selectedWmChapter.id);
    }
  };

  // Load Word Meaning data when tab changes
  useEffect(() => {
    if (activeTab === 'wordMeaning') {
      loadWmSubjects();
    }
  }, [activeTab, selectedClass]);



  const handleCreateSubject = async () => {
    if (!subjectName.trim()) return;
    
    const result = await createSubject({ 
      name: subjectName, 
      totalChapters: 0,
      class: selectedClass // Add class to subject
    });
    if (result.success) {
      toast({ 
        title: '✅ Success', 
        description: `Subject "${subjectName}" created successfully`,
        className: 'bg-emerald-50 border-emerald-200',
      });
      setShowSubjectDialog(false);
      setSubjectName('');
      loadSubjects();
    }
  };

  const handleCreateChapter = async () => {
    if (!chapterForm.name.trim() || !selectedSubject) return;
    
    const serial = chapters.length + 1;
    const result = await createChapter(selectedSubject.id, {
      name: chapterForm.name,
      timer: parseInt(chapterForm.timer),
      serial,
      questionCount: 0
    });
    
    if (result.success) {
      toast({ 
        title: '✅ Success', 
        description: `Chapter "${chapterForm.name}" created successfully`,
        className: 'bg-emerald-50 border-emerald-200',
      });
      setShowChapterDialog(false);
      setChapterForm({ name: '', timer: 30 });
      loadChapters(selectedSubject.id);
    }
  };

  const handleDeleteSubject = async (subject) => {
    if (!window.confirm(`Delete subject "${subject.name}"? This will delete all chapters and questions.`)) return;
    
    const result = await deleteSubject(subject.id);
    if (result.success) {
      toast({ 
        title: '✅ Success', 
        description: `Subject "${subject.name}" deleted`,
        className: 'bg-emerald-50 border-emerald-200',
      });
      if (selectedSubject?.id === subject.id) {
        setSelectedSubject(null);
        setChapters([]);
      }
      loadSubjects();
    }
  };

  const handleDeleteChapter = async (chapter) => {
    if (!window.confirm(`Delete chapter "${chapter.name}"?`)) return;
    
    const result = await deleteChapter(selectedSubject.id, chapter.id);
    if (result.success) {
      toast({ 
        title: '✅ Success', 
        description: `Chapter "${chapter.name}" deleted`,
        className: 'bg-emerald-50 border-emerald-200',
      });
      loadChapters(selectedSubject.id);
    }
  };

  const handleMoveChapter = async (index, direction) => {
    const newChapters = [...chapters];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newChapters.length) return;
    
    // Swap
    [newChapters[index], newChapters[targetIndex]] = [newChapters[targetIndex], newChapters[index]];
    
    // Update serials
    const result = await reorderChapters(selectedSubject.id, newChapters);
    if (result.success) {
      setChapters(newChapters);
      toast({ 
        title: '✅ Success', 
        description: 'Chapter reordered successfully',
        className: 'bg-emerald-50 border-emerald-200',
      });
    }
  };

  const handleUploadQuestions = async () => {
    if (!selectedChapter) return;
    
    setIsUploading(true);
    
    try {
      let json;
      
      if (uploadMode === 'file') {
        if (!jsonFile) {
          setIsUploading(false);
          return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const json = JSON.parse(e.target.result);
            const questions = json.questions || [];
            
            if (!Array.isArray(questions) || questions.length === 0) {
              toast({ title: 'Error', description: 'Invalid JSON format', variant: 'destructive' });
              setIsUploading(false);
              return;
            }
            
            const result = await uploadQuestions(selectedChapter.id, questions, updateMode === 'update');
            if (result.success) {
              const action = updateMode === 'update' ? 'updated' : 'uploaded';
              toast({ 
                title: '✅ Success', 
                description: `${questions.length} questions ${action} successfully`,
                className: 'bg-emerald-50 border-emerald-200',
              });
              setShowUploadDialog(false);
              setJsonFile(null);
              setPastedJson('');
              setUpdateMode('upload');
              setSelectedChapter(null);
              if (selectedSubject) {
                loadChapters(selectedSubject.id);
              }
              // Reload reports count
              loadReportCount();
            }
            setIsUploading(false);
          } catch (error) {
            toast({ title: '❌ Error', description: 'Failed to parse JSON', variant: 'destructive' });
            setIsUploading(false);
          }
        };
        reader.readAsText(jsonFile);
      } else {
        // Paste mode
        if (!pastedJson.trim()) {
          setIsUploading(false);
          return;
        }
        
        json = JSON.parse(pastedJson);
        const questions = json.questions || [];
        
        if (!Array.isArray(questions) || questions.length === 0) {
          toast({ title: 'Error', description: 'Invalid JSON format', variant: 'destructive' });
          setIsUploading(false);
          return;
        }
        
        const result = await uploadQuestions(selectedChapter.id, questions, updateMode === 'update');
        if (result.success) {
          const action = updateMode === 'update' ? 'updated' : 'uploaded';
          toast({ 
            title: '✅ Success', 
            description: `${questions.length} questions ${action} successfully`,
            className: 'bg-emerald-50 border-emerald-200',
          });
          setShowUploadDialog(false);
          setJsonFile(null);
          setPastedJson('');
          setUpdateMode('upload');
          setSelectedChapter(null);
          if (selectedSubject) {
            loadChapters(selectedSubject.id);
          }
          // Reload reports count
          loadReportCount();
        }
        setIsUploading(false);
      }
    } catch (error) {
      toast({ title: '❌ Error', description: 'Failed to parse JSON', variant: 'destructive' });
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    loadChapters(subject.id);
  };

  const handleOpenSettings = async () => {
    const creds = await getAdminCredentials();
    setSettingsForm({ email: creds.email, password: '', confirmPassword: '' });
    setShowSettingsDialog(true);
  };

  const handleUpdateCredentials = async () => {
    if (settingsForm.password && settingsForm.password !== settingsForm.confirmPassword) {
      toast({ title: '❌ Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    
    if (!settingsForm.email.trim()) {
      toast({ title: '❌ Error', description: 'Email is required', variant: 'destructive' });
      return;
    }
    
    const result = await updateAdminCredentials(
      settingsForm.email,
      settingsForm.password || (await getAdminCredentials()).password
    );
    
    if (result.success) {
      toast({ 
        title: '✅ Success', 
        description: 'Admin credentials updated successfully',
        className: 'bg-emerald-50 border-emerald-200',
      });
      setShowSettingsDialog(false);
    } else {
      toast({ title: '❌ Error', description: 'Failed to update credentials', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  <span className="hidden sm:inline">Admin Dashboard</span>
                  <span className="sm:hidden">Admin</span>
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Manage quiz content</p>
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {/* Refresh Icon - LEFT of Class Selector */}
              <button
                onClick={() => {
                  loadSubjects();
                  loadReportCount();
                }}
                className="p-2 bg-white border-2 border-emerald-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-400 transition-all shadow-sm"
                title="Refresh Data"
              >
                <RefreshCw className="w-5 h-5 text-emerald-600" />
              </button>
              
              {/* Class Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-emerald-200 rounded-lg hover:border-emerald-400 transition-all shadow-sm"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-sm text-gray-700">{selectedClass}</span>
                </button>
                
                {isClassDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-emerald-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {availableClasses.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => {
                          setSelectedClass(cls.name);
                          setSelectedSubject(null);
                          setChapters([]);
                          setIsClassDropdownOpen(false);
                          setLoading(true);
                          setTimeout(() => setLoading(false), 300);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-emerald-50 transition-colors ${
                          selectedClass === cls.name ? 'bg-emerald-100 font-semibold' : ''
                        }`}
                      >
                        {cls.name}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setIsClassDropdownOpen(false);
                        setShowClassDialog(true);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors border-t border-emerald-100 text-blue-600 font-medium"
                    >
                      + Manage Classes
                    </button>
                  </div>
                )}
              </div>
              
              {/* Desktop Buttons (hidden on mobile) */}
              <div className="hidden lg:flex gap-2">
                {/* Word Meaning Button - Icon Only */}
                <button
                  onClick={() => navigate('/admin/word-meaning')}
                  className="p-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg hover:from-pink-600 hover:to-rose-700 transition-all shadow-sm flex items-center gap-2"
                  title="Word Meaning Management"
                >
                  <Library className="w-5 h-5" />
                </button>
                
                {/* Database Manager Button - Icon Only */}
                <button
                  onClick={() => navigate('/admin/database')}
                  className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm flex items-center gap-2"
                  title="Database Manager"
                >
                  <Database className="w-5 h-5" />
                </button>
                
                {/* Reports Button - Icon Only */}
                <button
                  onClick={() => navigate('/admin/reports')}
                  className="p-2 bg-orange-50 border-2 border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 transition-all shadow-sm relative"
                  title="Reports"
                >
                  <Flag className="w-5 h-5 text-orange-600" />
                  {pendingReportsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingReportsCount}
                    </span>
                  )}
                </button>
                
                {/* Settings Button */}
                <button
                  onClick={handleOpenSettings}
                  className="p-2 bg-white border-2 border-emerald-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-400 transition-all shadow-sm"
                  title="Settings"
                >
                  <Settings className="w-5 h-5 text-emerald-600" />
                </button>
                
                {/* View Quiz Button */}
                <button
                  onClick={() => navigate('/')}
                  className="p-2 bg-white border-2 border-emerald-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-400 transition-all shadow-sm"
                  title="View Quiz"
                >
                  <Eye className="w-5 h-5 text-emerald-600" />
                </button>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 bg-white border-2 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                </button>
              </div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all shadow-sm"
              >
                <Menu className="w-5 h-5 text-emerald-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 lg:hidden transform transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600">
          <h2 className="font-bold text-lg text-white">Menu</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => {
                navigate('/admin/word-meaning');
                setIsSidebarOpen(false);
              }}
              className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg hover:bg-pink-50 transition-colors border-2 border-pink-100"
            >
              <Library className="w-5 h-5 text-pink-600" />
              <span className="text-xs font-medium text-gray-700 text-center">Word Meaning</span>
            </button>
            
            <button
              onClick={() => {
                navigate('/admin/database');
                setIsSidebarOpen(false);
              }}
              className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg hover:bg-purple-50 transition-colors border-2 border-purple-100"
            >
              <Database className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-medium text-gray-700 text-center">Database</span>
            </button>
            
            <button
              onClick={() => {
                navigate('/admin/reports');
                setIsSidebarOpen(false);
              }}
              className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg hover:bg-orange-50 transition-colors border-2 border-orange-100 relative"
            >
              <Flag className="w-5 h-5 text-orange-600" />
              <span className="text-xs font-medium text-gray-700 text-center">Reports</span>
              {pendingReportsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingReportsCount}
                </span>
              )}
            </button>
            
            <button
              onClick={() => {
                handleOpenSettings();
                setIsSidebarOpen(false);
              }}
              className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg hover:bg-emerald-50 transition-colors border-2 border-emerald-100"
            >
              <Settings className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-medium text-gray-700 text-center">Settings</span>
            </button>
            
            <button
              onClick={() => {
                navigate('/');
                setIsSidebarOpen(false);
              }}
              className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg hover:bg-emerald-50 transition-colors border-2 border-emerald-100"
            >
              <Eye className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-medium text-gray-700 text-center">Quiz</span>
            </button>
          </div>
          
          <button
            onClick={() => {
              handleLogout();
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors border-2 border-red-100"
          >
            <LogOut className="w-5 h-5 text-red-600" />
            <span className="font-medium text-gray-700">Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Subjects Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200 relative overflow-hidden min-h-[88px]">
            {loading ? (
              <div className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-300 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-blue-300 rounded w-16 mb-2"></div>
                    <div className="h-6 bg-blue-300 rounded w-8"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 animate-fade-in-up">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">Subjects</p>
                  <p className="text-2xl font-bold text-blue-900">{subjects.length}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Chapters Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200 relative overflow-hidden min-h-[88px]">
            {loading ? (
              <div className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-300 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-green-300 rounded w-16 mb-2"></div>
                    <div className="h-6 bg-green-300 rounded w-8"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">Chapters</p>
                  <p className="text-2xl font-bold text-green-900">{totalChapters}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Questions Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200 relative overflow-hidden min-h-[88px]">
            {loading ? (
              <div className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-300 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-purple-300 rounded w-16 mb-2"></div>
                    <div className="h-6 bg-purple-300 rounded w-8"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-purple-600 font-medium">Questions</p>
                  <p className="text-2xl font-bold text-purple-900">{totalQuestions}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Pending Reports Card */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border-2 border-orange-200 relative overflow-hidden min-h-[88px]">
            {loading ? (
              <div className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-300 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-orange-300 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-orange-300 rounded w-8"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Flag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-orange-600 font-medium">Pending Reports</p>
                  <p className="text-2xl font-bold text-orange-900">{pendingReportsCount}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subjects List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-4 border-2 border-emerald-100 shadow-lg min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Subjects</h2>
                <Button onClick={() => setShowSubjectDialog(true)} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
                {loading ? (
                  // Skeleton for subjects
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 rounded-lg border-2 border-gray-200 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  subjects.map((subject, index) => (
                    <div
                      key={subject.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all animate-fade-in-up ${
                        selectedSubject?.id === subject.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => handleSelectSubject(subject)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{subject.name}</h3>
                          <p className="text-xs text-gray-500">{subject.totalChapters || 0} chapters</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubject(subject);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chapters List */}
          <div className="lg:col-span-2">
            {selectedSubject ? (
              <div className="bg-white rounded-xl p-4 border-2 border-emerald-100 shadow-lg min-h-[400px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">{selectedSubject.name} - Chapters</h2>
                  <Button onClick={() => setShowChapterDialog(true)} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Chapter
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {loading ? (
                    // Skeleton for chapters
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 rounded-lg border-2 border-gray-200 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-40"></div>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    chapters.map((chapter, index) => (
                      <div
                        key={chapter.id}
                        className="p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 transition-all animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{chapter.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {chapter.questionCount} Questions • {chapter.timer}s per question
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                setSelectedChapter(chapter);
                                // Load existing questions if in update mode
                                const { getQuestionsByChapter } = await import('../firebase/services');
                                const existingQuestions = await getQuestionsByChapter(chapter.id);
                                if (existingQuestions.length > 0) {
                                  const jsonData = {
                                    questions: existingQuestions.map(q => {
                                      const questionData = {
                                        question: q.question,
                                        answer: q.answer,
                                        options: q.options
                                      };
                                      // Include verified field if present
                                      if (q.verified) {
                                        questionData.verified = true;
                                      }
                                      // Include remarks field if present
                                      if (q.remarks) {
                                        questionData.remarks = q.remarks;
                                      }
                                      return questionData;
                                    })
                                  };
                                  setPastedJson(JSON.stringify(jsonData, null, 2));
                                }
                                setShowUploadDialog(true);
                              }}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleMoveChapter(index, 'up')}
                              disabled={index === 0}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleMoveChapter(index, 'down')}
                              disabled={index === chapters.length - 1}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteChapter(chapter)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 border-2 border-gray-200 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a subject to manage chapters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Subject Dialog */}
      <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
            <DialogDescription>Add a new subject for students to practice</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject Name</label>
              <Input
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Enter subject name"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSubjectDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateSubject} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 active:scale-95 transition-transform">
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Chapter Dialog */}
      <Dialog open={showChapterDialog} onOpenChange={setShowChapterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Chapter</DialogTitle>
            <DialogDescription>Add a new chapter with quiz questions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Chapter Name</label>
              <Input
                value={chapterForm.name}
                onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
                placeholder="Enter chapter name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Timer (seconds per question)</label>
              <Input
                type="number"
                value={chapterForm.timer}
                onChange={(e) => setChapterForm({ ...chapterForm, timer: e.target.value })}
                placeholder="30"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowChapterDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateChapter} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 active:scale-95 transition-transform">
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Questions Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Questions</DialogTitle>
            <DialogDescription>Upload or update quiz questions for this chapter</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Chapter: {selectedChapter?.name}</label>
              <p className="text-xs text-gray-500">Current Questions: {selectedChapter?.questionCount || 0}</p>
            </div>
            
            {/* Toggle between Upload and Update */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
              <button
                onClick={() => setUpdateMode('upload')}
                className={`px-3 py-2 rounded-md font-medium transition-all text-sm md:text-base ${
                  updateMode === 'upload'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Upload className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                <span className="text-xs md:text-sm">Upload New</span>
              </button>
              <button
                onClick={() => setUpdateMode('update')}
                className={`px-3 py-2 rounded-md font-medium transition-all text-sm md:text-base ${
                  updateMode === 'update'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <RefreshCw className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                <span className="text-xs md:text-sm">Update Existing</span>
              </button>
            </div>
            
            {/* Toggle between File and Paste */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setUploadMode('file')}
                className={`px-4 py-2 font-medium transition-all ${
                  uploadMode === 'file'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setUploadMode('paste')}
                className={`px-4 py-2 font-medium transition-all ${
                  uploadMode === 'paste'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Paste JSON
              </button>
            </div>
            
            {uploadMode === 'file' ? (
              <div>
                <Input
                  type="file"
                  accept=".json"
                  onChange={(e) => setJsonFile(e.target.files[0])}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Upload a JSON file with questions in the format:
                  <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
                    {`{ "questions": [{ "question": "...", "answer": "...", "options": [...] }] }`}
                  </code>
                </p>
              </div>
            ) : (
              <div>
                <textarea
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder='Paste your JSON here...\n\nExample:\n{\n  "questions": [\n    {\n      "question": "Your question here?",\n      "answer": "Correct answer",\n      "options": ["Option 1", "Option 2", "Option 3", "Option 4"]\n    }\n  ]\n}'
                  className="w-full min-h-[300px] p-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="mt-2">
                  <p className="text-xs text-gray-500">
                    Paste your JSON directly in the format shown above.
                  </p>
                  
                  {/* Collapsible Formatting Keywords */}
                  <div className="mt-2">
                    <button
                      onClick={() => setShowKeywordsHelp(!showKeywordsHelp)}
                      className="flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      <span className={`transform transition-transform ${showKeywordsHelp ? 'rotate-90' : ''}`}>▶</span>
                      Formatting Keywords
                    </button>
                    
                    {showKeywordsHelp && (
                      <ul className="mt-2 space-y-1 text-xs text-gray-600 pl-4 animate-expand">
                        <li>• <code className="bg-gray-100 px-1 rounded">!fix</code> - Keep option at end (e.g., "!fix इनमें से कोई नहीं")</li>
                        <li>• <code className="bg-gray-100 px-1 rounded">!u text !u</code> - Underline text (e.g., "What is !u photosynthesis !u?")</li>
                        <li>• <code className="bg-gray-100 px-1 rounded">!b</code> - Blank for fill in the blanks (e.g., "Capital is !b")</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUploadDialog(false);
                  setJsonFile(null);
                  setPastedJson('');
                  setIsUploading(false);
                  setUpdateMode('upload');
                  setSelectedChapter(null);
                }} 
                className="flex-1 text-sm"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUploadQuestions} 
                disabled={isUploading || (uploadMode === 'file' ? !jsonFile : !pastedJson.trim())} 
                className={`flex-1 text-sm ${
                  updateMode === 'update' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                } active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden`}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {updateMode === 'update' ? 'Updating...' : 'Uploading...'}
                  </span>
                ) : (
                  updateMode === 'update' ? 'Update' : 'Upload'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Settings</DialogTitle>
            <DialogDescription>Update admin credentials and settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                value={settingsForm.email}
                onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">New Password (leave blank to keep current)</label>
              <Input
                type="password"
                value={settingsForm.password}
                onChange={(e) => setSettingsForm({ ...settingsForm, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Confirm New Password</label>
              <Input
                type="password"
                value={settingsForm.confirmPassword}
                onChange={(e) => setSettingsForm({ ...settingsForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSettingsDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpdateCredentials} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600">
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Class Management Dialog */}
      <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Classes</DialogTitle>
            <DialogDescription>Add, edit or remove class categories with themes</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Add New Class Form */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-lg border-2 border-emerald-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-600" />
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Class Name</label>
                  <Input
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    placeholder="e.g., 9th, 10th, 11th"
                  />
                </div>
                
                {/* Theme Selector */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Choose Theme</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {PREDEFINED_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          setSelectedTheme(theme);
                          setClassForm({ ...classForm, theme, customHex: '' });
                        }}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedTheme.id === theme.id
                            ? 'border-gray-800 shadow-md scale-105'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
                        }}
                      >
                        <div className="text-white text-xs font-bold">{theme.name}</div>
                        <div className="text-white text-[10px] mt-1">{theme.primary}</div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Hex Input */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={classForm.customHex}
                      onChange={(e) => {
                        const hex = e.target.value;
                        setClassForm({ ...classForm, customHex: hex });
                        if (hex.match(/^#[0-9A-F]{6}$/i)) {
                          const customTheme = createCustomTheme(hex);
                          setSelectedTheme(customTheme);
                          setClassForm({ ...classForm, theme: customTheme, customHex: hex });
                        }
                      }}
                      placeholder="#FF5733"
                      className="flex-1"
                    />
                    <div 
                      className="w-12 h-10 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: classForm.customHex || selectedTheme.primary }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Or enter custom hex code</p>
                </div>
                
                {/* Theme Preview */}
                <div className="p-3 rounded-lg border-2 border-gray-200" style={{
                  background: `linear-gradient(135deg, ${selectedTheme.primary}20 0%, ${selectedTheme.secondary}20 100%)`
                }}>
                  <p className="text-xs font-medium text-gray-600 mb-2">Preview:</p>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md"
                      style={{ backgroundColor: selectedTheme.primary }}
                    >
                      Q
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: selectedTheme.primary }}>{classForm.name || 'Class Name'}</p>
                      <p className="text-xs text-gray-500">{selectedTheme.name} Theme</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {editingClass && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditingClass(null);
                        setClassForm({ name: '', theme: PREDEFINED_THEMES[0], customHex: '' });
                        setSelectedTheme(PREDEFINED_THEMES[0]);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    onClick={async () => {
                      if (!classForm.name.trim()) {
                        toast({ 
                          title: '❌ Error', 
                          description: 'Class name is required',
                          variant: 'destructive'
                        });
                        return;
                      }
                      
                      setIsGeneratingIcon(true);
                      
                      try {
                        // Generate icon
                        const iconData = await generateClassIcon(
                          classForm.name,
                          selectedTheme.primary,
                          selectedTheme.name
                        );
                        
                        const classData = {
                          name: classForm.name,
                          order: editingClass ? editingClass.order : availableClasses.length + 1,
                          theme: {
                            id: selectedTheme.id,
                            name: selectedTheme.name,
                            primary: selectedTheme.primary,
                            secondary: selectedTheme.secondary,
                            light: selectedTheme.light,
                            gradient: selectedTheme.gradient
                          },
                          icon: iconData
                        };
                        
                        if (editingClass) {
                          const result = await updateClass(editingClass.id, classData);
                          if (result.success) {
                            toast({ 
                              title: '✅ Success', 
                              description: 'Class updated successfully',
                              className: 'bg-emerald-50 border-emerald-200',
                            });
                            setEditingClass(null);
                            setClassForm({ name: '', theme: PREDEFINED_THEMES[0], customHex: '' });
                            setSelectedTheme(PREDEFINED_THEMES[0]);
                            loadClasses();
                          }
                        } else {
                          const result = await createClass(classData);
                          if (result.success) {
                            toast({ 
                              title: '✅ Success', 
                              description: `Class "${classForm.name}" created successfully`,
                              className: 'bg-emerald-50 border-emerald-200',
                            });
                            setClassForm({ name: '', theme: PREDEFINED_THEMES[0], customHex: '' });
                            setSelectedTheme(PREDEFINED_THEMES[0]);
                            loadClasses();
                          }
                        }
                      } catch (error) {
                        console.error('Error creating/updating class:', error);
                        toast({ 
                          title: '❌ Error', 
                          description: 'Failed to create/update class',
                          variant: 'destructive'
                        });
                      } finally {
                        setIsGeneratingIcon(false);
                      }
                    }}
                    disabled={isGeneratingIcon}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600"
                  >
                    {isGeneratingIcon ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </span>
                    ) : (
                      <>{editingClass ? 'Update' : 'Add'} Class</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Existing Classes List */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Existing Classes</h3>
              <div className="space-y-2">
                {availableClasses.map((cls, index) => (
                  <div
                    key={cls.id}
                    className="p-3 rounded-lg border-2 transition-all flex items-center justify-between"
                    style={{
                      borderColor: cls.theme?.primary || '#D1D5DB',
                      background: `linear-gradient(90deg, ${cls.theme?.primary}10 0%, transparent 100%)`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {cls.icon && (
                        <img 
                          src={cls.icon} 
                          alt={cls.name}
                          className="w-10 h-10 rounded-lg shadow-sm"
                        />
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-800">{cls.name}</h4>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cls.theme?.primary || '#10B981' }}
                          ></div>
                          <p className="text-xs text-gray-500">{cls.theme?.name || 'Green'} Theme</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* Up Arrow */}
                      <button
                        onClick={async () => {
                          if (index === 0) return;
                          const newClasses = [...availableClasses];
                          [newClasses[index], newClasses[index - 1]] = [newClasses[index - 1], newClasses[index]];
                          const result = await reorderClasses(newClasses);
                          if (result.success) {
                            loadClasses();
                            toast({ 
                              title: '✅ Success', 
                              description: 'Class reordered successfully',
                              className: 'bg-emerald-50 border-emerald-200',
                            });
                          }
                        }}
                        disabled={index === 0}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      
                      {/* Down Arrow */}
                      <button
                        onClick={async () => {
                          if (index === availableClasses.length - 1) return;
                          const newClasses = [...availableClasses];
                          [newClasses[index], newClasses[index + 1]] = [newClasses[index + 1], newClasses[index]];
                          const result = await reorderClasses(newClasses);
                          if (result.success) {
                            loadClasses();
                            toast({ 
                              title: '✅ Success', 
                              description: 'Class reordered successfully',
                              className: 'bg-emerald-50 border-emerald-200',
                            });
                          }
                        }}
                        disabled={index === availableClasses.length - 1}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      
                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditingClass(cls);
                          const theme = cls.theme ? getThemeById(cls.theme.id) : PREDEFINED_THEMES[0];
                          setSelectedTheme(theme);
                          setClassForm({ 
                            name: cls.name, 
                            theme: cls.theme || PREDEFINED_THEMES[0],
                            customHex: cls.theme?.primary || ''
                          });
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Delete class "${cls.name}"? This will not delete subjects, but they won't be visible.`)) return;
                          
                          const result = await deleteClass(cls.id);
                          if (result.success) {
                            toast({ 
                              title: '✅ Success', 
                              description: `Class "${cls.name}" deleted`,
                              className: 'bg-emerald-50 border-emerald-200',
                            });
                            loadClasses();
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => {
                setShowClassDialog(false);
                setEditingClass(null);
                setClassForm({ name: '', theme: PREDEFINED_THEMES[0], customHex: '' });
                setSelectedTheme(PREDEFINED_THEMES[0]);
              }}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx="true">{`
        @keyframes expand {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 200px;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-expand {
          animation: expand 0.3s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
