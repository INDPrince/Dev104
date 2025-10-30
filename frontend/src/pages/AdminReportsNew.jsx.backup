import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flag, CheckCircle, Trash2, Edit, AlertTriangle, Shield, X, History, RefreshCw, Clock, TrendingUp, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { getAllReports, updateReportStatus, deleteReport, markQuestionAsVerified, unmarkQuestionAsVerified, getQuestionsByChapter, uploadQuestions, getAllSubjects, getChaptersBySubject } from '../firebase/services';
import { toast } from '../hooks/use-toast';

const AdminReportsNew = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [groupedReports, setGroupedReports] = useState([]);
  const [pastReports, setPastReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportQuestionsVerifiedStatus, setReportQuestionsVerifiedStatus] = useState({});
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'most_reported'
  
  // Dialogs
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showPastReportsDialog, setShowPastReportsDialog] = useState(false);
  
  // Update JSON form
  const [jsonData, setJsonData] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (!isAuth) {
      navigate('/admin/login');
      return;
    }
    loadReports();
    loadPastReports();
  }, [navigate]);

  const loadReports = async () => {
    setLoading(true);
    const allReports = await getAllReports();
    // Only pending reports
    const pending = allReports.filter(r => r.status === 'pending');
    setReports(pending);
    
    // Group reports by questionId to avoid duplicates
    const grouped = {};
    pending.forEach(report => {
      const qId = report.questionId;
      if (!grouped[qId]) {
        grouped[qId] = {
          questionId: qId,
          reports: [],
          reportCount: 0,
          latestReport: report,
          chapterId: report.chapterId,
          questionText: report.questionText
        };
      }
      grouped[qId].reports.push(report);
      grouped[qId].reportCount++;
      // Keep the most recent report as representative
      if (report.createdAt > grouped[qId].latestReport.createdAt) {
        grouped[qId].latestReport = report;
      }
    });
    
    // Convert to array
    const groupedArray = Object.values(grouped);
    setGroupedReports(groupedArray);
    
    // Load verified status for each unique question
    const verifiedStatus = {};
    for (const group of groupedArray) {
      try {
        const questions = await getQuestionsByChapter(group.chapterId);
        const question = questions.find(q => q.id === group.questionId);
        if (question) {
          verifiedStatus[group.questionId] = question.verified || false;
        }
      } catch (error) {
        console.error('Error loading question verified status:', error);
      }
    }
    setReportQuestionsVerifiedStatus(verifiedStatus);
    
    setLoading(false);
  };

  const loadPastReports = () => {
    const stored = localStorage.getItem('pastReports');
    if (stored) {
      setPastReports(JSON.parse(stored));
    }
  };

  const saveToPastReports = (report, action) => {
    const pastReport = {
      ...report,
      resolvedAction: action,
      resolvedAt: Date.now(),
      originalStatus: report.status
    };
    
    const updated = [pastReport, ...pastReports].slice(0, 50); // Keep last 50
    setPastReports(updated);
    localStorage.setItem('pastReports', JSON.stringify(updated));
  };

  const handleUpdateQuestion = async (group) => {
    const report = group.latestReport;
    setSelectedReport(report);
    
    // Load existing question data
    try {
      const questions = await getQuestionsByChapter(report.chapterId);
      const question = questions.find(q => q.id === report.questionId);
      
      if (question) {
        const jsonStructure = {
          questions: [{
            question: question.question,
            answer: question.answer,
            options: question.options,
            ...(question.remarks ? { remarks: question.remarks } : {}),
            ...(question.verified ? { verified: true } : {})
          }]
        };
        setJsonData(JSON.stringify(jsonStructure, null, 2));
        setShowUpdateDialog(true);
      }
    } catch (error) {
      toast({ title: '❌ Error', description: 'Failed to load question', variant: 'destructive' });
    }
  };

  const handleSaveUpdate = async () => {
    if (!selectedReport || !jsonData.trim()) return;
    
    setIsUpdating(true);
    try {
      const parsed = JSON.parse(jsonData);
      const questions = parsed.questions || [];
      
      if (questions.length === 0) {
        toast({ title: '❌ Error', description: 'No questions found in JSON', variant: 'destructive' });
        setIsUpdating(false);
        return;
      }
      
      // Update mode - will update existing question
      const result = await uploadQuestions(selectedReport.chapterId, questions, true);
      
      if (result.success) {
        toast({ 
          title: '✅ Success', 
          description: 'Question updated successfully',
          className: 'bg-emerald-50 border-emerald-200',
        });
        setShowUpdateDialog(false);
        setJsonData('');
        setSelectedReport(null);
      }
    } catch (error) {
      toast({ title: '❌ Error', description: 'Invalid JSON format', variant: 'destructive' });
    }
    setIsUpdating(false);
  };

  const handleResolve = async (group) => {
    // Resolve all reports for this question
    for (const report of group.reports) {
      await updateReportStatus(report.id, 'resolved');
      saveToPastReports(report, 'resolved');
    }
    toast({
      title: '✅ Resolved',
      description: `${group.reportCount} report(s) marked as resolved`,
      className: 'bg-emerald-50 border-emerald-200',
    });
    loadReports();
  };

  const handleMarkAsVerified = async (group) => {
    try {
      // Mark question as verified (adds !verified tag)
      const result = await markQuestionAsVerified(group.questionId);
      if (result.success) {
        // Update all reports for this question
        for (const report of group.reports) {
          await updateReportStatus(report.id, 'verified');
          saveToPastReports(report, 'marked_verified');
        }
        toast({
          title: '✅ Verified',
          description: `Question verified, ${group.reportCount} report(s) resolved`,
          className: 'bg-emerald-50 border-emerald-200',
        });
        loadReports();
      }
    } catch (error) {
      toast({ title: '❌ Error', description: 'Failed to mark as verified', variant: 'destructive' });
    }
  };

  const handleUnmarkVerified = async (group) => {
    try {
      // Unmark question as verified (removes !verified tag)
      const result = await unmarkQuestionAsVerified(group.questionId);
      if (result.success) {
        toast({
          title: '✅ Unverified',
          description: 'Question verification removed',
          className: 'bg-emerald-50 border-emerald-200',
        });
        loadReports();
      }
    } catch (error) {
      toast({ title: '❌ Error', description: 'Failed to unmark as verified', variant: 'destructive' });
    }
  };

  const handleDelete = async (group) => {
    if (!window.confirm(`Delete ${group.reportCount} report(s) for this question? (Question will remain in database)`)) return;
    
    // Delete all reports for this question
    for (const report of group.reports) {
      await deleteReport(report.id);
      saveToPastReports(report, 'deleted_false_report');
    }
    toast({
      title: '✅ Deleted',
      description: `${group.reportCount} report(s) deleted (marked as false reports)`,
      className: 'bg-orange-50 border-orange-200',
    });
    loadReports();
  };

  const handleRestoreToPending = async (pastReport) => {
    try {
      // Update the report status back to pending in Firebase
      const result = await updateReportStatus(pastReport.id, 'pending');
      
      if (result.success) {
        // Remove from past reports
        const updated = pastReports.filter(r => r.id !== pastReport.id);
        setPastReports(updated);
        localStorage.setItem('pastReports', JSON.stringify(updated));
        
        toast({
          title: '↩️ Restored',
          description: 'Report restored to pending state',
          className: 'bg-blue-50 border-blue-200',
        });
        
        // Reload both pending and past reports
        await loadReports();
        loadPastReports();
      } else {
        toast({
          title: '❌ Error',
          description: 'Failed to restore report',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error restoring report:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to restore report',
        variant: 'destructive'
      });
    }
  };

  const renderReportCard = (group, isPast = false) => {
    const report = group.latestReport || group;
    const isGrouped = group.reportCount > 1;
    
    return (
      <div 
        key={group.questionId || report.id} 
        className={`bg-white p-4 sm:p-6 rounded-xl border-2 ${
          isPast ? 'border-gray-200' : 'border-orange-200'
        } hover:shadow-lg transition-all`}
      >
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Flag className={`w-5 h-5 flex-shrink-0 ${isPast ? 'text-gray-400' : 'text-orange-600'}`} />
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base break-words">
                  {report.reason || 'No reason provided'}
                </h3>
                {isGrouped && !isPast && (
                  <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {group.reportCount}x
                  </span>
                )}
              </div>
            
            {isPast && (
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {report.resolvedAction === 'resolved' && '✅ Resolved'}
                  {report.resolvedAction === 'marked_verified' && '🛡️ Verified'}
                  {report.resolvedAction === 'deleted_false_report' && '🗑️ False Report'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(report.resolvedAt).toLocaleString()}
                </span>
              </div>
            )}
            
            <p className="text-xs sm:text-sm text-gray-500 mb-1">
              Reported: {new Date(report.createdAt).toLocaleString()}
            </p>
            
            {report.questionText && (
              <p className="text-xs sm:text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded break-words">
                <strong>Question:</strong> {report.questionText}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isPast && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleUpdateQuestion(group)}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-xs sm:text-sm"
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Update
            </Button>
            
            <Button
              onClick={() => handleResolve(group)}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-xs sm:text-sm"
            >
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Resolve
            </Button>
            
            {/* Show Verify or Unverify based on current status */}
            {reportQuestionsVerifiedStatus[group.questionId] ? (
              <Button
                onClick={() => handleUnmarkVerified(group)}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-xs sm:text-sm"
              >
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Unverify
              </Button>
            ) : (
              <Button
                onClick={() => handleMarkAsVerified(group)}
                size="sm"
                className="bg-purple-500 hover:bg-purple-600 text-xs sm:text-sm"
              >
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Verify
              </Button>
            )}
            
            <Button
              onClick={() => handleDelete(group)}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 text-xs sm:text-sm"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Delete
            </Button>
          </div>
        )}

        {isPast && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleRestoreToPending(report)}
              size="sm"
              variant="outline"
              className="text-xs sm:text-sm"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Restore to Pending
            </Button>
            
            <Button
              onClick={() => handleUpdateQuestion({ latestReport: report, questionId: report.questionId })}
              size="sm"
              variant="outline"
              className="text-xs sm:text-sm"
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Re-edit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
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
      {/* Header with Navbar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-emerald-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                  <Flag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-800">Reports</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Review reported questions</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Past Reports Button */}
              <Button
                onClick={() => setShowPastReportsDialog(true)}
                size="sm"
                variant="outline"
                className="relative"
              >
                <History className="w-4 h-4 mr-0 sm:mr-1" />
                <span className="hidden sm:inline">Past Reports</span>
                {pastReports.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {pastReports.length}
                  </span>
                )}
              </Button>

              {/* Refresh Button */}
              <Button
                onClick={loadReports}
                size="sm"
                variant="outline"
                className="px-2 sm:px-3"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border-2 border-orange-200">
            <h3 className="text-xs sm:text-sm font-medium text-orange-600 mb-1">Pending Reports</h3>
            <p className="text-2xl sm:text-3xl font-bold text-orange-900">{reports.length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border-2 border-emerald-200">
            <h3 className="text-xs sm:text-sm font-medium text-emerald-600 mb-1">Past Reports</h3>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-900">{pastReports.length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200 col-span-2 sm:col-span-1">
            <h3 className="text-xs sm:text-sm font-medium text-blue-600 mb-1">Unique Questions</h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-900">{groupedReports.length}</p>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-emerald-100 shadow-lg">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Pending Reports</h2>
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="recent">Recent Reports</option>
                <option value="most_reported">Most Reported</option>
              </select>
            </div>
          </div>
          
          {groupedReports.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">No pending reports! 🎉</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Sort based on selection
                const sorted = [...groupedReports].sort((a, b) => {
                  if (sortBy === 'most_reported') {
                    // Sort by report count (descending), then by recent
                    if (b.reportCount !== a.reportCount) {
                      return b.reportCount - a.reportCount;
                    }
                    return b.latestReport.createdAt - a.latestReport.createdAt;
                  } else {
                    // Sort by most recent
                    return b.latestReport.createdAt - a.latestReport.createdAt;
                  }
                });
                
                return sorted.map(group => renderReportCard(group));
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Update JSON Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Question JSON</DialogTitle>
            <DialogDescription>Edit the question data and mark as verified if needed</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Question JSON</label>
              <textarea
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder='{\n  "questions": [\n    {\n      "question": "Your question?",\n      "answer": "Correct answer",\n      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],\n      "verified": true\n    }\n  ]\n}'
                className="w-full min-h-[400px] p-3 border-2 border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Add <code className="bg-gray-100 px-1 rounded">"verified": true</code> to mark question as verified (shield icon).
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpdateDialog(false);
                  setJsonData('');
                  setSelectedReport(null);
                }}
                className="flex-1"
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveUpdate}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isUpdating || !jsonData.trim()}
              >
                {isUpdating ? 'Updating...' : 'Update Question'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Past Reports Dialog */}
      <Dialog open={showPastReportsDialog} onOpenChange={setShowPastReportsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              All Past Reported Questions
            </DialogTitle>
            <DialogDescription>View and manage previously resolved reports</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {pastReports.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No past reports yet</p>
              </div>
            ) : (
              <div className="space-y-4 pr-2">
                {pastReports.map(report => renderReportCard(report, true))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReportsNew;
