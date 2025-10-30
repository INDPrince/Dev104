import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flag, CheckCircle, Trash2, Edit, AlertTriangle, ShieldCheckCheck, ChevronDown, X, History, Eye, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { getAllReports, updateReportStatus, deleteReport, markQuestionAsVerified, unmarkQuestionAsVerified, getQuestionsByChapter, getAllSubjects, getChaptersBySubject, uploadQuestions, updateQuestion, updateWordMeaningQuestion } from '../firebase/services';
import { toast } from '../hooks/use-toast';
import QuestionEditHistoryDialog from '../components/QuestionEditHistoryDialog';

const AdminReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [pastReportsCount, setPastReportsCount] = useState(0);
  const [totalReportsCount, setTotalReportsCount] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateJson, setUpdateJson] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'past'
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);

  // Helper function to clean formatting markers from question text
  const cleanQuestionText = (text) => {
    if (!text) return '';
    // Remove !u markers (underline) - handle with or without spaces, globally
    let cleaned = text.replace(/!u\s*/gi, '').replace(/\s*!u/gi, '');
    // Remove !b markers (blank)
    cleaned = cleaned.replace(/!b/gi, '_____');
    return cleaned;
  };

  useEffect(() => {
    // Check auth
    const isAuth = localStorage.getItem('adminAuth');
    if (!isAuth) {
      navigate('/admin/login');
      return;
    }
    loadReports();
  }, [navigate, activeTab]);

  const loadReports = async () => {
    setLoading(true);
    const allReports = await getAllReports();
    
    // Separate pending and past reports
    const pendingReports = allReports.filter(r => r.status === 'pending');
    const pastReports = allReports.filter(r => r.status !== 'pending');
    
    // Group pending reports by question
    const groupedPending = [];
    const pendingGroups = {};
    
    pendingReports.forEach(report => {
      const cleanedQuestion = cleanQuestionText(report.questionText || '');
      const key = `${report.questionId}_${cleanedQuestion}`;
      
      if (!pendingGroups[key]) {
        pendingGroups[key] = {
          ...report,
          reportCount: 1,
          allReportIds: [report.id]
        };
        groupedPending.push(pendingGroups[key]);
      } else {
        pendingGroups[key].reportCount++;
        pendingGroups[key].allReportIds.push(report.id);
        if (report.createdAt > pendingGroups[key].createdAt) {
          pendingGroups[key] = {
            ...report,
            reportCount: pendingGroups[key].reportCount,
            allReportIds: pendingGroups[key].allReportIds
          };
        }
      }
    });
    
    // Group past reports by question
    const groupedPast = [];
    const pastGroups = {};
    
    pastReports.forEach(report => {
      const cleanedQuestion = cleanQuestionText(report.questionText || '');
      const key = `${report.questionId}_${cleanedQuestion}`;
      
      if (!pastGroups[key]) {
        pastGroups[key] = {
          ...report,
          reportCount: 1,
          allReportIds: [report.id]
        };
        groupedPast.push(pastGroups[key]);
      } else {
        pastGroups[key].reportCount++;
        pastGroups[key].allReportIds.push(report.id);
        if (report.createdAt > pastGroups[key].createdAt) {
          pastGroups[key] = {
            ...report,
            reportCount: pastGroups[key].reportCount,
            allReportIds: pastGroups[key].allReportIds
          };
        }
      }
    });
    
    // Combine for display based on active tab
    const combinedReports = activeTab === 'pending' ? groupedPending : groupedPast;
    
    setReports(combinedReports);
    setPendingReportsCount(groupedPending.length); // Unique pending questions
    setPastReportsCount(groupedPast.length); // Unique past questions
    setTotalReportsCount(groupedPending.length + groupedPast.length); // Unique total questions
    setLoading(false);
  };

  const handleMarkAsVerified = async (report) => {
    const result = await markQuestionAsVerified(report.questionId);
    if (result.success) {
      await updateReportStatus(report.id, 'verified');
      toast({
        title: '✅ Success',
        description: 'Question marked as verified with shield icon.',
        className: 'bg-emerald-50 border-emerald-200',
      });
      loadReports();
    } else {
      toast({
        title: '❌ Error',
        description: 'Failed to mark as verified.',
        variant: 'destructive',
      });
    }
  };

  const handleResolveReport = async (reportId) => {
    const result = await updateReportStatus(reportId, 'resolved');
    if (result.success) {
      toast({
        title: '✅ Success',
        description: 'Report marked as resolved.',
        className: 'bg-emerald-50 border-emerald-200',
      });
      loadReports();
    }
  };
  
  const handleRestoreToPending = async (report) => {
    // Restore all reports in the group
    const updatePromises = report.allReportIds.map(id => updateReportStatus(id, 'pending'));
    await Promise.all(updatePromises);
    toast({
      title: '✅ Success',
      description: 'Report restored to pending.',
      className: 'bg-emerald-50 border-emerald-200',
    });
    loadReports();
  };
  
  const handleViewQuestion = async (report) => {
    // Load the question to show in preview
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
        toast({
          title: '❌ Error',
          description: 'Question not found.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading question:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to load question.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReport = async (report) => {
    // Delete all reports in the group
    const deletePromises = report.allReportIds.map(id => deleteReport(id));
    const results = await Promise.all(deletePromises);
    
    if (results.every(r => r.success)) {
      toast({
        title: '✅ Success',
        description: `${report.allReportIds.length} report(s) deleted successfully.`,
        className: 'bg-emerald-50 border-emerald-200',
      });
      loadReports();
    } else {
      toast({
        title: '❌ Error',
        description: 'Failed to delete some reports.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateQuestion = async (report) => {
    // Load the question and prepare for update in a popup dialog
    console.log('🔍 handleUpdateQuestion called with report:', report);
    
    try {
      let questions = [];
      
      // Check if it's a word meaning question
      // It's word meaning if: has pageId field OR subjectName is 'Word Meaning' OR isWordMeaning flag
      const isWordMeaningReport = report.pageId || report.isWordMeaning || report.subjectName === 'Word Meaning';
      
      console.log('🔍 isWordMeaningReport:', isWordMeaningReport);
      console.log('🔍 report.pageId:', report.pageId);
      console.log('🔍 report.chapterId:', report.chapterId);
      console.log('🔍 report.subjectName:', report.subjectName);
      
      if (isWordMeaningReport) {
        // Word meaning question - use pageId (or chapterId as fallback for old reports)
        const pageId = report.pageId || report.chapterId;
        console.log('🔍 Loading word meaning questions for pageId:', pageId);
        const { getWordMeaningQuestionsByPage } = await import('../firebase/services');
        questions = await getWordMeaningQuestionsByPage(pageId);
        console.log('🔍 Word meaning questions loaded:', questions.length);
      } else {
        // Regular quiz question
        console.log('🔍 Loading regular quiz questions for chapterId:', report.chapterId);
        questions = await getQuestionsByChapter(report.chapterId);
        console.log('🔍 Regular questions loaded:', questions.length);
      }
      
      console.log('🔍 Looking for question with id:', report.questionId);
      const question = questions.find(q => q.id === report.questionId);
      console.log('🔍 Question found:', question ? 'YES' : 'NO');
      
      if (question) {
        setSelectedReport(report);
        // Prepare JSON with all fields
        const questionData = { 
          question: question.question, 
          answer: question.answer, 
          options: question.options 
        };
        if (question.verified) {
          questionData.verified = true;
        }
        if (question.remarks) {
          questionData.remarks = question.remarks;
        }
        setUpdateJson(JSON.stringify({ questions: [questionData] }, null, 2));
        console.log('🔍 Opening update dialog...');
        setShowUpdateDialog(true);
      } else {
        console.error('❌ Question not found in questions array');
        toast({
          title: '❌ Error',
          description: 'Question not found in database.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error loading question:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to load question details: ' + error.message,
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
        toast({ 
          title: '❌ Error', 
          description: 'Invalid JSON format', 
          variant: 'destructive' 
        });
        setIsUpdating(false);
        return;
      }
      
      // We're updating a single question
      const questionData = questions[0];
      let result;
      
      // Check if it's a word meaning question
      const isWordMeaningReport = selectedReport.pageId || selectedReport.isWordMeaning || selectedReport.subjectName === 'Word Meaning';
      
      if (isWordMeaningReport) {
        // Word meaning question - use pageId and update single question
        const pageId = selectedReport.pageId || selectedReport.chapterId;
        result = await updateWordMeaningQuestion(pageId, selectedReport.questionId, questionData);
      } else {
        // Regular quiz question - update single question
        result = await updateQuestion(selectedReport.chapterId, selectedReport.questionId, questionData);
      }
      
      if (result.success) {
        toast({ 
          title: '✅ Success', 
          description: 'Question updated successfully',
          className: 'bg-emerald-50 border-emerald-200',
        });
        setShowUpdateDialog(false);
        setUpdateJson('');
        setSelectedReport(null);
        loadReports();
      } else {
        toast({ 
          title: '❌ Error', 
          description: 'Failed to update question', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Update error:', error);
      toast({ 
        title: '❌ Error', 
        description: 'Failed to parse JSON: ' + error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Flag className="w-6 h-6 text-orange-600" />
                  Question Reports
                </h1>
                <p className="text-xs text-gray-500">Manage student-reported questions</p>
              </div>
            </div>
            {pendingReportsCount > 0 && (
              <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold text-sm">
                {pendingReportsCount} Pending
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats and Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md border border-blue-200 bg-blue-50/30">
            <p className="text-sm text-blue-600 mb-1 font-semibold">Total Unique Questions</p>
            <p className="text-2xl font-bold text-blue-700">{totalReportsCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-orange-200 bg-orange-50/50">
            <p className="text-sm text-orange-600 mb-1 font-semibold">Pending Questions</p>
            <p className="text-2xl font-bold text-orange-700">{pendingReportsCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
            <p className="text-sm text-gray-600 mb-1 font-semibold">Resolved Questions</p>
            <p className="text-2xl font-bold text-gray-800">{pastReportsCount}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Pending Reports ({pendingReportsCount})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'past'
                ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Past Reports ({pastReportsCount})
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100">
                <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-400">No reports yet</p>
                <p className="text-sm text-gray-400 mt-2">Student reports will appear here</p>
              </div>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className={`bg-white rounded-xl border-2 p-6 shadow-lg transition-all hover:shadow-xl ${
                  report.status === 'pending'
                    ? 'border-orange-200 bg-gradient-to-r from-orange-50/50 to-white'
                    : report.status === 'verified'
                    ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-white'
                    : 'border-gray-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <span>{report.subjectName}</span>
                      {report.isWordMeaning || report.subjectName === 'Word Meaning' ? (
                        <>
                          <span>›</span>
                          <span>Page: {report.pageId?.slice(0, 8) || report.chapterId?.slice(0, 8)}...</span>
                        </>
                      ) : (
                        <>
                          <span>›</span>
                          <span>Chapter: {report.chapterId?.slice(0, 8)}...</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {(report.isWordMeaning || report.subjectName === 'Word Meaning') && (
                        <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">
                          📖 Word Meaning
                        </span>
                      )}
                      {report.reportCount > 1 && (
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {report.reportCount}x Reports
                        </span>
                      )}
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          report.reportType === 'question'
                            ? 'bg-red-100 text-red-700'
                            : report.reportType === 'options'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {report.reportType === 'question'
                          ? '❌ Question Issue'
                          : report.reportType === 'options'
                          ? '⚠️ Options Issue'
                          : '🔴 Both Issues'}
                      </span>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          report.status === 'pending'
                            ? 'bg-orange-100 text-orange-700'
                            : report.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {report.status === 'pending' && '⏳ Pending'}
                        {report.status === 'verified' && '✅ Verified'}
                        {report.status === 'resolved' && '✔️ Resolved'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(report.createdAt).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>

                {/* Question Text */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Question:</p>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">{cleanQuestionText(report.questionText)}</p>
                  {report.reportCount > 1 && (
                    <p className="text-xs text-orange-600 mt-2 font-semibold">
                      📊 Reported {report.reportCount} times
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Student's Feedback:</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 p-3 rounded-lg border border-blue-100">
                    "{report.description}"
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap pt-3 border-t border-gray-100">
                  <Button
                    size="sm"
                    onClick={() => handleViewQuestion(report)}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedReport(report);
                      setShowHistoryDialog(true);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
                  >
                    <History className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                  
                  {report.status === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateQuestion(report)}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Update
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveReport(report.id)}
                        className="border-gray-300"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsVerified(report)}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
                      >
                        <ShieldCheck className="w-4 h-4 mr-1" />
                        Verify
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleRestoreToPending(report)}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Restore
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteReport(report)}
                    className="text-red-600 hover:bg-red-50 border-red-200 ml-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Question Edit History Dialog */}
      <QuestionEditHistoryDialog
        isOpen={showHistoryDialog}
        onClose={() => {
          setShowHistoryDialog(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        onEdit={handleUpdateQuestion}
        onRefresh={loadReports}
      />
      
      {/* Update Question Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Question</DialogTitle>
            <DialogDescription>
              Edit the question JSON and click Save to update
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {selectedReport?.isWordMeaning || selectedReport?.subjectName === 'Word Meaning' ? (
                  <>Page ID: {selectedReport?.pageId?.slice(0, 8) || selectedReport?.chapterId?.slice(0, 8)}... <span className="text-xs text-blue-600">(Word Meaning)</span></>
                ) : (
                  <>Chapter: {selectedReport?.chapterId?.slice(0, 8)}...</>
                )}
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Edit the JSON below. Make sure to keep the correct format.
              </p>
            </div>
            
            <Textarea
              value={updateJson}
              onChange={(e) => setUpdateJson(e.target.value)}
              placeholder='Edit your JSON here...'
              className="w-full min-h-[300px] p-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUpdateDialog(false);
                  setUpdateJson('');
                  setSelectedReport(null);
                }} 
                className="flex-1"
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveUpdate} 
                disabled={isUpdating || !updateJson.trim()} 
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Save Update'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Preview Question Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Question Preview</DialogTitle>
            <DialogDescription>View how this question currently appears</DialogDescription>
          </DialogHeader>
          {previewQuestion && (
            <div className="space-y-6 mt-4">
              {/* Question */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
                <p className="text-xs text-purple-600 font-semibold mb-2 uppercase">Question:</p>
                <p className="text-lg font-medium text-gray-800 leading-relaxed">
                  {previewQuestion.question}
                </p>
              </div>
              
              {/* Options */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 mb-3">Options:</p>
                {previewQuestion.options && previewQuestion.options.map((option, index) => {
                  const isCorrect = previewQuestion.answer === option;
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center font-semibold text-gray-700">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-gray-800">{option}</span>
                        {isCorrect && (
                          <span className="ml-auto flex-shrink-0 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                            ✓ Correct
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Metadata */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Question ID:</p>
                    <p className="font-mono text-xs text-gray-800">{previewQuestion.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Status:</p>
                    {previewQuestion.verified ? (
                      <p className="text-emerald-600 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> Verified
                      </p>
                    ) : (
                      <p className="text-orange-600 font-semibold flex items-center gap-1">
                        ⏳ Not Verified
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Remarks Section */}
                {previewQuestion.remarks && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-gray-500 mb-2 text-sm font-semibold">Remarks:</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-gray-700 leading-relaxed">{previewQuestion.remarks}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => setShowPreviewDialog(false)}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                Close Preview
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <style jsx="true">{`
        @keyframes expand {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 1000px;
            transform: translateY(0);
          }
        }
        
        .animate-expand {
          animation: expand 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminReports;
