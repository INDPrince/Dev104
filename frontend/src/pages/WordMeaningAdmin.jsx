import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, Library, BookOpen, FileText, MoreVertical } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { 
  getWordMeaningSubjects, 
  getWordMeaningChapters, 
  getWordMeaningPages,
  getWordMeaningQuestions,
  createWordMeaningSubject,
  createWordMeaningChapter,
  createWordMeaningPage,
  deleteWordMeaningSubject,
  deleteWordMeaningChapter,
  deleteWordMeaningPage,
  uploadWordMeaningQuestions
} from '../firebase/services';
import { toast } from '../hooks/use-toast';

const WordMeaningAdmin = () => {
  const navigate = useNavigate();
  
  // State
  const [selectedClass, setSelectedClass] = useState('All');
  const [allSubjects, setAllSubjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Dialogs
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showChapterDialog, setShowChapterDialog] = useState(false);
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  
  // Forms
  const [subjectForm, setSubjectForm] = useState({ name: '', class: '11th' });
  const [chapterForm, setChapterForm] = useState({ name: '', serial: 1 });
  const [pageForm, setPageForm] = useState({ pageNumber: 1, name: '' });
  const [selectedPage, setSelectedPage] = useState(null);
  const [jsonFile, setJsonFile] = useState(null);
  const [pastedJson, setPastedJson] = useState('');
  const [uploadMode, setUploadMode] = useState('file');
  const [isUploading, setIsUploading] = useState(false);
  
  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (!isAuth) {
      navigate('/admin/login');
      return;
    }
    loadSubjects();
  }, [navigate, selectedClass]);
  
  const loadSubjects = async () => {
    setLoading(true);
    const data = await getWordMeaningSubjects();
    // Load all subjects with chapter counts
    const updated = await Promise.all(data.map(async (subject) => {
      const subjectChapters = await getWordMeaningChapters(subject.id);
      return { ...subject, totalChapters: subjectChapters.length };
    }));
    
    setAllSubjects(updated);
    filterSubjectsByClass('All', updated);
    setLoading(false);
  };
  
  const filterSubjectsByClass = (classFilter, subjectsData = allSubjects) => {
    if (classFilter === 'All') {
      setSubjects(subjectsData);
    } else {
      const filtered = subjectsData.filter(s => s.class === classFilter);
      setSubjects(filtered);
    }
    setSelectedClass(classFilter);
  };
  
  const loadChapters = async (subjectId) => {
    const data = await getWordMeaningChapters(subjectId);
    // Add subjectId to each chapter so we can use it for deletion
    const chaptersWithSubjectId = data.map(chapter => ({
      ...chapter,
      subjectId: subjectId
    }));
    setChapters(chaptersWithSubjectId);
  };
  
  const loadPages = async (chapterId) => {
    const data = await getWordMeaningPages(chapterId);
    // Add chapterId to each page so we can use it for deletion
    const pagesWithChapterId = data.map(page => ({
      ...page,
      chapterId: chapterId
    }));
    setPages(pagesWithChapterId);
  };
  
  const handleCreateSubject = async () => {
    if (!subjectForm.name.trim()) return;
    
    const result = await createWordMeaningSubject({ 
      name: subjectForm.name, 
      class: subjectForm.class,
      totalChapters: 0
    });
    
    if (result.success) {
      toast({ 
        title: '✅ Success', 
        description: `Word Meaning subject "${subjectForm.name}" created`,
        className: 'bg-emerald-50 border-emerald-200',
      });
      setShowSubjectDialog(false);
      setSubjectForm({ name: '', class: selectedClass === 'All' ? '11th' : selectedClass });
      loadSubjects();
    }
  };
  
  const handleCreateChapter = async () => {
    if (!chapterForm.name.trim() || !selectedSubject) return;
    
    const serial = chapters.length + 1;
    const result = await createWordMeaningChapter(selectedSubject.id, {
      name: chapterForm.name,
      serial: chapterForm.serial || serial,
      totalPages: 0
    });
    
    if (result.success) {
      toast({ 
        title: '✅ Success', 
        description: `Chapter "${chapterForm.name}" created`,
        className: 'bg-emerald-50 border-emerald-200',
      });
      setShowChapterDialog(false);
      setChapterForm({ name: '', serial: 1 });
      loadChapters(selectedSubject.id);
    }
  };
  
  const handleCreatePage = async () => {
    if (!pageForm.pageNumber || !selectedChapter) return;
    
    const result = await createWordMeaningPage(selectedChapter.id, {
      pageNumber: parseInt(pageForm.pageNumber),
      name: pageForm.name || `Page ${pageForm.pageNumber}`,
      questionCount: 0
    });
    
    if (result.success) {
      toast({ 
        title: '✅ Success', 
        description: `Page ${pageForm.pageNumber} created`,
        className: 'bg-emerald-50 border-emerald-200',
      });
      setShowPageDialog(false);
      setPageForm({ pageNumber: 1, name: '' });
      loadPages(selectedChapter.id);
    }
  };
  
  const handleUploadQuestions = async () => {
    if (!selectedPage) return;
    
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
            json = JSON.parse(e.target.result);
            const questions = json.questions || [];
            
            if (!Array.isArray(questions) || questions.length === 0) {
              toast({ title: 'Error', description: 'Invalid JSON format', variant: 'destructive' });
              setIsUploading(false);
              return;
            }
            
            const result = await uploadWordMeaningQuestions(selectedPage.id, questions);
            if (result.success) {
              toast({ 
                title: '✅ Success', 
                description: `${questions.length} questions uploaded`,
                className: 'bg-emerald-50 border-emerald-200',
              });
              setShowUploadDialog(false);
              setJsonFile(null);
              setPastedJson('');
              setSelectedPage(null);
              if (selectedChapter) {
                loadPages(selectedChapter.id);
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
        
        const result = await uploadWordMeaningQuestions(selectedPage.id, questions);
        if (result.success) {
          toast({ 
            title: '✅ Success', 
            description: `${questions.length} questions uploaded`,
            className: 'bg-emerald-50 border-emerald-200',
          });
          setShowUploadDialog(false);
          setJsonFile(null);
          setPastedJson('');
          setSelectedPage(null);
          if (selectedChapter) {
            loadPages(selectedChapter.id);
          }
        }
        setIsUploading(false);
      }
    } catch (error) {
      toast({ title: '❌ Error', description: 'Failed to parse JSON', variant: 'destructive' });
      setIsUploading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Left side - Back button and Title */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-purple-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <Library className="w-6 h-6 text-white" />
              </div>
              {/* Desktop Title */}
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-gray-800">Word Meaning Management</h1>
                <p className="text-xs text-gray-500">Manage vocabulary subjects, chapters & pages</p>
              </div>
              {/* Mobile Title */}
              <h1 className="md:hidden text-lg font-bold text-gray-800 truncate">Word Meaning</h1>
            </div>
            
            {/* Right side - Filter Buttons and Menu */}
            <div className="flex items-center gap-2">
              {/* Class Filter Buttons - Desktop */}
              <div className="hidden md:flex gap-2">
                {['All', '10th', '11th', '12th'].map((cls) => (
                  <button
                    key={cls}
                    onClick={() => filterSubjectsByClass(cls)}
                    className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                      selectedClass === cls
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-200'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
              
              {/* Mobile Three Dots Menu */}
              <div className="md:hidden relative">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-purple-600" />
                </button>
                
                {/* Mobile Dropdown */}
                {showMobileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-purple-200 p-3 z-50">
                    <p className="text-sm text-gray-600 mb-3">Manage vocabulary subjects, chapters & pages</p>
                    <div className="flex flex-wrap gap-2">
                      {['All', '10th', '11th', '12th'].map((cls) => (
                        <button
                          key={cls}
                          onClick={() => {
                            filterSubjectsByClass(cls);
                            setShowMobileMenu(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                            selectedClass === cls
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-purple-50'
                          }`}
                        >
                          {cls}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content - 3 Columns */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Subjects */}
          <div className="bg-white rounded-xl p-6 border-2 border-purple-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Subjects
              </h2>
              <Button
                onClick={() => setShowSubjectDialog(true)}
                size="sm"
                className="bg-purple-500 hover:bg-purple-600"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {subjects.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No subjects yet</p>
              ) : (
                subjects.map(subject => (
                  <div
                    key={subject.id}
                    onClick={() => {
                      setSelectedSubject(subject);
                      loadChapters(subject.id);
                      setSelectedChapter(null);
                      setPages([]);
                    }}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedSubject?.id === subject.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{subject.name}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">{subject.totalChapters || 0} Chapters</p>
                          {subject.class && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {subject.class}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${subject.name}" and all its chapters/pages?`)) {
                            deleteWordMeaningSubject(subject.id).then(() => {
                              toast({ 
                                title: '✅ Deleted', 
                                description: `Subject deleted`,
                                className: 'bg-emerald-50 border-emerald-200',
                              });
                              if (selectedSubject?.id === subject.id) {
                                setSelectedSubject(null);
                                setChapters([]);
                                setPages([]);
                              }
                              loadSubjects();
                            });
                          }
                        }}
                        className="p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Column 2: Chapters */}
          <div className="bg-white rounded-xl p-6 border-2 border-purple-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Chapters
              </h2>
              <Button
                onClick={() => {
                  if (!selectedSubject) {
                    toast({ title: 'Select Subject', description: 'Please select a subject first', variant: 'destructive' });
                    return;
                  }
                  setShowChapterDialog(true);
                }}
                size="sm"
                className="bg-purple-500 hover:bg-purple-600"
                disabled={!selectedSubject}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {!selectedSubject ? (
                <p className="text-sm text-gray-500 text-center py-8">Select a subject</p>
              ) : chapters.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No chapters yet</p>
              ) : (
                chapters.map(chapter => (
                  <div
                    key={chapter.id}
                    onClick={() => {
                      setSelectedChapter(chapter);
                      loadPages(chapter.id);
                    }}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedChapter?.id === chapter.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{chapter.name}</h3>
                        <p className="text-xs text-gray-500">{chapter.totalPages || 0} Pages</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${chapter.name}" and all its pages?`)) {
                            const subId = chapter.subjectId || selectedSubject?.id;
                            if (!subId) {
                              toast({ 
                                title: '❌ Error', 
                                description: 'Cannot find subject ID for this chapter',
                                variant: 'destructive'
                              });
                              return;
                            }
                            deleteWordMeaningChapter(subId, chapter.id).then(() => {
                              toast({ 
                                title: '✅ Deleted', 
                                description: `Chapter deleted`,
                                className: 'bg-emerald-50 border-emerald-200',
                              });
                              if (selectedChapter?.id === chapter.id) {
                                setSelectedChapter(null);
                                setPages([]);
                              }
                              if (selectedSubject?.id) {
                                loadChapters(selectedSubject.id);
                              }
                            });
                          }
                        }}
                        className="p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Column 3: Pages */}
          <div className="bg-white rounded-xl p-6 border-2 border-purple-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Pages</h2>
              <Button
                onClick={() => {
                  if (!selectedChapter) {
                    toast({ title: 'Select Chapter', description: 'Please select a chapter first', variant: 'destructive' });
                    return;
                  }
                  setShowPageDialog(true);
                }}
                size="sm"
                className="bg-purple-500 hover:bg-purple-600"
                disabled={!selectedChapter}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {!selectedChapter ? (
                <p className="text-sm text-gray-500 text-center py-8">Select a chapter</p>
              ) : pages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No pages yet</p>
              ) : (
                pages.map(page => (
                  <div
                    key={page.id}
                    className="p-3 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">Page {page.pageNumber}</h3>
                        <p className="text-xs text-gray-500">{page.questionCount || 0} Questions</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            setSelectedPage(page);
                            // Load existing questions and prepopulate JSON
                            try {
                              const existingQuestions = await getWordMeaningQuestions(page.id);
                              
                              if (existingQuestions && existingQuestions.length > 0) {
                                // Prepopulate with existing questions
                                const jsonData = {
                                  questions: existingQuestions.map(q => ({
                                    question: q.question,
                                    answer: q.answer,
                                    options: q.options,
                                    ...(q.remarks ? { remarks: q.remarks } : {}),
                                    ...(q.verified ? { verified: true } : {})
                                  }))
                                };
                                setPastedJson(JSON.stringify(jsonData, null, 2));
                                setUploadMode('paste');
                              } else {
                                // Empty template if no existing questions
                                setPastedJson('');
                              }
                            } catch (error) {
                              console.error('Error loading questions:', error);
                              setPastedJson('');
                            }
                            setShowUploadDialog(true);
                          }}
                          className="p-1 hover:bg-blue-50 rounded"
                        >
                          <Upload className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete Page ${page.pageNumber} and all its questions?`)) {
                              const chapId = page.chapterId || selectedChapter?.id;
                              if (!chapId) {
                                toast({ 
                                  title: '❌ Error', 
                                  description: 'Cannot find chapter ID for this page',
                                  variant: 'destructive'
                                });
                                return;
                              }
                              deleteWordMeaningPage(chapId, page.id).then(() => {
                                toast({ 
                                  title: '✅ Deleted', 
                                  description: `Page deleted`,
                                  className: 'bg-emerald-50 border-emerald-200',
                                });
                                if (selectedChapter?.id) {
                                  loadPages(selectedChapter.id);
                                }
                              });
                            }
                          }}
                          className="p-1 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Dialogs */}
      
      {/* Create Subject Dialog */}
      <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Word Meaning Subject</DialogTitle>
            <DialogDescription>Add a new subject for word meaning practice</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject Name</label>
              <Input
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                placeholder="e.g., English Vocabulary"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Class</label>
              <select
                value={subjectForm.class}
                onChange={(e) => setSubjectForm({ ...subjectForm, class: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
              >
                <option value="10th">10th</option>
                <option value="11th">11th</option>
                <option value="12th">12th</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSubjectDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateSubject} className="flex-1 bg-purple-600 hover:bg-purple-700">
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
            <DialogTitle>Create Chapter</DialogTitle>
            <DialogDescription>Add a new chapter to organize vocabulary by topics</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Chapter Name</label>
              <Input
                value={chapterForm.name}
                onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
                placeholder="e.g., Unit 1: Common Words"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Serial Number</label>
              <Input
                type="number"
                value={chapterForm.serial}
                onChange={(e) => setChapterForm({ ...chapterForm, serial: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowChapterDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateChapter} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Create Page Dialog */}
      <Dialog open={showPageDialog} onOpenChange={setShowPageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Page</DialogTitle>
            <DialogDescription>Add a page with vocabulary questions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Page Number</label>
              <Input
                type="number"
                value={pageForm.pageNumber}
                onChange={(e) => setPageForm({ ...pageForm, pageNumber: parseInt(e.target.value) })}
                min="1"
                placeholder="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Page Name (Optional)</label>
              <Input
                value={pageForm.name}
                onChange={(e) => setPageForm({ ...pageForm, name: e.target.value })}
                placeholder="e.g., Page 1 or leave empty"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPageDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreatePage} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Upload Questions Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upload Questions for Page {selectedPage?.pageNumber}</DialogTitle>
            <DialogDescription>Upload vocabulary questions in JSON format</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={uploadMode === 'file' ? 'default' : 'outline'}
                onClick={() => setUploadMode('file')}
                size="sm"
              >
                Upload File
              </Button>
              <Button
                variant={uploadMode === 'paste' ? 'default' : 'outline'}
                onClick={() => setUploadMode('paste')}
                size="sm"
              >
                Paste JSON
              </Button>
            </div>
            
            {uploadMode === 'file' ? (
              <div>
                <label className="text-sm font-medium mb-2 block">Select JSON File</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setJsonFile(e.target.files[0])}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium mb-2 block">Paste JSON</label>
                <textarea
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder='{"questions": [{"question": "...", "answer": "...", "options": [...]}]}'
                  className="w-full min-h-[200px] p-3 border-2 border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false);
                  setJsonFile(null);
                  setPastedJson('');
                  setSelectedPage(null);
                }}
                className="flex-1"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadQuestions}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Questions'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  );
};

export default WordMeaningAdmin;
