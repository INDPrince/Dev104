import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, RotateCcw, Trophy, Clock, CheckCircle, XCircle, TimerOff, ChevronDown } from 'lucide-react';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { results, totalQuestions, subject, quizConfig } = location.state || {};

  const [wrongExpanded, setWrongExpanded] = useState(false);
  const [correctExpanded, setCorrectExpanded] = useState(false);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [animatedStroke, setAnimatedStroke] = useState(0);

  // Get theme based on class
  const selectedClass = localStorage.getItem('selectedClass') || '11th';
  const classThemes = {
    '10th': {
      gradient: 'from-blue-500 to-indigo-600',
      light: 'from-blue-50 to-indigo-50',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
    '11th': {
      gradient: 'from-emerald-500 to-teal-600',
      light: 'from-emerald-50 to-teal-50',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
    },
    '12th': {
      gradient: 'from-pink-500 to-rose-600',
      light: 'from-pink-50 to-rose-50',
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      border: 'border-pink-200',
    }
  };
  const currentTheme = classThemes[selectedClass];

  // Function to clean question text from markers
  const cleanQuestionText = (text) => {
    if (!text) return text;
    // Remove !u markers but keep the text
    let cleaned = text.replace(/!u\s*(.*?)\s*!u/g, '$1');
    // Replace !b with blank indicator
    cleaned = cleaned.replace(/!b/g, '______');
    return cleaned;
  };

  const stats = useMemo(() => {
    if (!results) return null;

    const correct = results.filter(r => r.isCorrect).length;
    const incorrect = results.filter(r => !r.isCorrect && !r.wasTimeout).length;
    const timeout = results.filter(r => r.wasTimeout).length;
    const accuracy = ((correct / totalQuestions) * 100).toFixed(2);
    const avgTime = (results.reduce((sum, r) => sum + r.timeTaken, 0) / results.length).toFixed(1);

    return {
      correct,
      incorrect,
      timeout,
      accuracy,
      avgTime,
      score: correct,
      total: totalQuestions
    };
  }, [results, totalQuestions]);

  const correctQuestions = useMemo(() => {
    return results?.filter(r => r.isCorrect) || [];
  }, [results]);

  const wrongQuestions = useMemo(() => {
    return results?.filter(r => !r.isCorrect) || [];
  }, [results]);

  // Animate percentage and circle TOGETHER - Perfectly synchronized
  useEffect(() => {
    if (!stats) return;
    
    const targetPercentage = parseFloat(stats.accuracy);
    const duration = 2000; // Increased duration for smoother animation
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out animation with exact same curve for both
      const easeOutProgress = 1 - Math.pow(1 - progress, 2);
      const currentValue = targetPercentage * easeOutProgress;
      
      // Update both with exactly the same value
      setAnimatedPercentage(currentValue);
      setAnimatedStroke(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Ensure final values are exactly the same
        setAnimatedPercentage(targetPercentage);
        setAnimatedStroke(targetPercentage);
      }
    };

    // Start animation after a tiny delay to ensure state is ready
    setTimeout(() => requestAnimationFrame(animate), 50);
  }, [stats]);

  const handleRetry = () => {
    if (quizConfig) {
      // Add a timestamp to force fresh data load and reshuffle
      navigate('/quiz', {
        state: {
          ...quizConfig,
          subject,
          retryTimestamp: Date.now() // Force fresh state
        },
        replace: true // Replace history to avoid back button issues
      });
    }
  };

  if (!results || !stats) {
    navigate('/');
    return null;
  }

  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedStroke / 100) * circumference;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.light} pb-24`}>
      {/* Header */}
      <div className={`bg-white/80 backdrop-blur-sm border-b ${currentTheme.border}`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">Quiz Results</h1>
          <p className="text-xs text-gray-500">{subject?.name || 'Quiz'}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Score Card */}
        <div className={`bg-gradient-to-br from-white to-${currentTheme.bg}/30 rounded-3xl p-6 mb-5 border-2 ${currentTheme.border} shadow-xl animate-scale-in`}>
          <div className="text-center mb-5">
            <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${currentTheme.gradient} rounded-2xl mb-3 shadow-lg`}>
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Quiz Complete!</h2>
            <p className="text-sm text-gray-600">Here's how you performed</p>
          </div>

          {/* Circular Progress - Fixed Animation */}
          <div className="relative w-40 h-40 mx-auto mb-5">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#e5e7eb"
                strokeWidth="10"
                fill="none"
              />
              {/* Animated progress circle - Synchronized with percentage */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="url(#gradient)"
                strokeWidth="10"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: 'none'
                }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={selectedClass === '10th' ? '#3b82f6' : selectedClass === '12th' ? '#ec4899' : '#10b981'} />
                  <stop offset="100%" stopColor={selectedClass === '10th' ? '#6366f1' : selectedClass === '12th' ? '#f43f5e' : '#0d9488'} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-3xl font-bold text-gray-800">{animatedPercentage.toFixed(1)}%</div>
              <div className="text-xs text-gray-500 mt-0.5">Accuracy</div>
            </div>
          </div>

          <div className="text-center text-base text-gray-600">
            Score: <span className={`text-xl font-bold ${currentTheme.text}`}>{stats.score}</span>
            <span className="mx-1">/</span>
            <span className="text-xl font-bold text-gray-800">{stats.total}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl p-3.5 border-2 border-emerald-100 animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-600">{stats.correct}</div>
                <div className="text-xs text-gray-500">Correct</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border-2 border-red-100 animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-red-600">{stats.incorrect}</div>
                <div className="text-xs text-gray-500">Incorrect</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border-2 border-orange-100 animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                <TimerOff className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-orange-600">{stats.timeout}</div>
                <div className="text-xs text-gray-500">Timeout</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border-2 border-emerald-100 animate-slide-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-600">{stats.avgTime}s</div>
                <div className="text-xs text-gray-500">Avg Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wrong Questions Review - Collapsible */}
        {wrongQuestions.length > 0 && (
          <div className="mb-4 animate-fade-in">
            <button
              onClick={() => setWrongExpanded(!wrongExpanded)}
              className="w-full bg-white rounded-xl p-4 border-2 border-red-100 flex items-center justify-between hover:bg-red-50/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-gray-800">Review Wrong Answers ({wrongQuestions.length})</h3>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${wrongExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {wrongExpanded && (
              <div className="mt-3 space-y-2 animate-expand">
                {wrongQuestions.map((result, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 border border-red-100">
                    <p className="font-semibold text-gray-800 mb-2 text-sm">{cleanQuestionText(result.question)}</p>
                    <div className="space-y-1.5 text-xs">
                      {result.selectedOption && (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Your answer: {result.selectedOption}</span>
                        </div>
                      )}
                      {result.wasTimeout && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <TimerOff className="w-3.5 h-3.5" />
                          <span>Time expired - No answer selected</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Correct answer: {result.correctAnswer}</span>
                      </div>
                      <div className="text-gray-500 text-right">Time: {result.timeTaken}s</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Correct Questions - Collapsible */}
        {correctQuestions.length > 0 && (
          <div className="animate-fade-in">
            <button
              onClick={() => setCorrectExpanded(!correctExpanded)}
              className="w-full bg-white rounded-xl p-4 border-2 border-emerald-100 flex items-center justify-between hover:bg-emerald-50/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-800">Correct Answers ({correctQuestions.length})</h3>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${correctExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {correctExpanded && (
              <div className="mt-3 space-y-2 animate-expand">
                {correctQuestions.map((result, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 border border-emerald-100">
                    <p className="font-semibold text-gray-800 mb-2 text-sm">{cleanQuestionText(result.question)}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{result.correctAnswer}</span>
                      </div>
                      <span className="text-gray-500">{result.timeTaken}s</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t ${currentTheme.border} p-4`}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/')}
            className="py-3 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
          >
            <Home className="w-5 h-5" />
            Home
          </button>
          <button
            onClick={handleRetry}
            className={`py-3 rounded-xl font-bold bg-gradient-to-r ${currentTheme.gradient} text-white transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-lg`}
          >
            <RotateCcw className="w-5 h-5" />
            Retry
          </button>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes expand {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 2000px;
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s ease-out both;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-expand {
          animation: expand 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ResultPage;
