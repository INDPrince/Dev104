import React, { useState, memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { createReport } from '../firebase/services';
import { toast } from '../hooks/use-toast';

// 🚀 Memoized to prevent unnecessary re-renders
const ReportDialog = memo(({ isOpen, onClose, questionId, questionText, chapterId, subjectName, isWordMeaning, pageId }) => {
  const [reportType, setReportType] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current class theme
  const selectedClass = localStorage.getItem('selectedClass') || '11th';
  const classThemes = {
    '10th': 'text-blue-600',
    '11th': 'text-emerald-600',
    '12th': 'text-pink-600'
  };
  const themeColor = classThemes[selectedClass];

  const handleSubmit = async () => {
    if (!reportType || !questionId || !chapterId) {
      toast({
        title: '❌ Missing Information',
        description: 'Required information is missing. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const reportData = {
        questionId,
        questionText: questionText || '',
        chapterId,
        subjectName: subjectName || '',
        reportType,
        reason: reportType === 'question' ? 'Question is incorrect' : 
                reportType === 'options' ? 'Options are incorrect' : 
                'Both question and options are incorrect',
        description: additionalInfo || 'No additional information provided',
        status: 'pending',
        isWordMeaning: isWordMeaning || subjectName === 'Word Meaning' // Add word meaning flag
      };
      
      // For word meaning questions, store pageId separately
      if (isWordMeaning || subjectName === 'Word Meaning') {
        reportData.pageId = pageId || chapterId; // Use passed pageId or fallback to chapterId
      }
      
      const result = await createReport(reportData);
      
      if (result.success) {
        toast({
          title: '✅ Report Submitted Successfully',
          description: 'Thank you for helping us improve! We will review your report.',
          className: 'bg-emerald-50 border-emerald-200',
        });
        
        // Reset and close
        setReportType('');
        setAdditionalInfo('');
        onClose();
      } else {
        toast({
          title: '❌ Submission Failed',
          description: result.error || 'Could not submit report. Please check your connection and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: '❌ Network Error',
        description: 'Unable to connect. Please check your internet connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Report Question
          </DialogTitle>
          <DialogDescription>Help us improve by reporting any issues with this question</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 mt-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-4">What's wrong with this question?</p>
            <RadioGroup value={reportType} onValueChange={setReportType}>
              <div className="flex items-center space-x-3 mb-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="question" id="question" className={themeColor} />
                <Label htmlFor="question" className="cursor-pointer flex-1 text-sm leading-relaxed">Question is incorrect</Label>
              </div>
              <div className="flex items-center space-x-3 mb-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="options" id="options" className={themeColor} />
                <Label htmlFor="options" className="cursor-pointer flex-1 text-sm leading-relaxed">Options are incorrect</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="both" id="both" className={themeColor} />
                <Label htmlFor="both" className="cursor-pointer flex-1 text-sm leading-relaxed">Both are incorrect</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="additional" className="text-sm font-medium mb-2 block">Additional Information (Optional)</Label>
            <Textarea
              id="additional"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Describe the issue in detail..."
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reportType || isSubmitting}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </span>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

// Display name for debugging
ReportDialog.displayName = 'ReportDialog';

export default ReportDialog;
