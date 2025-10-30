import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Sparkles, GraduationCap, Library } from 'lucide-react';
import { getAllSubjects, getAllClasses, getWordMeaningSubjects } from '../firebase/services';

const HomePage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [wordMeaningSubjects, setWordMeaningSubjects] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [loading, setLoading] = useState(true);
  // CRITICAL: Set class from localStorage IMMEDIATELY to prevent theme flash
  const [selectedClass, setSelectedClass] = useState(localStorage.getItem('selectedClass') || null);
  const [showClassSelection, setShowClassSelection] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);

  // Theme colors for each class
  const classThemes = {
    '10th': {
      gradient: 'from-blue-500 to-indigo-600',
      light: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      iconBg: 'from-blue-100 to-indigo-100',
      iconText: 'text-blue-700',
      shadow: 'hover:shadow-blue-100/50',
      btnHover: 'hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600'
    },
    '11th': {
      gradient: 'from-emerald-500 to-teal-600',
      light: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      iconBg: 'from-emerald-100 to-teal-100',
      iconText: 'text-emerald-700',
      shadow: 'hover:shadow-emerald-100/50',
      btnHover: 'hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-600'
    },
    '12th': {
      gradient: 'from-pink-500 to-rose-600',
      light: 'from-pink-50 to-rose-50',
      border: 'border-pink-200',
      hoverBorder: 'hover:border-pink-400',
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      iconBg: 'from-pink-100 to-rose-100',
      iconText: 'text-pink-700',
      shadow: 'hover:shadow-pink-100/50',
      btnHover: 'hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-600'
    }
  };

  const currentTheme = classThemes[selectedClass] || classThemes['11th'];

  useEffect(() => {
    // Load available classes first
    const initializeApp = async () => {
      const classes = await getAllClasses();
      setAvailableClasses(classes);
      
      // Check if class is already selected in localStorage
      const savedClass = localStorage.getItem('selectedClass');
      if (savedClass) {
        // Set class IMMEDIATELY to avoid theme flash
        setSelectedClass(savedClass);
        updateManifestAndTheme(savedClass); // Update theme on load
        loadSubjects(savedClass);
      } else {
        setShowClassSelection(true);
        setLoading(false);
      }
    };
    
    initializeApp();
  }, []);
  
  const handleClassSelect = (classValue) => {
    setSelectedClass(classValue);
    localStorage.setItem('selectedClass', classValue);
    setShowClassSelection(false);
    setIsClassDropdownOpen(false);
    // NO LOADING - Smooth transition
    loadSubjects(classValue);
    
    // Update manifest and theme color dynamically
    updateManifestAndTheme(classValue);
  };
  
  // Function to update manifest link and theme color
  const updateManifestAndTheme = (classValue) => {
    const themeColors = {
      '10th': '#3b82f6',  // blue
      '11th': '#10b981',  // emerald
      '12th': '#ec4899'   // pink
    };
    
    const manifestFiles = {
      '10th': '/manifest-blue.json',
      '11th': '/manifest-green.json',
      '12th': '/manifest-pink.json'
    };
    
    const themeColor = themeColors[classValue] || themeColors['11th'];
    const manifestFile = manifestFiles[classValue] || manifestFiles['11th'];
    
    // Update theme-color meta tag
    const themeMetaTag = document.querySelector('meta[name="theme-color"]');
    if (themeMetaTag) {
      themeMetaTag.setAttribute('content', themeColor);
    }
    
    // Update status bar style for iOS
    const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBarMeta) {
      statusBarMeta.setAttribute('content', 'light-content');
    }
    
    // Update manifest link dynamically based on theme
    const manifestLink = document.getElementById('manifest-link');
    if (manifestLink) {
      manifestLink.setAttribute('href', manifestFile);
    }
  };

  const loadSubjects = async (classValue) => {
    setLoading(true);
    
    try {
      // Try to load from Firebase first
      const [data, wmData] = await Promise.all([
        getAllSubjects(),
        getWordMeaningSubjects()
      ]);
      
      // Filter subjects by class
      const filteredSubjects = data.filter(s => s.class === classValue || !s.class);
      setSubjects(filteredSubjects);
      
      // Filter word meaning subjects
      const filteredWMSubjects = wmData.filter(s => s.class === classValue || !s.class);
      setWordMeaningSubjects(filteredWMSubjects);
    } catch (error) {
      console.error('Failed to load from Firebase:', error);
      setSubjects([]);
      setWordMeaningSubjects([]);
    }
    
    setLoading(false);
  };

  const handleSubjectSelect = (subjectId) => {
    navigate(`/chapters/${subjectId}`);
  };

  const handleWordMeaningSubjectSelect = (subjectId) => {
    navigate(`/word-meaning/chapters/${subjectId}`);
  };

  // Class Selection Screen
  if (showClassSelection && !loading) {
    // Don't show popup until classes are loaded
    if (availableClasses.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <svg className="w-20 h-20 animate-spin" viewBox="0 0 100 100">
                <circle
                  className="stroke-current text-emerald-200"
                  strokeWidth="8"
                  fill="none"
                  cx="50"
                  cy="50"
                  r="40"
                />
                <circle
                  className="stroke-current text-emerald-600"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                  cx="50"
                  cy="50"
                  r="40"
                  strokeDasharray="251.2"
                  strokeDashoffset="62.8"
                  style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
                />
              </svg>
            </div>
            <p className="text-gray-600 mt-4 font-medium">Loading classes...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Enhanced Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-purple-400 rounded-full opacity-30 blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-400 rounded-full opacity-30 blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-400 rounded-full opacity-20 blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-40 right-1/4 w-48 h-48 bg-rose-400 rounded-full opacity-25 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 max-w-md w-full border-2 border-white/60 relative z-10 animate-reveal-popup">
          {/* Enhanced Decorative Elements */}
          <div className="absolute -top-3 -right-3 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-2xl opacity-50 animate-pulse-slow"></div>
          <div className="absolute -bottom-3 -left-3 w-28 h-28 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full blur-2xl opacity-50 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          
          <div className="text-center mb-8 relative">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl animate-bounce-slow relative">
              <GraduationCap className="w-14 h-14 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl blur-xl opacity-60 animate-pulse"></div>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-3 animate-fade-in">
              Welcome! 🎓
            </h2>
            <p className="text-gray-600 text-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Select Your Class to Begin
            </p>
          </div>
          
          <div className="space-y-4">
            {availableClasses.map((cls, index) => {
              const theme = classThemes[cls.name] || classThemes['11th'];
              const classNumber = cls.name.replace(/[^0-9]/g, '');
              
              return (
                <button
                  key={cls.id}
                  onClick={() => handleClassSelect(cls.name)}
                  className={`w-full py-5 px-6 bg-gradient-to-r ${theme.light} border-2 ${theme.border} rounded-2xl font-bold text-xl text-gray-800 hover:text-white transition-all duration-300 hover:shadow-2xl hover:scale-105 flex items-center justify-between group relative overflow-hidden animate-slide-in-stagger`}
                  style={{ animationDelay: `${index * 0.15 + 0.4}s` }}
                >
                  {/* Hover Background Effect with Shine */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                  
                  <span className="flex items-center gap-4 relative z-10">
                    <span className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white text-xl font-bold shadow-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-300`}>
                      {classNumber}
                    </span>
                    <span className="text-left">Class {cls.name}</span>
                  </span>
                  <ChevronRight className="w-6 h-6 relative z-10 transform group-hover:translate-x-3 group-hover:scale-150 transition-all duration-300" />
                </button>
              );
            })}
          </div>
          
          <p className="text-center text-sm text-gray-500 mt-6 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            ✨ Choose your class to access customized quizzes
          </p>
        </div>
      </div>
    );
  }

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

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.light}`}>
      {/* Header */}
      <div className={`bg-white/80 backdrop-blur-sm border-b ${currentTheme.border} sticky top-0 z-10`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${currentTheme.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">QuizMaster</h1>
                <p className="text-xs text-gray-500">Test Your Knowledge</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Class Selector Icon */}
              <div className="relative">
                <button
                  onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${currentTheme.border} ${currentTheme.hoverBorder} hover:${currentTheme.bg} transition-all`}
                  title="Change Class"
                >
                  <GraduationCap className={`w-5 h-5 ${currentTheme.text}`} />
                  <span className="text-sm font-semibold text-gray-700">{selectedClass}</span>
                </button>
                
                {isClassDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-32 bg-white border-2 ${currentTheme.border} rounded-lg shadow-lg z-50`}>
                    {availableClasses.map((cls) => {
                      const theme = classThemes[cls.name] || classThemes['11th'];
                      return (
                        <button
                          key={cls.id}
                          onClick={() => {
                            handleClassSelect(cls.name);
                            setIsClassDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left hover:${theme.bg} transition-colors ${
                            selectedClass === cls.name ? `${theme.bg} font-semibold` : ''
                          }`}
                        >
                          {cls.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Select a Subject</h2>
          <p className="text-gray-600">Choose your subject to start practicing</p>
        </div>

        {/* Subject Cards */}
        {subjects.length === 0 ? (
          <div className="text-center py-8 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200 mb-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No subjects available yet</p>
          </div>
        ) : (
          <div className="grid gap-4 mb-12">
            {subjects.map((subject, index) => (
              <div
                key={subject.id}
                className="group cursor-pointer"
                onClick={() => handleSubjectSelect(subject.id)}
                onMouseEnter={() => setHoveredCard(subject.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  animation: `slideUp 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                <div className={`bg-white rounded-2xl p-6 border-2 border-gray-100 ${currentTheme.hoverBorder.replace('hover:', 'hover:border-')} transition-all duration-300 hover:shadow-xl ${currentTheme.shadow} hover:-translate-y-1`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        hoveredCard === subject.id 
                          ? `bg-gradient-to-br ${currentTheme.gradient} shadow-lg scale-110` 
                          : `bg-gradient-to-br ${currentTheme.iconBg}`
                      }`}>
                        <BookOpen className={`w-7 h-7 transition-colors ${
                          hoveredCard === subject.id ? 'text-white' : currentTheme.iconText
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{subject.name}</h3>
                        <p className="text-sm text-gray-500">{subject.totalChapters || 0} Chapters</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-6 h-6 text-gray-400 transition-all duration-300 ${
                      hoveredCard === subject.id ? `translate-x-2 ${currentTheme.text}` : ''
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Word Meaning Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentTheme.gradient} flex items-center justify-center shadow-md`}>
              <Library className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Word Meaning</h2>
              <p className="text-sm text-gray-600">Page-wise vocabulary practice</p>
            </div>
          </div>
        </div>

        {/* Word Meaning Subject Cards */}
        {wordMeaningSubjects.length === 0 ? (
          <div className="text-center py-8 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
            <Library className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No word meaning subjects yet</p>
          </div>
        ) : (
          <div className="grid gap-4 mb-20">
            {wordMeaningSubjects.map((subject, index) => (
              <div
                key={`wm-${subject.id}`}
                className="group cursor-pointer"
                onClick={() => handleWordMeaningSubjectSelect(subject.id)}
                onMouseEnter={() => setHoveredCard(`wm-${subject.id}`)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  animation: `slideUp 0.5s ease-out ${(subjects.length + index) * 0.1}s both`
                }}
              >
                <div className={`bg-gradient-to-br from-white to-${currentTheme.bg}/20 rounded-2xl p-6 border-2 ${currentTheme.border} ${currentTheme.hoverBorder} transition-all duration-300 hover:shadow-xl ${currentTheme.shadow} hover:-translate-y-1`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        hoveredCard === `wm-${subject.id}` 
                          ? `bg-gradient-to-br ${currentTheme.gradient} shadow-lg scale-110` 
                          : `bg-gradient-to-br ${currentTheme.iconBg}`
                      }`}>
                        <Library className={`w-7 h-7 transition-colors ${
                          hoveredCard === `wm-${subject.id}` ? 'text-white' : currentTheme.iconText
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{subject.name}</h3>
                        <p className="text-sm text-gray-500">{subject.totalChapters || 0} Chapters</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-6 h-6 text-gray-400 transition-all duration-300 ${
                      hoveredCard === `wm-${subject.id}` ? `translate-x-2 ${currentTheme.text}` : ''
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx="true">{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes slide-down-desktop {
          from {
            opacity: 0;
            transform: translateY(-100px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slide-up-mobile {
          from {
            opacity: 0;
            transform: translateY(100px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slide-in-stagger {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-25px) rotate(-5deg);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.2;
            transform: scale(1.05);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
        
        .animate-slide-down-desktop {
          animation: slide-down-desktop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-slide-up-mobile {
          animation: slide-up-mobile 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-slide-in-stagger {
          animation: slide-in-stagger 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        /* Mobile: slide from bottom */
        @media (max-width: 768px) {
          .animate-slide-down-desktop {
            animation: slide-up-mobile 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;