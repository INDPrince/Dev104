import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Flag, Check, X, ChevronRight, Clock, List, ShieldCheck, PartyPopper } from 'lucide-react';
import { getQuestionsByChapters, getWordMeaningQuestions, getWordMeaningQuestionsByPages } from '../firebase/services';
import ReportDialog from '../components/ReportDialog';

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    selectedChapters, 
    questionLimit, 
    subject, 
    retryTimestamp,
    // Word Meaning specific props
    isWordMeaning,
    isSinglePage,
    isCombinedQuiz,
    selectedPages,
    currentPageIndex: initialPageIndex,
    allPages,
    chapterId
  } = location.state || {};

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timer, setTimer] = useState(30);
  const [results, setResults] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [showPageCompletion, setShowPageCompletion] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex || 0);
  const timerRef = useRef(null);
  const lastVisibleTime = useRef(Date.now());
  const wasVisible = useRef(true);

  // Get theme based on class
  const selectedClass = localStorage.getItem('selectedClass') || '11th';
  const classThemes = {
    '10th': {
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
    '11th': {
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
    },
    '12th': {
      gradient: 'from-pink-500 to-rose-600',
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      border: 'border-pink-200',
    }
  };
  const currentTheme = classThemes[selectedClass] || classThemes['11th'];

  // Shuffle array but keep '!fix' options at the end
  const shuffleOptionsWithFixLast = (options) => {
    const fixOptions = options.filter(opt => opt.trim().startsWith('!fix '));
    const regularOptions = options.filter(opt => !opt.trim().startsWith('!fix '));
    
    // Fisher-Yates shuffle for better randomization
    for (let i = regularOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [regularOptions[i], regularOptions[j]] = [regularOptions[j], regularOptions[i]];
    }
    
    return [...regularOptions, ...fixOptions];
  };

  // Shuffle and prepare questions
  useEffect(() => {
    if (isWordMeaning) {
      // Word Meaning mode
      if (!selectedPages || !questionLimit) {
        navigate('/');
        return;
      }
      loadWordMeaningQuestions();
    } else {
      // Normal quiz mode
      if (!selectedChapters || !questionLimit) {
        navigate('/');
        return;
      }
      loadNormalQuestions();
    }
  }, [selectedPages, selectedChapters, questionLimit, navigate, retryTimestamp, currentPageIndex]);

  const loadWordMeaningQuestions = async () => {
    if (isCombinedQuiz) {
      // Combined quiz - load all pages together
      const availableQuestions = await getWordMeaningQuestionsByPages(selectedPages);
      prepareQuestions(availableQuestions);
    } else if (isSinglePage && allPages) {
      // Single page mode - load current page only
      const currentPage = allPages[currentPageIndex];
      const availableQuestions = await getWordMeaningQuestions(currentPage.id);
      prepareQuestions(availableQuestions);
    }
  };

  const loadNormalQuestions = async () => {
    const availableQuestions = await getQuestionsByChapters(selectedChapters);
    prepareQuestions(availableQuestions);
  };

  const prepareQuestions = (availableQuestions) => {
    if (availableQuestions.length === 0) {
      alert('No questions available!');
      navigate(-1);
      return;
    }
    
    // Create a stronger shuffle with random seed
    const now = Date.now();
    const shuffleWithSeed = (arr) => {
      return arr
        .map(item => ({ item, sort: Math.random() * now }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ item }) => item);
    };
    
    // Shuffle questions
    const shuffledQuestions = shuffleWithSeed(availableQuestions)
      .slice(0, Math.min(questionLimit, availableQuestions.length));
    
    // Shuffle options for each question with unique timestamp
    const questionsWithShuffledOptions = shuffledQuestions.map(q => ({
      ...q,
      shuffledOptions: shuffleOptionsWithFixLast([...q.options]),
      _shuffleId: Math.random() * Date.now() // Unique ID to force re-render
    }));
    
    setQuestions(questionsWithShuffledOptions);
  };

  // Completely prevent page refresh/navigation during quiz
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Quiz is in progress. Are you sure you want to leave?';
      return 'Quiz is in progress. Are you sure you want to leave?';
    };

    const handleKeyDown = (e) => {
      // Prevent F5, Ctrl+R, Cmd+R
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Timer countdown with proper cleanup and anti-cheat
  useEffect(() => {
    if (questions.length === 0) return;
    if (isAnswered) {
      // Clear timer when answered
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Handle timer reaching 0
    if (timer <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (!isAnswered) {
        handleTimeout();
      }
      return;
    }

    // Visibility change handler for anti-cheating
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasVisible.current = false;
        lastVisibleTime.current = Date.now();
      } else {
        if (!wasVisible.current) {
          // Window was hidden and now visible - penalize timer
          const hiddenDuration = Math.floor((Date.now() - lastVisibleTime.current) / 1000);
          if (hiddenDuration > 0) {
            setTimer(prev => Math.max(0, prev - hiddenDuration));
          }
          wasVisible.current = true;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timer, isAnswered, questions]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Format question text with special keywords
  const formatQuestionText = (text) => {
    if (!text) return text;
    
    let formatted = text;
    
    // Handle underline: !u text !u - Simple underline without underscore
    formatted = formatted.replace(/!u\s*(.*?)\s*!u/gi, '<u class="decoration-2 underline-offset-2">$1</u>');
    
    // Handle blanks: !b - Show as blank line only (no underscore text)
    formatted = formatted.replace(/!b/gi, '<span class="inline-block border-b-2 border-dashed border-gray-600 min-w-[80px] mx-1 h-6 align-middle"></span>');
    
    return formatted;
  };

  const handleOptionSelect = (option) => {
    if (isAnswered) return;

    const timeTaken = Math.max(0, Math.min(30, (Date.now() - questionStartTime) / 1000));
    
    // Remove '!fix ' prefix for comparison (trim spaces first)
    const cleanOption = option.trim().replace(/^!fix\s+/, '');
    const cleanAnswer = currentQuestion.answer.trim().replace(/^!fix\s+/, '');
    const isCorrect = cleanOption === cleanAnswer;

    setSelectedOption(option);
    setIsAnswered(true);

    // Clear timer immediately
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setResults(prev => [
      ...prev,
      {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        selectedOption: cleanOption,
        correctAnswer: cleanAnswer,
        isCorrect,
        timeTaken: Math.round(timeTaken),
        wasTimeout: false
      }
    ]);
  };

  const handleTimeout = () => {
    if (isAnswered) return;

    const timeTaken = Math.max(0, Math.min(30, (Date.now() - questionStartTime) / 1000));
    const cleanAnswer = currentQuestion.answer.trim().replace(/^!fix\s+/, '');

    setIsAnswered(true);
    setSelectedOption(null);

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setResults(prev => [
      ...prev,
      {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        selectedOption: null,
        correctAnswer: cleanAnswer,
        isCorrect: false,
        timeTaken: Math.round(timeTaken),
        wasTimeout: true
      }
    ]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimer(30);
      setQuestionStartTime(Date.now());
    } else {
      // Quiz completed for current page/section
      if (isWordMeaning && isSinglePage && allPages && currentPageIndex < allPages.length - 1) {
        // Show page completion screen
        setShowPageCompletion(true);
      } else {
        // Navigate to results
        navigate('/result', {
          state: {
            results,
            totalQuestions: questions.length,
            subject,
            quizConfig: isWordMeaning ? { selectedPages, questionLimit, isWordMeaning: true } : { selectedChapters, questionLimit }
          }
        });
      }
    }
  };

  const handleNextPage = () => {
    // Move to next page
    const nextPageIndex = currentPageIndex + 1;
    setCurrentPageIndex(nextPageIndex);
    setShowPageCompletion(false);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimer(30);
    setResults([]);
    setQuestionStartTime(Date.now());
  };

  const handleFinishWordMeaning = () => {
    navigate('/result', {
      state: {
        results,
        totalQuestions: questions.length,
        subject,
        quizConfig: { selectedPages, questionLimit, isWordMeaning: true }
      }
    });
  };

  const getOptionStyle = (option) => {
    if (!isAnswered) {
      return 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md transition-all duration-200 ease-in-out';
    }

    const cleanOption = option.trim().replace(/^!fix\s+/, '');
    const cleanAnswer = currentQuestion.answer.trim().replace(/^!fix\s+/, '');
    const isCorrectAnswer = cleanOption === cleanAnswer;
    const isSelected = option === selectedOption;

    if (isCorrectAnswer) {
      return 'bg-emerald-50 border-2 border-emerald-500 shadow-md';
    }

    if (isSelected && !isCorrectAnswer) {
      return 'bg-red-50 border-2 border-red-500 shadow-md';
    }

    return 'bg-gray-50 border-2 border-gray-200 opacity-60';
  };

  const getOptionRemark = (option, index) => {
    if (!isAnswered || !currentQuestion.remarks || !currentQuestion.remarks[index]) {
      return null;
    }
    
    return currentQuestion.remarks[index];
  };

  const getOptionTextColor = (option) => {
    if (!isAnswered) {
      return 'text-gray-800';
    }

    const cleanOption = option.trim().replace(/^!fix\s+/, '');
    const cleanAnswer = currentQuestion.answer.trim().replace(/^!fix\s+/, '');
    const isCorrectAnswer = cleanOption === cleanAnswer;
    const isSelected = option === selectedOption;

    if (isCorrectAnswer) {
      return 'text-emerald-700';
    }

    if (isSelected && !isCorrectAnswer) {
      return 'text-red-700';
    }

    return 'text-gray-500';
  };

  const getOptionIcon = (option) => {
    if (!isAnswered) return null;

    const cleanOption = option.trim().replace(/^!fix\s+/, '');
    const cleanAnswer = currentQuestion.answer.trim().replace(/^!fix\s+/, '');
    const isCorrectAnswer = cleanOption === cleanAnswer;
    const isSelected = option === selectedOption;

    if (isCorrectAnswer) {
      return (
        <div className="w-8 h-8 rounded-full bg-transparent border-2 border-emerald-600 flex items-center justify-center animate-check-bounce">
          <Check className="w-5 h-5 text-emerald-600" />
        </div>
      );
    }

    if (isSelected && !isCorrectAnswer) {
      return (
        <div className="w-8 h-8 rounded-full bg-transparent border-2 border-red-600 flex items-center justify-center animate-cross-shake">
          <X className="w-5 h-5 text-red-600" />
        </div>
      );
    }

    return null;
  };

  if (questions.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg.replace('bg-', 'from-')} to-white flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 ${currentTheme.border.replace('border-', 'border-')} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
          <p className="text-gray-600">Preparing your quiz...</p>
        </div>
      </div>
    );
  }

  // Page Completion Screen
  if (showPageCompletion && allPages) {
    const currentPage = allPages[currentPageIndex];
    const nextPage = allPages[currentPageIndex + 1];
    const correctAnswers = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctAnswers / results.length) * 100);

    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg.replace('bg-', 'from-')} to-white flex items-center justify-center p-4`}>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className={`w-24 h-24 bg-gradient-to-br ${currentTheme.gradient} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce-slow`}>
              <PartyPopper className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Well Done! 🎉</h2>
            <p className="text-gray-600">Page {currentPage.pageNumber} Completed</p>
          </div>

          {/* Stats */}
          <div className={`bg-gradient-to-br ${currentTheme.bg.replace('bg-', 'from-')}/30 to-white rounded-2xl p-4 mb-6`}>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-800">{correctAnswers}/{results.length}</p>
                <p className="text-sm text-gray-600">Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{accuracy}%</p>
                <p className="text-sm text-gray-600">Accuracy</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2 text-center">
              Progress: Page {currentPageIndex + 1} of {allPages.length}
            </p>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${currentTheme.gradient} transition-all duration-500`}
                style={{ width: `${((currentPageIndex + 1) / allPages.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {nextPage && (
              <button
                onClick={handleNextPage}
                className={`w-full py-4 bg-gradient-to-r ${currentTheme.gradient} text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2`}
              >
                Continue to Page {nextPage.pageNumber}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleFinishWordMeaning}
              className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300"
            >
              {nextPage ? 'View Results & Exit' : 'View Results'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg.replace('bg-', 'from-')} to-white`}>
      {/* Improved Header with Better Design */}
      <div className={`bg-gradient-to-br from-white via-white to-${currentTheme.bg}/20 backdrop-blur-md border-b-2 ${currentTheme.border} sticky top-0 z-10 shadow-lg`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3 gap-3">
            {/* Question Counter - Improved Design */}
            <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
              <div className={`flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r ${currentTheme.gradient} text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
                <div className="w-6 h-6 bg-white/20 rounded-lg hidden md:flex items-center justify-center">
                  <List className="w-4 h-4" />
                </div>
                <span className="text-base">{currentQuestionIndex + 1} / {questions.length}</span>
              </div>
            </div>
            
            {/* Timer - Enhanced with Better Animation */}
            <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
              <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-all duration-300 ${
                !isAnswered && timer <= 10 && timer > 0 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white animate-slow-pulse scale-110 shadow-red-300' 
                  : timer === 0 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white scale-110' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 hover:scale-105'
              }`} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  !isAnswered && timer <= 10 && timer > 0 ? 'bg-white/20' : timer === 0 ? 'bg-white/20' : 'bg-white'
                }`}>
                  <Clock className={`w-4 h-4 ${!isAnswered && timer <= 10 && timer > 0 ? 'text-white' : timer === 0 ? 'text-white' : 'text-gray-700'}`} />
                </div>
                <span className="text-base min-w-[40px] text-center">{timer}s</span>
              </div>
            </div>
            
            {/* Report/Verified Badge - Improved */}
            <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
              {currentQuestion?.verified ? (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shadow-lg border-2 border-emerald-300 hover:scale-105 transition-transform" title="Verified Question">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                </div>
              ) : (
                <button 
                  onClick={() => setIsReportDialogOpen(true)}
                  className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg border-2 border-orange-300 active:scale-95"
                >
                  <Flag className="w-5 h-5 text-orange-600" />
                </button>
              )}
            </div>
          </div>
          
          {/* Enhanced Animated Progress Bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner relative">
            <div 
              className={`h-full bg-gradient-to-r ${currentTheme.gradient} rounded-full relative overflow-hidden animate-slide-in-progress`}
              style={{ 
                width: `${progress}%`,
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 py-5 pb-28">
        {/* Modern Question Card */}
        <div className={`bg-gradient-to-br from-white to-${currentTheme.bg}/30 rounded-2xl p-5 mb-5 border ${currentTheme.border} shadow-lg backdrop-blur-sm animate-fade-in`}>
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentTheme.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
              <span className="text-white font-bold text-sm">{currentQuestionIndex + 1}</span>
            </div>
            <h2 
              className="text-lg font-semibold text-gray-800 leading-relaxed flex-1"
              dangerouslySetInnerHTML={{ __html: formatQuestionText(currentQuestion.question) }}
            />
          </div>
        </div>

        {/* Options - True/False or Normal MCQ */}
        {currentQuestion.shuffledOptions.length === 2 ? (
          // True/False Questions - Two Buttons Side by Side
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.shuffledOptions.map((option, index) => {
              const displayOption = option.trim().replace(/^!fix\s+/, '');
              const remark = getOptionRemark(option, currentQuestion.options.indexOf(option));
              
              return (
                <div key={index} className="flex flex-col gap-2">
                  <button
                    onClick={() => handleOptionSelect(option)}
                    disabled={isAnswered}
                    className={`p-4 rounded-xl transition-all duration-200 flex items-center justify-between group relative overflow-hidden min-h-[60px] ${
                      getOptionStyle(option)
                    } ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                    style={{
                      animation: `slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s both`
                    }}
                  >
                    <span className={`text-left flex items-center gap-2 flex-1 pr-2 transition-all duration-200 ${getOptionTextColor(option)}`}>
                      <span className={`flex-1 ${isAnswered ? 'font-semibold' : 'font-medium'} text-center`}>{displayOption}</span>
                    </span>
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      {getOptionIcon(option)}
                    </div>
                  </button>
                  
                  {/* Remark below option */}
                  {remark && isAnswered && (
                    <div className={`text-xs px-3 py-2 rounded-lg ${
                      getOptionTextColor(option) === 'text-emerald-700' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : getOptionTextColor(option) === 'text-red-700'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      {remark}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Normal MCQ Questions - List with Radio Buttons
          <div className="space-y-2.5">
            {currentQuestion.shuffledOptions.map((option, index) => {
              const displayOption = option.trim().replace(/^!fix\s+/, '');
              const remark = getOptionRemark(option, currentQuestion.options.indexOf(option));
              
              return (
                <div key={index} className="flex flex-col gap-2">
                  <button
                    onClick={() => handleOptionSelect(option)}
                    disabled={isAnswered}
                    className={`w-full p-4 rounded-xl transition-all duration-200 flex items-center justify-between group relative overflow-hidden min-h-[60px] ${
                      getOptionStyle(option)
                    } ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                    style={{
                      animation: `slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s both`
                    }}
                  >
                    <span className={`text-left flex items-start gap-2 flex-1 pr-2 transition-all duration-200 ${getOptionTextColor(option)}`}>
                      <span className={`w-6 h-6 rounded-md ${currentTheme.bg} ${currentTheme.text} text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className={`flex-1 ${isAnswered ? 'font-semibold' : 'font-medium'}`}>{displayOption}</span>
                    </span>
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      {getOptionIcon(option)}
                    </div>
                  </button>
                  
                  {/* Remark below option */}
                  {remark && isAnswered && (
                    <div className={`text-xs px-3 py-2 rounded-lg ${
                      getOptionTextColor(option) === 'text-emerald-700' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : getOptionTextColor(option) === 'text-red-700'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      {remark}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Button */}
      {isAnswered && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-emerald-100 p-4 animate-slide-up shadow-lg">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleNextQuestion}
              className={`w-full bg-gradient-to-r ${currentTheme.gradient} text-white py-3.5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95`}
            >
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                'View Results'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Report Dialog */}
      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        questionId={currentQuestion?.id}
        questionText={currentQuestion?.question}
        chapterId={isWordMeaning ? chapterId : currentQuestion?.chapterId}
        pageId={isWordMeaning ? (currentQuestion?.pageId || (allPages && allPages[currentPageIndex]?.id)) : null}
        subjectName={isWordMeaning ? 'Word Meaning' : (subject?.name || 'Unknown Subject')}
        isWordMeaning={isWordMeaning}
      />

      <style jsx="true">{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        @keyframes check-bounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        @keyframes cross-shake {
          0% { transform: rotate(0deg) scale(0); }
          25% { transform: rotate(-10deg) scale(1.1); }
          50% { transform: rotate(10deg) scale(1.1); }
          75% { transform: rotate(-5deg) scale(1.05); }
          100% { transform: rotate(0deg) scale(1); }
        }
        
        @keyframes slide-in-progress {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes slow-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1.1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-slide-up {
          animation: slide-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-check-bounce {
          animation: check-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-cross-shake {
          animation: cross-shake 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-slide-in-progress {
          animation: slide-in-progress 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-slow-pulse {
          animation: slow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default QuizPage;
