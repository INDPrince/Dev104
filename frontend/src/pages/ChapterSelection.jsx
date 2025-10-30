import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, AlertCircle } from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { getAllSubjects, getChaptersBySubject } from '../firebase/services';

const ChapterSelection = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [questionLimit, setQuestionLimit] = useState('');
  const [loading, setLoading] = useState(true);

  // Get theme based on class
  const selectedClass = localStorage.getItem('selectedClass');
  
  // Redirect if no class is selected
  useEffect(() => {
    if (!selectedClass) {
      navigate('/');
      return;
    }
  }, [selectedClass, navigate]);
  const classThemes = {
    '10th': {
      gradient: 'from-blue-500 to-indigo-600',
      light: 'from-blue-50 to-indigo-50',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      checkBg: 'bg-blue-500',
      checkBorder: 'border-blue-500',
      hoverBorder: 'hover:border-blue-200'
    },
    '11th': {
      gradient: 'from-emerald-500 to-teal-600',
      light: 'from-emerald-50 to-teal-50',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      checkBg: 'bg-emerald-500',
      checkBorder: 'border-emerald-500',
      hoverBorder: 'hover:border-emerald-200'
    },
    '12th': {
      gradient: 'from-pink-500 to-rose-600',
      light: 'from-pink-50 to-rose-50',
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      border: 'border-pink-200',
      checkBg: 'bg-pink-500',
      checkBorder: 'border-pink-500',
      hoverBorder: 'hover:border-pink-200'
    }
  };
  const currentTheme = selectedClass ? classThemes[selectedClass] : classThemes['11th'];

  useEffect(() => {
    loadData();
  }, [subjectId]);

  const loadData = async () => {
    // 🚀 Load subject and chapters in parallel for faster loading
    const [subjects, chaptersData] = await Promise.all([
      getAllSubjects(),
      getChaptersBySubject(subjectId)
    ]);
    
    const foundSubject = subjects.find(s => s.id === subjectId);
    
    // Class validation - prevent wrong class URL access
    if (foundSubject && foundSubject.class && foundSubject.class !== selectedClass) {
      // Wrong class - redirect to home
      navigate('/');
      return;
    }
    
    if (foundSubject) {
      setSubject(foundSubject);
      setChapters(chaptersData);
    }
    setLoading(false);
  };

  const maxQuestions = useMemo(() => {
    if (selectedChapters.length === 0) return 0;
    return selectedChapters.reduce((total, chapterId) => {
      const chapter = chapters.find(ch => ch.id === chapterId);
      return total + (chapter?.questionCount || 0);
    }, 0);
  }, [selectedChapters, chapters]);

  useEffect(() => {
    if (maxQuestions > 0) {
      setQuestionLimit(maxQuestions.toString());
    } else {
      setQuestionLimit('');
    }
  }, [maxQuestions]);

  const handleChapterToggle = (chapterId) => {
    setSelectedChapters(prev => {
      if (prev.includes(chapterId)) {
        return prev.filter(id => id !== chapterId);
      }
      return [...prev, chapterId];
    });
  };

  const handleQuestionLimitChange = (e) => {
    const value = e.target.value;
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= maxQuestions)) {
      setQuestionLimit(value);
    }
  };

  const handleStartQuiz = () => {
    if (selectedChapters.length === 0) return;
    
    const limit = parseInt(questionLimit) || maxQuestions;
    navigate('/quiz', {
      state: {
        subjectId,
        selectedChapters,
        questionLimit: limit,
        subject
      }
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.light} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 ${currentTheme.text.replace('text', 'border')} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.light} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-gray-600 mb-4">Subject not found</p>
          <button onClick={() => navigate('/')} className={`${currentTheme.text} hover:underline`}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.light}`}>
      {/* Header */}
      <div className={`bg-white/80 backdrop-blur-sm border-b ${currentTheme.border} sticky top-0 z-10`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{subject.name}</h1>
              <p className="text-xs text-gray-500">Select Chapters</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
        <div className="mb-6 animate-fade-in">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Choose Chapters</h2>
          <p className="text-sm text-gray-600">Select chapters for your quiz</p>
        </div>

        {/* Chapters List */}
        {chapters.length === 0 ? (
          <div className="text-center py-8 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No chapters available yet</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {chapters.map((chapter, index) => {
              const isSelected = selectedChapters.includes(chapter.id);
              return (
                <div
                  key={chapter.id}
                  className={`bg-white rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer ${
                    isSelected ? `border-${currentTheme.border.split('-')[1]}-400 ${currentTheme.bg}/50` : `border-gray-100 ${currentTheme.hoverBorder}`
                  }`}
                  onClick={() => handleChapterToggle(chapter.id)}
                  style={{
                    animation: `slideUp 0.4s ease-out ${index * 0.05}s both`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      className={`w-5 h-5 border-2`}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{chapter.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {chapter.questionCount || 0} Questions • {chapter.timer}s per question
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Question Limit Info */}
        {selectedChapters.length > 0 && (
          <div className={`bg-gradient-to-r ${currentTheme.light} rounded-xl p-4 border ${currentTheme.border} animate-scale-in`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 ${currentTheme.text} mt-0.5`} />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-2">Question Limit</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Maximum questions available: <span className={`font-bold ${currentTheme.text}`}>{maxQuestions}</span>
                </p>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Adjust Question Count</label>
                  <input
                    type="number"
                    value={questionLimit}
                    onChange={handleQuestionLimitChange}
                    min="1"
                    max={maxQuestions}
                    className={`w-full px-4 py-2 border-2 ${currentTheme.border} rounded-lg focus:outline-none transition-colors`}
                    placeholder="Enter number of questions"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Fixed Button */}
      {selectedChapters.length > 0 && (
        <div className={`fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t ${currentTheme.border} p-4 animate-slide-up`}>
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleStartQuiz}
              className={`w-full bg-gradient-to-r ${currentTheme.gradient} text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95`}
            >
              <Play className="w-6 h-6" />
              Start Quiz
            </button>
          </div>
        </div>
      )}

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
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
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
        
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChapterSelection;
