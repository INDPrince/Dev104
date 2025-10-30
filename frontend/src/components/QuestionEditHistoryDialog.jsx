import React, { useState, useEffect, memo } from 'react';
import { ShieldCheckCheck, Edit, X, History, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { markQuestionAsVerified, unmarkQuestionAsVerified, getQuestionsByChapter } from '../firebase/services';
import { toast } from '../hooks/use-toast';

// 🚀 Memoized to prevent unnecessary re-renders
const QuestionEditHistoryDialog = memo(({ 
  isOpen, 
  onClose, 
  report,
  onEdit,
  onRefresh
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(false);

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
    if (isOpen && report) {
      loadQuestionDetails();
    }
  }, [isOpen, report]);

  const loadQuestionDetails = async () => {
    setLoading(true);
    try {
      const questions = await getQuestionsByChapter(report.chapterId);
      const question = questions.find(q => q.id === report.questionId);
      setCurrentQuestion(question);
    } catch (error) {
      console.error('Error loading question:', error);
    }
    setLoading(false);
  };

  const handleMarkVerified = async () => {
    const result = await markQuestionAsVerified(report.questionId);
    if (result.success) {
      toast({
        title: '✅ Success',
        description: 'Question marked as verified.',
        className: 'bg-emerald-50 border-emerald-200',
      });
      loadQuestionDetails();
      if (onRefresh) onRefresh();
    } else {
      toast({
        title: '❌ Error',
        description: 'Failed to mark as verified.',
        variant: 'destructive',
      });
    }
  };

  const handleUnmarkVerified = async () => {
    const result = await unmarkQuestionAsVerified(report.questionId);
    if (result.success) {
      toast({
        title: '✅ Success',
        description: 'Verified status removed.',
        className: 'bg-emerald-50 border-emerald-200',
      });
      loadQuestionDetails();
      if (onRefresh) onRefresh();
    } else {
      toast({
        title: '❌ Error',
        description: 'Failed to remove verified status.',
        variant: 'destructive',
      });
    }
  };

  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Question Details & History
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Original Reported Question */}
            <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Original Question (When Reported)
                </h3>
                <span className="text-xs text-gray-500">
                  {new Date(report.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-600">Question:</span>
                  <p className="text-gray-800 mt-1 bg-white p-2 rounded">{cleanQuestionText(report.questionText)}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Student's Feedback:</span>
                  <p className="text-orange-700 mt-1 bg-white p-2 rounded italic">"{report.description}"</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Issue Type:</span>
                  <span className={`ml-2 text-xs px-2 py-1 rounded-full font-semibold ${
                    report.reportType === 'question'
                      ? 'bg-red-100 text-red-700'
                      : report.reportType === 'options'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {report.reportType === 'question' ? '❌ Question Issue' : 
                     report.reportType === 'options' ? '⚠️ Options Issue' : '🔴 Both Issues'}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Question Status */}
            {currentQuestion && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    Current Question Status
                    {currentQuestion.verified && (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm ml-2">
                        <ShieldCheck className="w-4 h-4 fill-emerald-600" />
                        Verified
                      </span>
                    )}
                  </h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <span className="font-semibold text-gray-600 block mb-1">Question:</span>
                    <p className="text-gray-800">{cleanQuestionText(currentQuestion.question)}</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg">
                    <span className="font-semibold text-gray-600 block mb-1">Correct Answer:</span>
                    <p className="text-emerald-700 font-medium">{currentQuestion.answer}</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg">
                    <span className="font-semibold text-gray-600 block mb-2">All Options:</span>
                    <ul className="space-y-1">
                      {currentQuestion.options?.map((opt, idx) => (
                        <li 
                          key={idx} 
                          className={`flex items-center gap-2 p-2 rounded ${
                            opt === currentQuestion.answer 
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium' 
                              : 'text-gray-700'
                          }`}
                        >
                          <span className="font-bold">{String.fromCharCode(65 + idx)}.</span>
                          {opt}
                          {opt === currentQuestion.answer && (
                            <CheckCircle className="w-4 h-4 ml-auto text-emerald-600" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Comparison - If question was changed */}
            {currentQuestion && report.questionText !== currentQuestion.question && (
              <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="text-yellow-600">⚠️</span>
                  Changes Detected
                </h4>
                <p className="text-sm text-gray-700">
                  The question has been modified since it was reported. Review the changes carefully before taking action.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
              <Button
                onClick={() => {
                  onEdit(report);
                  onClose();
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit Question
              </Button>
              
              {currentQuestion && !currentQuestion.verified ? (
                <Button
                  onClick={handleMarkVerified}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Mark as Verified
                </Button>
              ) : currentQuestion && currentQuestion.verified ? (
                <Button
                  onClick={handleUnmarkVerified}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove Verified
                </Button>
              ) : null}
              
              <Button
                onClick={onClose}
                variant="outline"
                className="ml-auto"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

// Display name for debugging
QuestionEditHistoryDialog.displayName = 'QuestionEditHistoryDialog';

export default QuestionEditHistoryDialog;
