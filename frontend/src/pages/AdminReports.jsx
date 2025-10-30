import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flag, CheckCircle, Trash2, Edit, AlertTriangle, Eye, RotateCcw, History, Search, RefreshCw, AlertCircle, BookOpen, FileText, XCircle, ShieldCheck, ShieldX } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { getAllReports, updateReportStatus, deleteReport, markQuestionAsVerified, unmarkQuestionAsVerified, getQuestionsByChapter, updateQuestion, updateWordMeaningQuestion, getAllSubjects, getChaptersBySubject, getWordMeaningSubjects, getWordMeaningChapters, getWordMeaningPages } from '../firebase/services';
import { toast } from '../hooks/use-toast';
import QuestionEditHistoryDialog from '../components/QuestionEditHistoryDialog';

const AdminReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [pastReportsCount, setPastReportsCount] = useState(0);
  const [totalReportsCount, setTotalReportsCount] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateJson, setUpdateJson] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subjectsMap, setSubjectsMap] = useState({});
  const [chaptersMap, setChaptersMap] = useState({});

  const cleanQuestionText = (text) => {
    if (!text) return '';
    let cleaned = text.replace(/!u\s*/gi, '').replace(/\s*!u/gi, '');
    cleaned = cleaned.replace(/!b/gi, '_____');
    return cleaned;
  };

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (!isAuth) {
      navigate('/admin/login');
      return;
    }
    loadMetadata();
    loadReports();
  }, [navigate, activeTab]);

  const loadMetadata = async () => {
    try {
      const subjects = await getAllSubjects();
      const subMap = {};
      const chapMap = {};
      
      for (const subject of subjects) {
        subMap[subject.id] = subject;
        const chapters = await getChaptersBySubject(subject.id);
        chapters.forEach(ch => {
          chapMap[ch.id] = { 
            name: ch.name, 
            subjectName: subject.name, 
            className: subject.class,
            subjectId: subject.id
          };
        });
      }
      
      const wmSubjects = await getWordMeaningSubjects();
      for (const subject of wmSubjects) {
        subMap[`wm_${subject.id}`] = subject;
        const chapters = await getWordMeaningChapters(subject.id);
        for (const chapter of chapters) {
          const pages = await getWordMeaningPages(chapter.id);
          pages.forEach(page => {
            chapMap[page.id] = { 
              name: `Page ${page.pageNumber}`, 
              subjectName: subject.name, 
              className: subject.class,
              pageNumber: page.pageNumber,
              subjectId: subject.id,
              chapterId: chapter.id
            };
          });
        }
      }
      
      setSubjectsMap(subMap);
      setChaptersMap(chapMap);
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  };

  const loadReports = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const allReports = await getAllReports();
      
      if (!Array.isArray(allReports)) {
        throw new Error('Invalid reports data received');
      }
      
      const pendingReports = allReports.filter(r => r.status === 'pending');
      const pastReports = allReports.filter(r => r.status !== 'pending');
      
      const groupReports = (reportsList) => {
        const grouped = [];
        const groups = {};
        
        reportsList.forEach(report => {
          const cleanedQuestion = cleanQuestionText(report.questionText || '');
          const key = `${report.questionId}_${cleanedQuestion}`;
          
          if (!groups[key]) {
            groups[key] = {
              ...report,
              reportCount: 1,
              allReportIds: [report.id]
            };
            grouped.push(groups[key]);
          } else {
            groups[key].reportCount++;
            groups[key].allReportIds.push(report.id);
            if (report.createdAt > groups[key].createdAt) {
              groups[key] = {
                ...report,
                reportCount: groups[key].reportCount,
                allReportIds: groups[key].allReportIds
              };
            }
          }
        });
        
        return grouped;
      };
      
      const groupedPending = groupReports(pendingReports);
      const groupedPast = groupReports(pastReports);
      
      const combinedReports = activeTab === 'pending' ? groupedPending : groupedPast;
      
      setReports(combinedReports);
      setPendingReportsCount(groupedPending.length);
      setPastReportsCount(groupedPast.length);
      setTotalReportsCount(allReports.length);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load reports: ' + err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleMarkAsVerified = async (report) => {
    try {
      // Check if it's a word meaning report
      const isWordMeaningReport = report.pageId || report.isWordMeaning || report.subjectName === 'Word Meaning';
      const pageOrChapterId = isWordMeaningReport ? (report.pageId || report.chapterId) : report.chapterId;
      
      const result = await markQuestionAsVerified(report.questionId, isWordMeaningReport, pageOrChapterId);
      
      if (result.success) {
        await Promise.all(report.allReportIds.map(id => updateReportStatus(id, 'verified')));
        toast({
          title: 'Success',
          description: 'Question marked as verified',
          className: 'bg-emerald-50 border-emerald-200',
        });
        
        // Wait a bit for Firebase to propagate the change, then refresh
        await new Promise(resolve => setTimeout(resolve, 800));
        await loadReports(true);
      } else {
        throw new Error(result.error || 'Failed to mark as verified');
      }
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to verify question',
        variant: 'destructive',
      });
    }
  };

  const handleUnmarkAsVerified = async (report) => {
    try {
      // Check if it's a word meaning report
      const isWordMeaningReport = report.pageId || report.isWordMeaning || report.subjectName === 'Word Meaning';
      const pageOrChapterId = isWordMeaningReport ? (report.pageId || report.chapterId) : report.chapterId;
      
      const result = await unmarkQuestionAsVerified(report.questionId, isWordMeaningReport, pageOrChapterId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Question unmarked as verified',
          className: 'bg-emerald-50 border-emerald-200',
        });
        
        // Wait a bit for Firebase to propagate the change, then refresh
        await new Promise(resolve => setTimeout(resolve, 800));
        await loadReports(true);
      } else {
        throw new Error(result.error || 'Failed to unmark as verified');
      }
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to unverify question',
        variant: 'destructive',
      });
    }
  };

  const handleResolveReport = async (report) => {
    try {
      await Promise.all(report.allReportIds.map(id => updateReportStatus(id, 'resolved')));
      toast({
        title: 'Success',
        description: 'Report marked as resolved',
        className: 'bg-emerald-50 border-emerald-200',
      });
      
      // Immediately refresh reports
      setTimeout(() => {
        loadReports(true);
      }, 500);
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleRestoreToPending = async (report) => {
    try {
      await Promise.all(report.allReportIds.map(id => updateReportStatus(id, 'pending')));
      toast({
        title: 'Success',
        description: 'Report restored to pending',
        className: 'bg-emerald-50 border-emerald-200',
      });
      
      // Immediately refresh reports
      setTimeout(() => {
        loadReports(true);
      }, 500);
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleViewQuestion = async (report) => {
    try {
      let questions = [];
      const isWordMeaningReport = report.pageId || report.isWordMeaning || report.subjectName === 'Word Meaning';
      
      if (isWordMeaningReport) {
        const pageId = report.pageId || report.chapterId;
        const { getWordMeaningQuestionsByPage } = await import('../firebase/services');
        questions = await getWordMeaningQuestionsByPage(pageId);
      } else {
        questions = await getQuestionsByChapter(report.chapterId);
      }
      
      const question = questions.find(q => q.id === report.questionId);
      if (question) {
        setPreviewQuestion(question);
        setShowPreviewDialog(true);
      } else {
        throw new Error('Question not found');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReport = async (report) => {
    if (!window.confirm(`Delete ${report.reportCount > 1 ? `all ${report.reportCount} reports` : 'this report'} for this question?`)) return;
    
    try {
      await Promise.all(report.allReportIds.map(id => deleteReport(id)));
      toast({
        title: 'Success',
        description: 'Report(s) deleted successfully',
        className: 'bg-emerald-50 border-emerald-200',
      });
      
      // Immediately refresh reports
      setTimeout(() => {
        loadReports(true);
      }, 500);
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateQuestion = async (report) => {
    try {
      let questions = [];
      const isWordMeaningReport = report.pageId || report.isWordMeaning || report.subjectName === 'Word Meaning';
      
      if (isWordMeaningReport) {
        const pageId = report.pageId || report.chapterId;
        const { getWordMeaningQuestionsByPage } = await import('../firebase/services');
        questions = await getWordMeaningQuestionsByPage(pageId);
      } else {
        questions = await getQuestionsByChapter(report.chapterId);
      }
      
      const question = questions.find(q => q.id === report.questionId);
      
      if (question) {
        setSelectedReport(report);
        const questionData = { 
          question: question.question, 
          answer: question.answer, 
          options: question.options 
        };
        // Always include verified status (true, false, or undefined)
        if (question.verified !== undefined) {
          questionData.verified = question.verified;
        }
        if (question.remarks) questionData.remarks = question.remarks;
        
        setUpdateJson(JSON.stringify({ questions: [questionData] }, null, 2));
        setShowUpdateDialog(true);
      } else {
        throw new Error('Question not found in database');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveUpdate = async () => {
    if (!selectedReport || !updateJson.trim()) return;
    
    setIsUpdating(true);
    try {
      const json = JSON.parse(updateJson);
      const questions = json.questions || [];
      
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid JSON format');
      }
      
      const questionData = questions[0];
      let result;
      
      const isWordMeaningReport = selectedReport.pageId || selectedReport.isWordMeaning || selectedReport.subjectName === 'Word Meaning';
      
      if (isWordMeaningReport) {
        const pageId = selectedReport.pageId || selectedReport.chapterId;
        result = await updateWordMeaningQuestion(pageId, selectedReport.questionId, questionData);
      } else {
        result = await updateQuestion(selectedReport.chapterId, selectedReport.questionId, questionData);
      }
      
      if (result.success) {
        toast({ 
          title: 'Success', 
          description: 'Question updated successfully',
          className: 'bg-emerald-50 border-emerald-200',
        });
        setShowUpdateDialog(false);
        setUpdateJson('');
        setSelectedReport(null);
        loadReports(true);
      } else {
        throw new Error(result.error || 'Failed to update');
      }
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: err.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchQuery === '' || 
      cleanQuestionText(report.questionText).toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || report.reportType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 shadow-md max-w-md w-full border border-red-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">Error Loading Reports</h2>
          <p className="text-sm text-gray-600 mb-4 text-center">{error}</p>
          <div className="flex gap-2">
            <Button onClick={() => loadReports()} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => navigate('/admin/dashboard')} variant="outline" className="flex-1">
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-orange-600" />
                  Question Reports
                </h1>
                <p className="text-xs text-gray-500">Manage reported questions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingReportsCount > 0 && (
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-medium text-sm">
                  {pendingReportsCount} Pending
                </div>
              )}
              <button
                onClick={() => loadReports(true)}
                disabled={isRefreshing}
                className="p-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 shadow-sm border">
            <p className="text-xs text-gray-500 mb-1">Total Reports</p>
            <p className="text-xl font-semibold text-gray-800">{totalReportsCount}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 shadow-sm border border-orange-200">
            <p className="text-xs text-orange-600 mb-1">Unique Pending</p>
            <p className="text-xl font-semibold text-orange-700">{pendingReportsCount}</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border">
            <p className="text-xs text-gray-500 mb-1">Past Reports</p>
            <p className="text-xl font-semibold text-gray-800">{pastReportsCount}</p>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === 'pending'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Pending ({pendingReportsCount})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === 'past'
                  ? 'bg-gray-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Past ({pastReportsCount})
            </button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 text-gray-400 w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by question or feedback..."
                className="pl-9 h-9 text-sm"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-white hover:bg-gray-50 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="question">Question</option>
              <option value="options">Options</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg p-8 shadow-sm border">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-base font-medium text-gray-400 mb-1">No Reports Found</p>
                <p className="text-sm text-gray-400">
                  {searchQuery || filterType !== 'all' ? 'Try adjusting filters' : 'Reports will appear here'}
                </p>
              </div>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className={`bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow ${
                  report.status === 'pending'
                    ? 'border-orange-200 bg-orange-50/30'
                    : report.status === 'verified'
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-gray-200'
                }`}
              >
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2 bg-gray-50 px-2 py-1.5 rounded border border-gray-200 w-fit">
                  <span className="font-semibold text-gray-700">
                    {chaptersMap[report.pageId || report.chapterId]?.className || report.className || ''}
                  </span>
                  {(chaptersMap[report.pageId || report.chapterId]?.className || report.className) && (
                    <span className="text-gray-400">›</span>
                  )}
                  <BookOpen className="w-3.5 h-3.5 text-gray-500" />
                  <span className="font-medium">{report.subjectName || 'Unknown'}</span>
                  <span className="text-gray-400">›</span>
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    {chaptersMap[report.pageId || report.chapterId]?.name || 
                     (report.isWordMeaning 
                       ? (chaptersMap[report.pageId || report.chapterId]?.pageNumber 
                           ? `Page ${chaptersMap[report.pageId || report.chapterId]?.pageNumber}` 
                           : `Page ${(report.pageId || report.chapterId)?.slice(-2)}`)
                       : `Chapter ${report.chapterId?.slice(0, 8)}`)}
                  </span>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                      report.reportType === 'question'
                        ? 'bg-red-100 text-red-700'
                        : report.reportType === 'options'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {report.reportType === 'question' && <><XCircle className="w-3 h-3" />Question</>}
                    {report.reportType === 'options' && <><AlertTriangle className="w-3 h-3" />Options</>}
                    {report.reportType === 'both' && <><AlertCircle className="w-3 h-3" />Both</>}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                      report.status === 'pending'
                        ? 'bg-orange-100 text-orange-700'
                        : report.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {report.status === 'pending' && <><AlertTriangle className="w-3 h-3" />Pending</>}
                    {report.status === 'verified' && <><ShieldCheck className="w-3 h-3" />Verified</>}
                    {report.status === 'resolved' && <><CheckCircle className="w-3 h-3" />Resolved</>}
                  </span>
                  {report.reportCount > 1 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-500 text-white font-bold">
                      {report.reportCount}×
                    </span>
                  )}
                  <span className="ml-auto text-xs text-gray-400">
                    {new Date(report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {/* Question */}
                <div className="bg-gray-50 rounded-md p-3 mb-3 border">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Question:</p>
                  <p className="text-sm text-gray-800 leading-relaxed">{cleanQuestionText(report.questionText)}</p>
                </div>

                {/* Feedback */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Student Feedback:</p>
                  <p className="text-sm text-gray-700 italic bg-blue-50 p-2 rounded border border-blue-100">
                    "{report.description}"
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap pt-2 border-t">
                  <Button size="sm" onClick={() => handleViewQuestion(report)} variant="outline" className="h-8 text-xs">
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    View
                  </Button>
                  <Button size="sm" onClick={() => { setSelectedReport(report); setShowHistoryDialog(true); }} variant="outline" className="h-8 text-xs">
                    <History className="w-3.5 h-3.5 mr-1" />
                    Details
                  </Button>
                  
                  {report.status === 'pending' ? (
                    <>
                      <Button size="sm" onClick={() => handleUpdateQuestion(report)} variant="outline" className="h-8 text-xs">
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" onClick={() => handleResolveReport(report)} variant="outline" className="h-8 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Resolve
                      </Button>
                      {report.questionVerified ? (
                        <Button size="sm" onClick={() => handleUnmarkAsVerified(report)} className="h-8 text-xs bg-orange-500 hover:bg-orange-600">
                          <ShieldX className="w-3.5 h-3.5 mr-1" />
                          Unverify
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => handleMarkAsVerified(report)} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                          Verify
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button size="sm" onClick={() => handleRestoreToPending(report)} className="h-8 text-xs bg-orange-500 hover:bg-orange-600">
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Restore
                    </Button>
                  )}
                  <Button size="sm" onClick={() => handleDeleteReport(report)} variant="outline" className="h-8 text-xs text-red-600 hover:bg-red-50 ml-auto">
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Dialogs */}
      <QuestionEditHistoryDialog
        isOpen={showHistoryDialog}
        onClose={() => { setShowHistoryDialog(false); setSelectedReport(null); }}
        report={selectedReport}
        onEdit={handleUpdateQuestion}
        onRefresh={() => loadReports(true)}
      />
      
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl" aria-describedby="update-dialog-description">
          <DialogHeader>
            <DialogTitle className="text-lg">Update Question</DialogTitle>
            <DialogDescription id="update-dialog-description" className="text-sm">Edit the question JSON below</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={updateJson}
              onChange={(e) => setUpdateJson(e.target.value)}
              className="min-h-[300px] font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowUpdateDialog(false); setUpdateJson(''); setSelectedReport(null); }} className="flex-1" disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleSaveUpdate} disabled={isUpdating || !updateJson.trim()} className="flex-1">
                {isUpdating ? 'Updating...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl" aria-describedby="preview-dialog-description">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              Question Preview
              {previewQuestion?.verified ? (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                  <ShieldX className="w-3.5 h-3.5" />
                  Unverified
                </span>
              )}
            </DialogTitle>
            <DialogDescription id="preview-dialog-description" className="sr-only">
              Preview of the reported question with options and remarks
            </DialogDescription>
          </DialogHeader>
          {previewQuestion && (
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-xs text-purple-600 font-medium mb-2">Question:</p>
                <p className="text-base font-medium text-gray-800">{previewQuestion.question}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Options:</p>
                {previewQuestion.options && previewQuestion.options.map((option, index) => {
                  const isCorrect = previewQuestion.answer === option;
                  const remark = previewQuestion.remarks && previewQuestion.remarks[index];
                  return (
                    <div key={index} className="space-y-1">
                      <div className={`p-3 rounded-lg border ${isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-white border text-gray-700'}`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-sm">{option}</span>
                          {isCorrect && <span className="ml-auto text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-medium">Correct</span>}
                        </div>
                      </div>
                      {remark && (
                        <div className={`text-xs px-3 py-2 rounded-lg ml-8 ${
                          isCorrect 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-gray-50 text-gray-600 border border-gray-200'
                        }`}>
                          <span className="font-medium">Remark:</span> {remark}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {previewQuestion.remarks && typeof previewQuestion.remarks === 'string' && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-2">General Remarks:</p>
                  <p className="text-sm text-gray-700">{previewQuestion.remarks}</p>
                </div>
              )}
              
              <Button onClick={() => setShowPreviewDialog(false)} className="w-full">Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
