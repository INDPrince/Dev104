import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Download, Upload, Trash2, Search, RefreshCw, Archive, AlertTriangle, X, Undo, FileUp, BookOpen, LogOut, Menu, Flag, ChevronLeft, PackagePlus, Eraser, ChevronDown, ChevronRight, Smartphone, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { getAllSubjects, getChaptersBySubject, getAllReports, getAdminCredentials, getQuestionsByChapter, getAllBackups, deleteBackup, normalDelete, completeDelete, restoreFromBackup, importDatabase, installDemoData, removeMockData, clearAllData } from '../firebase/services';
import { toast } from '../hooks/use-toast';
import { generateDemoData, getDemoDataStats } from '../demoData';
import { exportClassData } from '../utils/pwaDataExporter';
import SmartSyncButton from '../components/SmartSyncButton';
import { getInstalledClasses } from '../utils/indexedDB';

const DatabaseManagerPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Filter states for Subject and Chapter tabs
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  
  // Filter states for Questions tab
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('all');
  
  // Data states - ALL CLASSES DATA (no filtering)
  const [allSubjects, setAllSubjects] = useState([]);
  const [allChapters, setAllChapters] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [reports, setReports] = useState([]);
  const [adminCreds, setAdminCreds] = useState(null);
  const [backups, setBackups] = useState([]);
  
  // Stats - ALL CLASSES MERGED
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalChapters: 0,
    totalQuestions: 0,
    totalReports: 0,
    pendingReports: 0,
    totalBackups: 0
  });
  
  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteType, setDeleteType] = useState('normal');
  
  // Import states
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);
  const [importMode, setImportMode] = useState('all');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);
  
  // New dialog states
  const [showInstallDemoDialog, setShowInstallDemoDialog] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [clearAllEmail, setClearAllEmail] = useState('');
  const [clearAllPassword, setClearAllPassword] = useState('');
  const [showPWADialog, setShowPWADialog] = useState(false);
  const [pwaProgress, setPwaProgress] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Selective Install Mock Data States
  const [demoData, setDemoData] = useState(null);
  const [demoSelection, setDemoSelection] = useState({});
  const [expandedClasses, setExpandedClasses] = useState({});
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [installProgress, setInstallProgress] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  
  // Selective Clear States
  const [clearSelection, setClearSelection] = useState({
    subjects: false,
    chapters: false,
    questions: false,
    reports: false,
    backups: false
  });

  useEffect(() => {
    // Check auth
    const isAuth = localStorage.getItem('adminAuth');
    if (!isAuth) {
      navigate('/admin/login');
      return;
    }
    loadAllData();
  }, [navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [subjectsData, reportsData, adminData, backupsData] = await Promise.all([
        getAllSubjects(),
        getAllReports(),
        getAdminCredentials(),
        getAllBackups()
      ]);
      
      // NO FILTERING - Load ALL classes data
      setAllSubjects(subjectsData);
      setReports(reportsData);
      setAdminCreds(adminData);
      setBackups(backupsData);
      
      // Load ALL chapters and questions from ALL classes (OPTIMIZED with Promise.all)
      // Get all chapters in parallel
      const chapterPromises = subjectsData.map(subject => 
        getChaptersBySubject(subject.id).then(chapters => 
          chapters.map(ch => ({ ...ch, subjectId: subject.id, subjectName: subject.name, subjectClass: subject.class }))
        )
      );
      const chaptersArrays = await Promise.all(chapterPromises);
      const allChaptersList = chaptersArrays.flat();
      
      // Get all questions in parallel
      const questionPromises = allChaptersList.map(chapter => 
        getQuestionsByChapter(chapter.id).then(questions => 
          questions.map(q => ({ ...q, chapterId: chapter.id, chapterName: chapter.name, subjectId: chapter.subjectId }))
        )
      );
      const questionsArrays = await Promise.all(questionPromises);
      const allQuestionsList = questionsArrays.flat();
      
      setAllChapters(allChaptersList);
      setAllQuestions(allQuestionsList);
      
      // Calculate stats - ALL CLASSES MERGED (Including Word Meaning)
      // Note: Word Meaning questions are separate and need to be counted separately
      // For now showing regular quiz questions count. Word Meaning stats can be added if needed.
      setStats({
        totalSubjects: subjectsData.length,
        totalChapters: allChaptersList.length,
        totalQuestions: allQuestionsList.length,
        totalReports: reportsData.length,
        pendingReports: reportsData.filter(r => r.status === 'pending').length,
        totalBackups: backupsData.length
      });
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: '❌ Error', description: 'Failed to load data', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleExportBackup = async () => {
    try {
      const backupData = {
        subjects: allSubjects,
        chapters: allChapters,
        questions: allQuestions,
        reports,
        // Do NOT include admin credentials in export
        // admin: adminCreds,
        timestamp: Date.now(),
        type: 'manual_export'
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `database_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({ 
        title: '✅ Success', 
        description: 'Database exported successfully',
        className: 'bg-emerald-50 border-emerald-200',
      });
    } catch (error) {
      toast({ title: '❌ Error', description: 'Failed to export backup', variant: 'destructive' });
    }
  };
  
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          setImportData(data);
          setImportFile(file);
          setShowImportDialog(true);
        } catch (error) {
          toast({ title: '❌ Error', description: 'Invalid JSON file', variant: 'destructive' });
        }
      };
      reader.readAsText(file);
    }
  };
  
  const handleImport = async () => {
    if (!importData) return;
    
    setLoading(true);
    try {
      const options = {
        mode: importMode,
        selected: importMode === 'selective' ? selectedSubjects : []
      };
      
      const result = await importDatabase(importData, options);
      if (result.success) {
        toast({ 
          title: '✅ Success', 
          description: 'Database imported successfully',
          className: 'bg-emerald-50 border-emerald-200',
        });
        setShowImportDialog(false);
        setImportFile(null);
        setImportData(null);
        setSelectedSubjects([]);
        loadAllData();
      }
    } catch (error) {
      toast({ title: '❌ Error', description: 'Failed to import data', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleInstallDemoData = async () => {
    // Check if any data is selected
    const hasSelection = Object.values(demoSelection).some(classData => {
      if (classData.selected) return true;
      if (classData.subjects) {
        return Object.values(classData.subjects).some(subjectData => {
          if (subjectData.selected) return true;
          if (subjectData.chapters) {
            return Object.values(subjectData.chapters).some(ch => ch.selected);
          }
          return false;
        });
      }
      return false;
    });
    
    if (!hasSelection) {
      toast({ 
        title: '❌ No Selection', 
        description: 'Please select at least one item to install',
        variant: 'destructive' 
      });
      return;
    }
    
    setLoading(true);
    setIsInstalling(true);
    setInstallProgress('Preparing data...');
    
    try {
      // Build filtered data based on selection
      const filteredData = {
        subjects: [],
        chapters: {},
        questions: {},
        wordMeaningSubjects: [],
        wordMeaningChapters: {},
        wordMeaningPages: {},
        wordMeaningQuestions: {}
      };
      
      setInstallProgress('Filtering selected data...');
      
      Object.entries(demoSelection).forEach(([className, classData]) => {
        if (classData.subjects) {
          Object.entries(classData.subjects).forEach(([subjectId, subjectData]) => {
            // Check if subject or any of its chapters is selected
            const hasSelectedChapters = Object.values(subjectData.chapters || {}).some(ch => ch.selected);
            
            if (subjectData.selected || hasSelectedChapters) {
              // Find subject in demo data
              const subject = demoData.subjects.find(s => s.id === subjectId);
              const wmSubject = demoData.wordMeaningSubjects?.find(s => s.id === subjectId);
              
              if (subject) {
                // Regular subject
                filteredData.subjects.push(subject);
                filteredData.chapters[subjectId] = [];
                
                // Add selected chapters
                Object.entries(subjectData.chapters || {}).forEach(([chapterId, chapterData]) => {
                  if (chapterData.selected) {
                    const chapter = (demoData.chapters[subjectId] || []).find(ch => ch.id === chapterId);
                    if (chapter) {
                      filteredData.chapters[subjectId].push(chapter);
                      filteredData.questions[chapterId] = demoData.questions[chapterId] || [];
                    }
                  }
                });
              } else if (wmSubject) {
                // Word Meaning subject
                filteredData.wordMeaningSubjects.push(wmSubject);
                filteredData.wordMeaningChapters[subjectId] = [];
                
                // Add Word Meaning chapters and pages
                Object.entries(subjectData.chapters || {}).forEach(([chapterId, chapterData]) => {
                  if (chapterData.selected) {
                    const wmChapter = (demoData.wordMeaningChapters[subjectId] || []).find(ch => ch.id === chapterId);
                    if (wmChapter) {
                      filteredData.wordMeaningChapters[subjectId].push(wmChapter);
                      filteredData.wordMeaningPages[chapterId] = demoData.wordMeaningPages[chapterId] || [];
                      
                      // Add questions for all pages
                      (demoData.wordMeaningPages[chapterId] || []).forEach(page => {
                        filteredData.wordMeaningQuestions[page.id] = demoData.wordMeaningQuestions[page.id] || [];
                      });
                    }
                  }
                });
              }
            }
          });
        }
      });
      
      setInstallProgress(`Installing ${filteredData.subjects.length + filteredData.wordMeaningSubjects.length} subjects...`);
      
      // Install filtered data with progress callback
      const result = await installDemoData(filteredData, null, (message) => {
        setInstallProgress(message);
      });
      
      if (result.success) {
        const chapterCount = Object.values(filteredData.chapters).flat().length + Object.values(filteredData.wordMeaningChapters).flat().length;
        const questionCount = Object.values(filteredData.questions).flat().length + Object.values(filteredData.wordMeaningQuestions).flat().length;
        
        setInstallProgress('Installation complete!');
        
        toast({ 
          title: '✅ Demo Data Installed', 
          description: `Installed ${filteredData.subjects.length} subjects, ${filteredData.wordMeaningSubjects.length} Word Meaning subjects, ${chapterCount} chapters, ${questionCount} questions`,
          className: 'bg-emerald-50 border-emerald-200',
        });
        
        setTimeout(() => {
          setShowInstallDemoDialog(false);
          setDemoSelection({});
          setExpandedClasses({});
          setExpandedSubjects({});
          setDemoData(null);
          setInstallProgress('');
          setIsInstalling(false);
          loadAllData();
        }, 500);
      }
    } catch (error) {
      console.error('Install error:', error);
      setInstallProgress('Installation failed!');
      toast({ title: '❌ Error', description: error.message || 'Failed to install demo data', variant: 'destructive' });
      setIsInstalling(false);
    }
    setLoading(false);
  };
  
  const handleRemoveMockData = async () => {
    // Better confirmation dialog
    const userConfirmed = window.confirm(
      '⚠️ Remove All Mock Data?\n\n' +
      'This will remove all demo/mock data from the database.\n' +
      'Manually created data will be preserved.\n\n' +
      'Click OK to proceed, Cancel to abort.'
    );
    
    if (!userConfirmed) return;
    
    setLoading(true);
    setInstallProgress('Preparing to remove mock data...');
    
    try {
      // Show progress updates
      setInstallProgress('Scanning subjects...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Short delay to show progress
      
      setInstallProgress('Removing mock data (this may take a moment)...');
      const result = await removeMockData();
      
      if (result.success) {
        setInstallProgress('Mock data removed successfully!');
        toast({ 
          title: '✅ Mock Data Removed', 
          description: 'All demo data has been removed. Manual data is safe.',
          className: 'bg-orange-50 border-orange-200',
        });
        
        setTimeout(() => {
          setInstallProgress('');
          loadAllData();
        }, 500);
      } else {
        setInstallProgress('');
        toast({ 
          title: '❌ Error', 
          description: result.error || 'Failed to remove mock data', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      setInstallProgress('');
      toast({ title: '❌ Error', description: 'Failed to remove mock data', variant: 'destructive' });
    }
    setLoading(false);
  };
  
  // Initialize demo data when dialog opens
  useEffect(() => {
    if (showInstallDemoDialog && !demoData) {
      const data = generateDemoData();
      setDemoData(data);
      
      // Initialize selection structure
      const initialSelection = {};
      const classesByClass = {};
      
      // Group BOTH regular subjects AND Word Meaning subjects by class
      [...data.subjects, ...(data.wordMeaningSubjects || [])].forEach(subject => {
        if (!classesByClass[subject.class]) {
          classesByClass[subject.class] = [];
        }
        classesByClass[subject.class].push(subject);
      });
      
      // Build selection structure
      Object.entries(classesByClass).forEach(([className, subjects]) => {
        initialSelection[className] = {
          selected: false,
          subjects: {}
        };
        
        subjects.forEach(subject => {
          initialSelection[className].subjects[subject.id] = {
            selected: false,
            chapters: {}
          };
          
          // Check if it's Word Meaning or regular subject
          const isWordMeaning = data.wordMeaningSubjects?.some(s => s.id === subject.id);
          
          if (isWordMeaning) {
            // Word Meaning chapters
            const subjectChapters = data.wordMeaningChapters[subject.id] || [];
            subjectChapters.forEach(chapter => {
              initialSelection[className].subjects[subject.id].chapters[chapter.id] = {
                selected: false,
                isWordMeaning: true
              };
            });
          } else {
            // Regular chapters
            const subjectChapters = data.chapters[subject.id] || [];
            subjectChapters.forEach(chapter => {
              initialSelection[className].subjects[subject.id].chapters[chapter.id] = {
                selected: false,
                isWordMeaning: false
              };
            });
          }
        });
      });
      
      setDemoSelection(initialSelection);
    }
  }, [showInstallDemoDialog, demoData]);
  
  // Toggle selection helpers with indeterminate state support
  const toggleClass = (className) => {
    const newSelection = { ...demoSelection };
    const currentState = newSelection[className].selected;
    newSelection[className].selected = !currentState;
    
    // Toggle all subjects and chapters in this class
    Object.keys(newSelection[className].subjects).forEach(subjectId => {
      newSelection[className].subjects[subjectId].selected = !currentState;
      Object.keys(newSelection[className].subjects[subjectId].chapters).forEach(chapterId => {
        newSelection[className].subjects[subjectId].chapters[chapterId].selected = !currentState;
      });
    });
    
    setDemoSelection(newSelection);
  };
  
  const toggleSubject = (className, subjectId) => {
    const newSelection = { ...demoSelection };
    const currentState = newSelection[className].subjects[subjectId].selected;
    newSelection[className].subjects[subjectId].selected = !currentState;
    
    // Toggle all chapters in this subject
    Object.keys(newSelection[className].subjects[subjectId].chapters).forEach(chapterId => {
      newSelection[className].subjects[subjectId].chapters[chapterId].selected = !currentState;
    });
    
    // Update class checkbox state
    const allSubjectsSelected = Object.values(newSelection[className].subjects).every(s => s.selected);
    newSelection[className].selected = allSubjectsSelected;
    
    setDemoSelection(newSelection);
  };
  
  const toggleChapter = (className, subjectId, chapterId) => {
    const newSelection = { ...demoSelection };
    const currentState = newSelection[className].subjects[subjectId].chapters[chapterId].selected;
    newSelection[className].subjects[subjectId].chapters[chapterId].selected = !currentState;
    
    // Update subject checkbox state - use indeterminate logic
    const chapters = newSelection[className].subjects[subjectId].chapters;
    const allChaptersSelected = Object.values(chapters).every(ch => ch.selected);
    const someChaptersSelected = Object.values(chapters).some(ch => ch.selected);
    
    // If all chapters selected, subject is selected
    // If some chapters selected, subject is also marked as selected (indeterminate visual handled separately)
    // If no chapters selected, subject is not selected
    newSelection[className].subjects[subjectId].selected = allChaptersSelected || someChaptersSelected;
    
    // Update class checkbox state
    const subjects = newSelection[className].subjects;
    const allSubjectsSelected = Object.values(subjects).every(s => s.selected);
    const someSubjectsSelected = Object.values(subjects).some(s => s.selected);
    newSelection[className].selected = allSubjectsSelected || someSubjectsSelected;
    
    setDemoSelection(newSelection);
  };
  
  // Helper to check if checkbox should be indeterminate
  const isSubjectIndeterminate = (className, subjectId) => {
    if (!demoSelection[className]?.subjects[subjectId]) return false;
    const chapters = demoSelection[className].subjects[subjectId].chapters;
    const selected = Object.values(chapters).filter(ch => ch.selected).length;
    const total = Object.values(chapters).length;
    return selected > 0 && selected < total;
  };
  
  const isClassIndeterminate = (className) => {
    if (!demoSelection[className]) return false;
    const subjects = demoSelection[className].subjects;
    let totalChapters = 0;
    let selectedChapters = 0;
    
    Object.values(subjects).forEach(subject => {
      const chapters = Object.values(subject.chapters);
      totalChapters += chapters.length;
      selectedChapters += chapters.filter(ch => ch.selected).length;
    });
    
    return selectedChapters > 0 && selectedChapters < totalChapters;
  };
  
  const handleClearAllData = async () => {
    // Check if anything is selected
    const hasSelection = Object.values(clearSelection).some(v => v);
    if (!hasSelection) {
      toast({ 
        title: '❌ No Selection', 
        description: 'Please select at least one item type to clear',
        variant: 'destructive' 
      });
      return;
    }
    
    // ALWAYS verify admin credentials for ANY deletion
    if (!adminCreds) {
      toast({ title: '❌ Error', description: 'Admin credentials not loaded', variant: 'destructive' });
      return;
    }
    
    if (clearAllEmail !== adminCreds.email || clearAllPassword !== adminCreds.password) {
      toast({ 
        title: '❌ Invalid Credentials', 
        description: 'Email or password is incorrect',
        variant: 'destructive' 
      });
      return;
    }
    
    setLoading(true);
    try {
      // Call clearAllData with selective options
      const result = await clearAllData(clearSelection);
      
      if (result.success) {
        const clearedItems = Object.entries(clearSelection)
          .filter(([_, value]) => value)
          .map(([key, _]) => key)
          .join(', ');
          
        toast({ 
          title: '✅ Data Cleared', 
          description: `Cleared: ${clearedItems}. Admin credentials & Class data preserved.`,
          className: 'bg-orange-50 border-orange-200',
        });
        setShowClearAllDialog(false);
        setClearAllEmail('');
        setClearAllPassword('');
        setClearSelection({
          subjects: false,
          chapters: false,
          questions: false,
          reports: false,
          backups: false
        });
        loadAllData();
      }
    } catch (error) {
      toast({ title: '❌ Error', description: 'Failed to clear data', variant: 'destructive' });
    }
    setLoading(false);
  };


  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    
    setLoading(true);
    try {
      const { type, data } = selectedItem;
      
      if (deleteType === 'complete') {
        const result = await completeDelete(type, data);
        if (result.success) {
          if (result.backup) {
            const blob = new Blob([JSON.stringify(result.backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `complete_delete_backup_${type}_${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
          }
          
          toast({ 
            title: '✅ Complete Delete', 
            description: `${type} deleted permanently. Backup saved.`,
            className: 'bg-red-50 border-red-200',
          });
        }
      } else {
        const result = await normalDelete(type, data);
        if (result.success) {
          toast({ 
            title: '✅ Normal Delete', 
            description: `${type} deleted. Backup stored for 7 days.`,
            className: 'bg-orange-50 border-orange-200',
          });
        }
      }
      
      setShowDeleteDialog(false);
      setSelectedItem(null);
      loadAllData();
    } catch (error) {
      toast({ title: '❌ Error', description: 'Failed to delete item', variant: 'destructive' });
    }
    setLoading(false);
  };

  // PWA Sync Handler
  const handleSyncClassData = async (classId) => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setPwaProgress('Starting sync...');
    
    try {
      console.log(`\n🔄 Syncing ${classId} data for PWA...`);
      
      const result = await exportClassData(classId, (message) => {
        setPwaProgress(message);
        console.log(`[SYNC] ${message}`);
      });
      
      setPwaProgress(`✅ Success! Downloaded ${result.filesCount} files`);
      
      toast({
        title: '✅ Sync Complete',
        description: `Class ${classId} - ${result.filesCount} files downloaded. Place them in /public/pwa-data/${classId}/`,
        className: 'bg-green-50 border-green-200',
        duration: 10000
      });
      
      // Show instruction alert
      setTimeout(() => {
        alert(`📁 NEXT STEPS:

1. Locate downloaded files in your Downloads folder:
   - class${classId.replace('th', '')}-metadata.js
   - class${classId.replace('th', '')}-quiz_*.js
   - class${classId.replace('th', '')}-wm_*.js

2. Create folder (if not exists):
   /app/frontend/public/pwa-data/${classId}/

3. Move ALL downloaded files to that folder

4. Run: yarn build

5. Test offline functionality

Total files: ${result.filesCount}`);
      }, 500);
      
    } catch (error) {
      console.error('❌ Sync error:', error);
      setPwaProgress(`❌ Error: ${error.message}`);
      
      toast({
        title: '❌ Sync Failed',
        description: error.message,
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setPwaProgress(''), 3000);
    }
  };

  // Sync all classes
  const handleSyncAllClasses = async () => {
    for (const cls of ['10th', '11th', '12th']) {
      await handleSyncClassData(cls);
      // Wait 2 seconds between classes
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };


  const handleRestoreBackup = async (backup) => {
    if (!window.confirm('Restore this backup? Current data will be overwritten.')) return;
    
    setLoading(true);
    try {
      const result = await restoreFromBackup(backup.id);
      if (result.success) {
        toast({ 
          title: '✅ Restored', 
          description: 'Database restored successfully',
          className: 'bg-emerald-50 border-emerald-200',
        });
        loadAllData();
      }
    } catch (error) {
      toast({ title: '❌ Error', description: 'Failed to restore backup', variant: 'destructive' });
    }
    setLoading(false);
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
        <h3 className="text-sm font-medium text-blue-600 mb-2">Total Subjects</h3>
        <p className="text-3xl font-bold text-blue-900">{stats.totalSubjects}</p>
      </div>
      
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
        <h3 className="text-sm font-medium text-green-600 mb-2">Total Chapters</h3>
        <p className="text-3xl font-bold text-green-900">{stats.totalChapters}</p>
      </div>
      
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200">
        <h3 className="text-sm font-medium text-purple-600 mb-2">Total Questions</h3>
        <p className="text-3xl font-bold text-purple-900">{stats.totalQuestions}</p>
      </div>
      
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-200">
        <h3 className="text-sm font-medium text-orange-600 mb-2">Total Reports</h3>
        <p className="text-3xl font-bold text-orange-900">{stats.totalReports}</p>
        <p className="text-xs text-orange-600 mt-1">{stats.pendingReports} pending</p>
      </div>
      
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl border-2 border-teal-200">
        <h3 className="text-sm font-medium text-teal-600 mb-2">Backups</h3>
        <p className="text-3xl font-bold text-teal-900">{stats.totalBackups}</p>
      </div>
      
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border-2 border-indigo-200">
        <h3 className="text-sm font-medium text-indigo-600 mb-2">Admin Account</h3>
        <p className="text-sm font-medium text-indigo-900 truncate">{adminCreds?.email || 'N/A'}</p>
      </div>
    </div>
  );

  const renderSubjects = () => {
    // Filter by class if selected
    let filteredSubjects = allSubjects;
    if (selectedClassFilter !== 'all') {
      filteredSubjects = filteredSubjects.filter(s => s.class === selectedClassFilter);
    }
    
    // Apply search
    filteredSubjects = filteredSubjects.filter(s => 
      s.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return (
      <div>
        {/* Class Filter */}
        <div className="mb-4">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
          >
            <option value="all">All Classes</option>
            <option value="10th">Class 10th</option>
            <option value="11th">Class 11th</option>
            <option value="12th">Class 12th</option>
          </select>
        </div>
        
        <div className="space-y-3">
          {filteredSubjects.map(subject => (
            <div key={subject.id} className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{subject.name}</h3>
                  <p className="text-sm text-gray-500">Class: {subject.class} • {subject.totalChapters || 0} chapters</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedItem({ type: 'subject', data: subject });
                    setShowDeleteDialog(true);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredSubjects.length === 0 && (
            <p className="text-center text-gray-500 py-8">No subjects found</p>
          )}
        </div>
      </div>
    );
  };

  const renderChapters = () => {
    // Filter by class if selected
    let filteredChapters = allChapters;
    if (selectedClassFilter !== 'all') {
      filteredChapters = filteredChapters.filter(c => c.subjectClass === selectedClassFilter);
    }
    
    // Apply search
    filteredChapters = filteredChapters.filter(c => 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return (
      <div>
        {/* Class Filter */}
        <div className="mb-4">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
          >
            <option value="all">All Classes</option>
            <option value="10th">Class 10th</option>
            <option value="11th">Class 11th</option>
            <option value="12th">Class 12th</option>
          </select>
        </div>
        
        <div className="space-y-3">
          {filteredChapters.map(chapter => (
            <div key={chapter.id} className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{chapter.name}</h3>
                  <p className="text-sm text-gray-500">
                    Subject: {chapter.subjectName} ({chapter.subjectClass}) • {chapter.questionCount || 0} questions • {chapter.timer}s timer
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedItem({ type: 'chapter', data: chapter });
                    setShowDeleteDialog(true);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredChapters.length === 0 && (
            <p className="text-center text-gray-500 py-8">No chapters found</p>
          )}
        </div>
      </div>
    );
  };

  const renderQuestions = () => {
    let filteredQuestions = allQuestions;
    
    if (selectedSubjectFilter !== 'all') {
      const subjectChapters = allChapters.filter(c => c.subjectId === selectedSubjectFilter);
      const chapterIds = subjectChapters.map(c => c.id);
      filteredQuestions = filteredQuestions.filter(q => chapterIds.includes(q.chapterId));
    }
    
    if (selectedChapterFilter !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.chapterId === selectedChapterFilter);
    }
    
    filteredQuestions = filteredQuestions.filter(q => 
      q.question?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return (
      <div>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <select
            value={selectedSubjectFilter}
            onChange={(e) => {
              setSelectedSubjectFilter(e.target.value);
              setSelectedChapterFilter('all');
            }}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
          >
            <option value="all">All Subjects</option>
            {allSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
            ))}
          </select>
          
          <select
            value={selectedChapterFilter}
            onChange={(e) => setSelectedChapterFilter(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
            disabled={selectedSubjectFilter === 'all'}
          >
            <option value="all">All Chapters</option>
            {allChapters
              .filter(c => selectedSubjectFilter === 'all' || c.subjectId === selectedSubjectFilter)
              .map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>
        </div>
        
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {filteredQuestions.map(question => (
            <div key={question.id} className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 mb-2 break-words">{question.question}</p>
                  <p className="text-sm text-emerald-600 mb-2">Answer: {question.answer}</p>
                  <div className="flex flex-wrap gap-2">
                    {question.options?.map((opt, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded break-words">{opt}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedItem({ type: 'question', data: question });
                    setShowDeleteDialog(true);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredQuestions.length === 0 && (
            <p className="text-center text-gray-500 py-8">No questions found</p>
          )}
        </div>
      </div>
    );
  };

  const renderReports = () => {
    const filteredReports = reports.filter(r => 
      r.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return (
      <div className="space-y-3">
        {filteredReports.map(report => (
          <div key={report.id} className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-orange-300 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-800">{report.reason}</p>
                <p className="text-sm text-gray-500 mt-1">Status: {report.status}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(report.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedItem({ type: 'report', data: report });
                  setShowDeleteDialog(true);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filteredReports.length === 0 && (
          <p className="text-center text-gray-500 py-8">No reports found</p>
        )}
      </div>
    );
  };

  const renderBackups = () => (
    <div className="space-y-3">
      {backups.map(backup => {
        const itemName = backup.data?.name || backup.data?.question || backup.data?.reason || 'Unknown';
        const relatedInfo = backup.relatedData ? 
          `${backup.relatedData.chapters?.length || 0} chapters, ${Object.values(backup.relatedData.questions || {}).flat().length || 0} questions` : '';
        
        return (
          <div key={backup.id} className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-teal-300 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">
                  {backup.type === 'complete' ? '🔴 Complete Delete' : '🟠 Normal Delete'} - {backup.itemType}
                </h3>
                <p className="text-sm text-gray-600 mt-1 break-words">
                  <span className="font-medium">{itemName}</span>
                  {relatedInfo && <span className="text-gray-400 ml-2">({relatedInfo})</span>}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(backup.timestamp).toLocaleString()}
                  {backup.type === 'normal' && backup.expiresAt && (
                    <span className="ml-2 text-orange-600">
                      (Expires: {new Date(backup.expiresAt).toLocaleDateString()})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `backup_${backup.itemType}_${backup.id}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRestoreBackup(backup)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Restore"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm('Delete this backup?')) {
                      await deleteBackup(backup.id);
                      loadAllData();
                      toast({ title: '✅ Deleted', description: 'Backup deleted' });
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      {backups.length === 0 && (
        <p className="text-center text-gray-500 py-8">No backups available</p>
      )}
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Database },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, count: stats.totalSubjects },
    { id: 'chapters', label: 'Chapters', icon: BookOpen, count: stats.totalChapters },
    { id: 'questions', label: 'Questions', icon: BookOpen, count: stats.totalQuestions },
    { id: 'reports', label: 'Reports', icon: Flag, count: stats.totalReports },
    { id: 'backups', label: 'Backups', icon: Archive, count: stats.totalBackups },
  ];

  if (loading && !allSubjects.length) {
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
      {/* Header with Navbar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <ChevronLeft className="w-5 h-5 text-emerald-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  <span className="hidden sm:inline">Database Manager</span>
                  <span className="sm:hidden">Database</span>
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Manage all database content</p>
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              {/* Refresh Icon - LEFT side - No reload popup */}
              <button
                onClick={(e) => {
                  e.preventDefault(); // Prevent any default behavior
                  loadAllData();
                  toast({ 
                    title: '🔄 Refreshed', 
                    description: 'Data reloaded successfully',
                    className: 'bg-emerald-50 border-emerald-200',
                  });
                }}
                className="p-2 bg-white border-2 border-emerald-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-400 transition-all shadow-sm"
                title="Refresh Data"
                type="button"
              >
                <RefreshCw className="w-5 h-5 text-emerald-600" />
              </button>
              
              {/* Desktop - Only Refresh Button */}
              <div className="hidden lg:flex gap-2">
              </div>
              
              {/* Mobile - No Buttons, Only Hamburger */}
              
              {/* Hamburger Menu Button (Mobile & Desktop) */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all shadow-sm"
              >
                <Menu className="w-5 h-5 text-emerald-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl p-4 border-2 border-emerald-100 shadow-lg sticky top-24 space-y-4">
              {/* Navigation */}
              <div>
                <h2 className="text-sm font-bold text-gray-600 mb-3 uppercase">Navigation</h2>
                <div className="space-y-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg transition-all text-left ${
                        activeTab === tab.id
                          ? 'bg-emerald-100 text-emerald-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <tab.icon className="w-4 h-4" />
                        <span className="text-sm">{tab.label}</span>
                      </div>
                      {tab.count !== undefined && (
                        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons - Below Navigation */}
              <div>
                <h2 className="text-sm font-bold text-gray-600 uppercase mb-3">Actions</h2>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowPWADialog(true)}
                    className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg hover:bg-purple-50 transition-colors border border-purple-200 text-sm"
                  >
                    <Smartphone className="w-5 h-5 text-purple-600" />
                    <span className="text-xs text-gray-700 font-medium">PWA</span>
                  </button>
                  
                  <button
                    onClick={() => setShowInstallDemoDialog(true)}
                    className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200 text-sm"
                  >
                    <PackagePlus className="w-5 h-5 text-blue-600" />
                    <span className="text-xs text-gray-700 font-medium">Install</span>
                  </button>
                  
                  <button
                    onClick={() => setShowClearAllDialog(true)}
                    className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg hover:bg-red-50 transition-colors border border-red-200 text-sm"
                  >
                    <Eraser className="w-5 h-5 text-red-600" />
                    <span className="text-xs text-gray-700 font-medium">Clear All</span>
                  </button>
                  
                  <label htmlFor="import-file-desktop" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg hover:bg-emerald-50 transition-colors border border-emerald-200 text-sm">
                      <FileUp className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs text-gray-700 font-medium">Import</span>
                    </div>
                  </label>
                  <input
                    id="import-file-desktop"
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                  
                  <button
                    onClick={handleExportBackup}
                    className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg hover:bg-emerald-50 transition-colors border border-emerald-200 text-sm"
                  >
                    <Download className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs text-gray-700 font-medium">Export</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Sidebar */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          <div className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-500 to-purple-600">
              <h2 className="font-bold text-lg text-white">Menu</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Navigation Tabs */}
            <div className="p-4 space-y-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Navigation</h3>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg transition-all text-left ${
                    activeTab === tab.id
                      ? 'bg-emerald-100 text-emerald-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && (
                    <span className="bg-white border-2 border-emerald-200 px-2 py-0.5 rounded-full text-xs font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {/* Action Buttons in Sidebar */}
            <div className="p-4 space-y-3 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Actions</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowPWADialog(true);
                    setIsSidebarOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 px-3 py-4 rounded-lg hover:bg-purple-50 transition-colors border-2 border-purple-100 bg-purple-50"
                >
                  <Smartphone className="w-6 h-6 text-purple-600" />
                  <span className="text-xs font-medium text-gray-700 text-center">PWA</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowInstallDemoDialog(true);
                    setIsSidebarOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 px-3 py-4 rounded-lg hover:bg-blue-50 transition-colors border-2 border-blue-100 bg-blue-50"
                >
                  <PackagePlus className="w-6 h-6 text-blue-600" />
                  <span className="text-xs font-medium text-gray-700 text-center">Install</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowClearAllDialog(true);
                    setIsSidebarOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 px-3 py-4 rounded-lg hover:bg-red-50 transition-colors border-2 border-red-100 bg-red-50"
                >
                  <Eraser className="w-6 h-6 text-red-600" />
                  <span className="text-xs font-medium text-gray-700 text-center">Clear All</span>
                </button>
                
                <label htmlFor="import-file-sidebar" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2 px-3 py-4 rounded-lg hover:bg-emerald-50 transition-colors border-2 border-emerald-100">
                    <FileUp className="w-6 h-6 text-emerald-600" />
                    <span className="text-xs font-medium text-gray-700 text-center">Import</span>
                  </div>
                </label>
                <input
                  id="import-file-sidebar"
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    handleImportFile(e);
                    setIsSidebarOpen(false);
                  }}
                  className="hidden"
                />
                
                <button
                  onClick={() => {
                    handleExportBackup();
                    setIsSidebarOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 px-3 py-4 rounded-lg hover:bg-emerald-50 transition-colors border-2 border-emerald-100"
                >
                  <Download className="w-6 h-6 text-emerald-600" />
                  <span className="text-xs font-medium text-gray-700 text-center">Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-emerald-100 shadow-lg">
              {/* Search Bar */}
              {activeTab !== 'overview' && (
                <div className="mb-6">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search ${activeTab}...`}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Content */}
              {loading && allSubjects.length > 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && renderOverview()}
                  {activeTab === 'subjects' && renderSubjects()}
                  {activeTab === 'chapters' && renderChapters()}
                  {activeTab === 'questions' && renderQuestions()}
                  {activeTab === 'reports' && renderReports()}
                  {activeTab === 'backups' && renderBackups()}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedItem?.type}</DialogTitle>
            <DialogDescription>Choose how you want to delete this item</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">Choose delete type:</p>
            
            <div className="space-y-3">
              <button
                onClick={() => setDeleteType('normal')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  deleteType === 'normal'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Archive className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Normal Delete</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Backup stored for 7 days in backend (last 10 logs)
                    </p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setDeleteType('complete')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  deleteType === 'complete'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Complete Delete</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Permanent backup in Firebase + Auto download (last 10 logs)
                    </p>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteItem}
                className={`flex-1 ${
                  deleteType === 'complete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Database</DialogTitle>
            <DialogDescription>Import data from a JSON backup file</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">Choose import mode:</p>
            
            <div className="space-y-3">
              <button
                onClick={() => setImportMode('all')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  importMode === 'all'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Import All</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Import all subjects, chapters, questions, and reports
                    </p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setImportMode('selective')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  importMode === 'selective'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Selective Import</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Choose specific subjects to import
                    </p>
                  </div>
                </div>
              </button>
            </div>
            
            {importMode === 'selective' && importData?.subjects && (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Filter by Class:</p>
                  <div className="flex gap-2 flex-wrap">
                    {['10th', '11th', '12th'].map(cls => {
                      const classSubjects = importData.subjects.filter(s => s.class === cls);
                      if (classSubjects.length === 0) return null;
                      return (
                        <button
                          key={cls}
                          onClick={() => {
                            if (selectedClasses.includes(cls)) {
                              setSelectedClasses(selectedClasses.filter(c => c !== cls));
                              // Remove all subjects of this class
                              const subjectsToRemove = classSubjects.map(s => s.id);
                              setSelectedSubjects(selectedSubjects.filter(id => !subjectsToRemove.includes(id)));
                            } else {
                              setSelectedClasses([...selectedClasses, cls]);
                              // Add all subjects of this class
                              const subjectsToAdd = classSubjects.map(s => s.id);
                              setSelectedSubjects([...new Set([...selectedSubjects, ...subjectsToAdd])]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            selectedClasses.includes(cls)
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Class {cls} ({classSubjects.length})
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Select Subjects:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg p-3">
                    {importData.subjects.map(subject => {
                      const subjectChapters = importData.chapters?.filter(c => c.subjectId === subject.id) || [];
                      const chapterCount = subjectChapters.length;
                      
                      return (
                        <div key={subject.id} className="border-b border-gray-100 pb-2 mb-2 last:border-0">
                          <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSubjects.includes(subject.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubjects([...selectedSubjects, subject.id]);
                                } else {
                                  setSelectedSubjects(selectedSubjects.filter(id => id !== subject.id));
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{subject.name}</span>
                                <span className="text-xs text-gray-500">({subject.class})</span>
                              </div>
                              <p className="text-xs text-gray-400">{chapterCount} chapters</p>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {selectedSubjects.length > 0 && (
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3">
                    <p className="text-sm text-emerald-700">
                      ✅ Selected: {selectedSubjects.length} subject(s)
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImportDialog(false);
                  setImportFile(null);
                  setImportData(null);
                  setSelectedSubjects([]);
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImport}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={loading || (importMode === 'selective' && selectedSubjects.length === 0)}
              >
                {loading ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Install Demo Data Dialog - Simplified with 3 Class Sections */}
      <Dialog open={showInstallDemoDialog} onOpenChange={setShowInstallDemoDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Install Mock Data (Selective)</DialogTitle>
            <DialogDescription>Select classes, subjects, and chapters to install. Questions import automatically with chapters.</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 mt-4 pr-2">
            {/* Selective Tree Structure - 3 Class Sections */}
            {demoData && demoSelection && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm">Select Data to Install:</h4>
                  <button
                    onClick={() => {
                      const allSelected = Object.values(demoSelection).every(c => c.selected);
                      const newSelection = { ...demoSelection };
                      Object.keys(newSelection).forEach(className => {
                        newSelection[className].selected = !allSelected;
                        Object.keys(newSelection[className].subjects).forEach(subjectId => {
                          newSelection[className].subjects[subjectId].selected = !allSelected;
                          Object.keys(newSelection[className].subjects[subjectId].chapters).forEach(chapterId => {
                            newSelection[className].subjects[subjectId].chapters[chapterId].selected = !allSelected;
                          });
                        });
                      });
                      setDemoSelection(newSelection);
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    {Object.values(demoSelection).every(c => c.selected) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                {/* 3 Class Sections */}
                <div className="space-y-2">
                  {Object.entries(demoSelection).map(([className, classData]) => {
                    const classSubjects = demoData.subjects.filter(s => s.class === className);
                    const totalChapters = classSubjects.reduce((acc, s) => acc + (demoData.chapters[s.id]?.length || 0), 0);
                    const totalQuestions = classSubjects.reduce((acc, s) => {
                      const subjectChapters = demoData.chapters[s.id] || [];
                      return acc + subjectChapters.reduce((qAcc, ch) => qAcc + (demoData.questions[ch.id]?.length || 0), 0);
                    }, 0);
                    
                    const isExpanded = expandedClasses[className];
                    const isIndeterminate = isClassIndeterminate(className);
                    
                    return (
                      <div key={className} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        {/* Class Level - Clickable Header */}
                        <div 
                          className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            // Toggle expand and collapse others
                            setExpandedClasses({ [className]: !isExpanded });
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {isExpanded ? 
                              <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" /> : 
                              <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
                            }
                            <div onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={classData.selected}
                                onCheckedChange={() => toggleClass(className)}
                                className={`flex-shrink-0 ${isIndeterminate ? 'data-[state=checked]:bg-blue-500' : ''}`}
                              />
                            </div>
                            <span className="font-bold text-gray-800 text-lg">
                              {className}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({classSubjects.length} subjects, {totalChapters} chapters, {totalQuestions} questions)
                            </span>
                          </div>
                        </div>
                        
                        {/* Subjects & Chapters - Only when expanded */}
                        {isExpanded && (
                          <div className="p-3 space-y-2 bg-white">
                            {classSubjects.map(subject => {
                              const subjectChapters = demoData.chapters[subject.id] || [];
                              const subjectQuestions = subjectChapters.reduce((acc, ch) => acc + (demoData.questions[ch.id]?.length || 0), 0);
                              const isSubjExpanded = expandedSubjects[subject.id];
                              const isSubjIndeterminate = isSubjectIndeterminate(className, subject.id);
                              
                              return (
                                <div key={subject.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                  {/* Subject Level */}
                                  <div 
                                    className="flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 cursor-pointer"
                                    onClick={() => setExpandedSubjects({ ...expandedSubjects, [subject.id]: !isSubjExpanded })}
                                  >
                                    {isSubjExpanded ? 
                                      <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" /> : 
                                      <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                    }
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <Checkbox
                                        checked={classData.subjects[subject.id].selected}
                                        onCheckedChange={() => toggleSubject(className, subject.id)}
                                        className={`flex-shrink-0 ${isSubjIndeterminate ? 'data-[state=checked]:bg-orange-500' : ''}`}
                                      />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 flex-1">
                                      {subject.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({subjectChapters.length} ch, {subjectQuestions} q)
                                    </span>
                                  </div>
                                  
                                  {/* Chapters Level */}
                                  {isSubjExpanded && (
                                    <div className="p-2 space-y-1 bg-white">
                                      {subjectChapters.map(chapter => {
                                        const chapterQuestions = demoData.questions[chapter.id]?.length || 0;
                                        
                                        return (
                                          <div key={chapter.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                            <Checkbox
                                              checked={classData.subjects[subject.id].chapters[chapter.id].selected}
                                              onCheckedChange={() => toggleChapter(className, subject.id, chapter.id)}
                                              className="flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                              <span className="text-xs text-gray-700 font-medium block truncate">
                                                {chapter.name}
                                              </span>
                                              <span className="text-xs text-gray-400">
                                                {chapterQuestions} questions • {chapter.timer}s timer
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2 mt-3">
              <p className="text-xs text-yellow-800">
                ⚠️ Data will be added to existing content. Use "Remove Mock Data" to clear demo data only.
              </p>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="space-y-2 pt-3 border-t mt-2">
            {/* Progress Indicator - Better UI */}
            {(isInstalling || loading) && installProgress && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  <div className="flex-1">
                    <span className="text-sm text-blue-800 font-semibold block">{installProgress}</span>
                    <span className="text-xs text-blue-600">Please wait...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setShowInstallDemoDialog(false);
                setDemoSelection({});
                setExpandedClasses({});
                setExpandedSubjects({});
                setDemoData(null);
                setInstallProgress('');
                setIsInstalling(false);
              }} className="flex-1" disabled={isInstalling || loading}>
                Cancel
              </Button>
              <Button 
                onClick={handleRemoveMockData}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={loading || isInstalling}
              >
                {loading && installProgress ? '⏳' : '🗑️'} {loading ? 'Removing...' : 'Remove Mock'}
              </Button>
              <Button 
                onClick={handleInstallDemoData}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={loading || isInstalling}
              >
                {isInstalling ? '⏳' : '📥'} {isInstalling ? 'Installing...' : 'Install Selected'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Clear All Data Dialog - Mobile Responsive */}
      <Dialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Clear All Data (Selective)</DialogTitle>
            <DialogDescription>Select which data types to delete. Admin credentials & Class data will be preserved.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Selection Checkboxes */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-900 mb-2">Select Items to Clear:</h4>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearSelection.subjects}
                  onChange={(e) => setClearSelection({...clearSelection, subjects: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Subjects ({stats.totalSubjects})</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearSelection.chapters}
                  onChange={(e) => setClearSelection({...clearSelection, chapters: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Chapters ({stats.totalChapters})</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearSelection.questions}
                  onChange={(e) => setClearSelection({...clearSelection, questions: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Questions ({stats.totalQuestions})</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearSelection.reports}
                  onChange={(e) => setClearSelection({...clearSelection, reports: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Reports ({stats.totalReports})</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearSelection.backups}
                  onChange={(e) => setClearSelection({...clearSelection, backups: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Backups ({stats.totalBackups})</span>
              </label>
            </div>
            
            {/* Warning Box */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">⚠️ Warning</h4>
              <p className="text-sm text-orange-700 mb-2">
                This action cannot be undone.
              </p>
              <p className="text-sm text-orange-700 font-semibold">
                ✅ Always Protected: Admin credentials & Class data (10th, 11th, 12th)
              </p>
            </div>
            
            {/* Password fields - ALWAYS show for any deletion */}
            <div className="space-y-3 bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 font-semibold">
                🔒 Admin verification required for data deletion
              </p>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Admin Email</label>
                <Input
                  type="email"
                  value={clearAllEmail}
                  onChange={(e) => setClearAllEmail(e.target.value)}
                  placeholder="Enter admin email"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Admin Password</label>
                <Input
                  type="password"
                  value={clearAllPassword}
                  onChange={(e) => setClearAllPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowClearAllDialog(false);
                  setClearAllEmail('');
                  setClearAllPassword('');
                  setClearSelection({
                    subjects: false,
                    chapters: false,
                    questions: false,
                    reports: false,
                    backups: false
                  });
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleClearAllData}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={loading || !Object.values(clearSelection).some(v => v) || !clearAllEmail || !clearAllPassword}
              >
                {loading ? 'Clearing...' : 'Clear Selected'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* PWA Control Dialog - Smart Sync */}
      <Dialog open={showPWADialog} onOpenChange={setShowPWADialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-purple-600" />
              Smart PWA Sync - IndexedDB Storage
            </DialogTitle>
            <DialogDescription>
              Sync data directly from Firebase to IndexedDB for offline access. No manual file placement needed!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Info Banner */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-semibold text-gray-800">✨ New Smart Sync System</p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Direct Firebase → IndexedDB sync</li>
                    <li>• Automatic retry with smart error handling</li>
                    <li>• Real-time progress tracking</li>
                    <li>• No manual file placement or build required</li>
                    <li>• Works on any free hosting (Vercel, Netlify, etc.)</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Sync Data Section */}
            <div className="border-2 border-blue-100 rounded-lg p-4 bg-blue-50/30">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                Sync Class Data
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Class 10th */}
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
                      <span className="font-bold text-lg">10</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Class 10th</p>
                      <p className="text-xs text-gray-500">Sync from Firebase to IndexedDB</p>
                    </div>
                  </div>
                  <SmartSyncButton 
                    classId="10th"
                    onSyncComplete={(result) => {
                      console.log('10th sync complete:', result);
                      toast({
                        title: '✅ Class 10th Synced',
                        description: `${result.metadata?.stats?.questions || 0} questions saved`,
                        className: 'bg-green-50 border-green-200'
                      });
                    }}
                  />
                </div>
                
                {/* Class 11th */}
                <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100 text-green-600">
                      <span className="font-bold text-lg">11</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Class 11th</p>
                      <p className="text-xs text-gray-500">Sync from Firebase to IndexedDB</p>
                    </div>
                  </div>
                  <SmartSyncButton 
                    classId="11th"
                    onSyncComplete={(result) => {
                      console.log('11th sync complete:', result);
                      toast({
                        title: '✅ Class 11th Synced',
                        description: `${result.metadata?.stats?.questions || 0} questions saved`,
                        className: 'bg-green-50 border-green-200'
                      });
                    }}
                  />
                </div>
                
                {/* Class 12th */}
                <div className="bg-white p-4 rounded-lg border-2 border-pink-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-pink-100 text-pink-600">
                      <span className="font-bold text-lg">12</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Class 12th</p>
                      <p className="text-xs text-gray-500">Sync from Firebase to IndexedDB</p>
                    </div>
                  </div>
                  <SmartSyncButton 
                    classId="12th"
                    onSyncComplete={(result) => {
                      console.log('12th sync complete:', result);
                      toast({
                        title: '✅ Class 12th Synced',
                        description: `${result.metadata?.stats?.questions || 0} questions saved`,
                        className: 'bg-green-50 border-green-200'
                      });
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Features */}
            <div className="border-2 border-green-100 rounded-lg p-4 bg-green-50/30">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Smart Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <p className="font-medium text-sm text-gray-800 mb-1">🔄 Auto Retry</p>
                  <p className="text-xs text-gray-600">Failed requests automatically retry with exponential backoff</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <p className="font-medium text-sm text-gray-800 mb-1">📊 Progress Tracking</p>
                  <p className="text-xs text-gray-600">Real-time updates on subjects, chapters, and questions</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <p className="font-medium text-sm text-gray-800 mb-1">⚡ Parallel Processing</p>
                  <p className="text-xs text-gray-600">Batched requests for faster sync (5 chapters at a time)</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <p className="font-medium text-sm text-gray-800 mb-1">🛡️ Error Handling</p>
                  <p className="text-xs text-gray-600">Detailed error logs visible in Admin DevTools</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowPWADialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatabaseManagerPage;
