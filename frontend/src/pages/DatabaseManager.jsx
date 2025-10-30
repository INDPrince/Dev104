import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Download, Upload, Trash2, Edit, Search, Filter, RefreshCw, Archive, AlertTriangle, CheckCircle, X, Eye, Save, Undo, FileUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { getAllSubjects, getChaptersBySubject, getAllReports, getAdminCredentials, getQuestionsByChapter, getAllBackups, createBackup, restoreFromBackup, deleteBackup, normalDelete, completeDelete, applyBackupChanges, importDatabase } from '../firebase/services';
import { toast } from '../hooks/use-toast';

const DatabaseManager = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get selected class from localStorage
  const selectedClass = localStorage.getItem('adminSelectedClass') || '11th';
  
  // Filter states for questions
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('all');
  
  // Data states
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [reports, setReports] = useState([]);
  const [adminCreds, setAdminCreds] = useState(null);
  const [backups, setBackups] = useState([]);
  
  // Stats
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
  const [deleteType, setDeleteType] = useState('normal'); // 'normal' or 'complete'
  
  // Import states
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);
  const [importMode, setImportMode] = useState('all'); // 'all' or 'selective'
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [subjectsData, reportsData, adminData, backupsData] = await Promise.all([
        getAllSubjects(),
        getAllReports(),
        getAdminCredentials(),
        getAllBackups()
      ]);
      
      // Filter subjects by selected class
      const filteredSubjects = subjectsData.filter(s => s.class === selectedClass || !s.class);
      
      setSubjects(filteredSubjects);
      setReports(reportsData);
      setAdminCreds(adminData);
      setBackups(backupsData);
      
      // Load chapters and questions - OPTIMIZED with Promise.all
      // First, get all chapters in parallel
      const chapterPromises = filteredSubjects.map(subject => getChaptersBySubject(subject.id));
      const chaptersArrays = await Promise.all(chapterPromises);
      const allChapters = chaptersArrays.flat();
      
      // Then, get all questions in parallel
      const questionPromises = allChapters.map(chapter => getQuestionsByChapter(chapter.id));
      const questionsArrays = await Promise.all(questionPromises);
      const allQuestions = questionsArrays.flat();
      
      setChapters(allChapters);
      setQuestions(allQuestions);
      
      // Calculate stats - for selected class only
      setStats({
        totalSubjects: filteredSubjects.length,
        totalChapters: allChapters.length,
        totalQuestions: allQuestions.length,
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
        subjects,
        chapters,
        questions,
        reports,
        admin: adminCreds,
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
          description: `Database imported successfully`,
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

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    
    setLoading(true);
    try {
      const { type, data } = selectedItem;
      
      if (deleteType === 'complete') {
        // Complete delete with permanent backup + auto download
        const result = await completeDelete(type, data);
        if (result.success) {
          // Auto download backup
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
            description: `${type} deleted permanently. Backup saved and downloaded.`,
            className: 'bg-red-50 border-red-200',
          });
        }
      } else {
        // Normal delete with 7-day backend storage
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

  const handleRestoreBackup = async (backup) => {
    if (!window.confirm('Are you sure you want to restore this backup? Current data will be overwritten.')) return;
    
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <p className="text-sm font-medium text-indigo-900 truncate">{adminCreds?.email}</p>
      </div>
    </div>
  );

  const renderSubjects = () => (
    <div className="space-y-3">
      {subjects.filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(subject => (
        <div key={subject.id} className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{subject.name}</h3>
              <p className="text-sm text-gray-500">Class: {subject.class} • {subject.totalChapters} chapters</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedItem({ type: 'subject', data: subject });
                  setShowDeleteDialog(true);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderChapters = () => (
    <div className="space-y-3">
      {chapters.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(chapter => (
        <div key={chapter.id} className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{chapter.name}</h3>
              <p className="text-sm text-gray-500">{chapter.questionCount} questions • Timer: {chapter.timer}s</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedItem({ type: 'chapter', data: chapter });
                  setShowDeleteDialog(true);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderQuestions = () => {
    // Filter questions based on selected subject and chapter
    let filteredQuestions = questions;
    
    if (selectedSubjectFilter !== 'all') {
      // Get chapters for this subject
      const subjectChapters = chapters.filter(c => c.subjectId === selectedSubjectFilter);
      const chapterIds = subjectChapters.map(c => c.id);
      filteredQuestions = filteredQuestions.filter(q => chapterIds.includes(q.chapterId));
    }
    
    if (selectedChapterFilter !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.chapterId === selectedChapterFilter);
    }
    
    // Apply search filter
    filteredQuestions = filteredQuestions.filter(q => 
      q.question?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return (
      <div>
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <select
            value={selectedSubjectFilter}
            onChange={(e) => {
              setSelectedSubjectFilter(e.target.value);
              setSelectedChapterFilter('all');
            }}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          
          <select
            value={selectedChapterFilter}
            onChange={(e) => setSelectedChapterFilter(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
            disabled={selectedSubjectFilter === 'all'}
          >
            <option value="all">All Chapters</option>
            {chapters
              .filter(c => selectedSubjectFilter === 'all' || c.subjectId === selectedSubjectFilter)
              .map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>
        </div>
        
        {/* Questions List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {filteredQuestions.map(question => (
            <div key={question.id} className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-800 mb-2">{question.question}</p>
                  <p className="text-sm text-emerald-600">Answer: {question.answer}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {question.options?.map((opt, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">{opt}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedItem({ type: 'question', data: question });
                    setShowDeleteDialog(true);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
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

  const renderReports = () => (
    <div className="space-y-3">
      {reports.filter(r => r.reason?.toLowerCase().includes(searchQuery.toLowerCase())).map(report => (
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
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderBackups = () => (
    <div className="space-y-3">
      {backups.map(backup => {
        const itemName = backup.data?.name || backup.data?.question || backup.data?.reason || 'Unknown';
        const relatedInfo = backup.relatedData ? 
          `${backup.relatedData.chapters?.length || 0} chapters, ${Object.values(backup.relatedData.questions || {}).flat().length || 0} questions` : '';
        
        return (
          <div key={backup.id} className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-teal-300 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">
                  {backup.type === 'complete' ? '🔴 Complete Delete' : '🟠 Normal Delete'} - {backup.itemType}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
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
              <div className="flex gap-2">
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
    { id: 'subjects', label: 'Subjects', icon: Database, count: stats.totalSubjects },
    { id: 'chapters', label: 'Chapters', icon: Database, count: stats.totalChapters },
    { id: 'questions', label: 'Questions', icon: Database, count: stats.totalQuestions },
    { id: 'reports', label: 'Reports', icon: AlertTriangle, count: stats.totalReports },
    { id: 'backups', label: 'Backups', icon: Archive, count: stats.totalBackups },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-6 h-6 text-emerald-600" />
              Database Manager
            </DialogTitle>
            <div className="flex gap-2">
              <label htmlFor="import-file" className="cursor-pointer">
                <Button size="sm" variant="outline" asChild>
                  <span>
                    <FileUp className="w-4 h-4 mr-1" />
                    Import
                  </span>
                </Button>
              </label>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
              <Button onClick={handleExportBackup} size="sm" variant="outline">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button onClick={loadAllData} size="sm" variant="outline" className="px-2">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-100 text-emerald-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        {activeTab !== 'overview' && (
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
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
        <div className="flex-1 overflow-y-auto">
          {loading ? (
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
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedItem?.type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">
              Choose delete type:
            </p>
            
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Database</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">
              Choose import mode:
            </p>
            
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
                  <Filter className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Selective Import</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Choose specific subjects to import with their chapters and questions
                    </p>
                  </div>
                </div>
              </button>
            </div>
            
            {importMode === 'selective' && importData?.subjects && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Select Subjects:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg p-3">
                  {importData.subjects.map(subject => (
                    <label key={subject.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
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
                      <span className="text-sm font-medium">{subject.name}</span>
                      <span className="text-xs text-gray-500">({subject.class})</span>
                    </label>
                  ))}
                </div>
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
    </Dialog>
  );
};

export default DatabaseManager;

