import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, Play, Layers } from 'lucide-react';
import { getWordMeaningPages } from '../firebase/services';

const WordMeaningPageSelection = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { subject } = location.state || {};
  
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [combinedLimit, setCombinedLimit] = useState(20);
  const [visibleStartPages, setVisibleStartPages] = useState(5);
  const [showAllStartPages, setShowAllStartPages] = useState(false);

  // Get theme based on class
  const selectedClass = localStorage.getItem('selectedClass') || '11th';
  const classThemes = {
    '10th': {
      gradient: 'from-blue-500 to-indigo-600',
      light: 'from-blue-50 to-indigo-50',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
    },
    '11th': {
      gradient: 'from-emerald-500 to-teal-600',
      light: 'from-emerald-50 to-teal-50',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
    },
    '12th': {
      gradient: 'from-pink-500 to-rose-600',
      light: 'from-pink-50 to-rose-50',
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      border: 'border-pink-200',
      hoverBorder: 'hover:border-pink-400',
    }
  };
  const currentTheme = classThemes[selectedClass] || classThemes['11th'];

  useEffect(() => {
    loadPages();
  }, [chapterId]);

  const loadPages = async () => {
    const pagesData = await getWordMeaningPages(chapterId);
    setPages(pagesData);
    
    // Set default combined limit to total questions
    const totalQuestions = pagesData.reduce((sum, page) => sum + (page.questionCount || 0), 0);
    setCombinedLimit(totalQuestions);
    
    setLoading(false);
  };

  const handlePageSelect = (pageId, pageNumber) => {
    navigate('/quiz', {
      state: {
        isWordMeaning: true,
        isSinglePage: true,
        selectedPages: [pageId],
        currentPageIndex: 0,
        allPages: [{ id: pageId, pageNumber }],
        questionLimit: pages.find(p => p.id === pageId)?.questionCount || 15,
        subject,
        chapterId
      }
    });
  };

  const handleStartFromPage = (startIndex) => {
    const selectedPages = pages.slice(startIndex).map(p => ({
      id: p.id,
      pageNumber: p.pageNumber
    }));
    
    navigate('/quiz', {
      state: {
        isWordMeaning: true,
        isSinglePage: true,
        selectedPages: selectedPages.map(p => p.id),
        currentPageIndex: 0,
        allPages: selectedPages,
        questionLimit: pages[startIndex]?.questionCount || 15,
        subject,
        chapterId
      }
    });
  };

  const handleCombinedQuiz = () => {
    const allPageIds = pages.map(p => p.id);
    
    navigate('/quiz', {
      state: {
        isWordMeaning: true,
        isCombinedQuiz: true,
        selectedPages: allPageIds,
        questionLimit: combinedLimit,
        subject,
        chapterId
      }
    });
  };

  const totalQuestions = pages.reduce((sum, page) => sum + (page.questionCount || 0), 0);

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.light} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 ${currentTheme.border} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
          <p className="text-gray-600">Loading pages...</p>
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
              onClick={() => navigate(-1)}
              className={`p-2 hover:${currentTheme.bg} rounded-lg transition-colors`}
            >
              <ArrowLeft className={`w-5 h-5 ${currentTheme.text}`} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Select Pages</h1>
              <p className="text-sm text-gray-500">Choose how you want to practice</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {pages.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No pages available yet</p>
          </div>
        ) : (
          <>
            {/* Individual Pages */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Practice by Page</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {pages.map((page, index) => (
                  <button
                    key={page.id}
                    onClick={() => handlePageSelect(page.id, page.pageNumber)}
                    className={`p-4 bg-white rounded-xl border-2 ${currentTheme.border} ${currentTheme.hoverBorder} hover:shadow-lg transition-all duration-200 hover:-translate-y-1`}
                    style={{
                      animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${currentTheme.gradient} flex items-center justify-center shadow-md`}>
                        <span className="text-white font-bold">{page.pageNumber}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Page {page.pageNumber}</span>
                      <span className="text-xs text-gray-500">{page.questionCount || 0} words</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start From Page Options with Slide Effect */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Start From Specific Page</h2>
                {pages.length > 5 && (
                  <button
                    onClick={() => setShowAllStartPages(!showAllStartPages)}
                    className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${currentTheme.bg} ${currentTheme.text} hover:shadow-md`}
                  >
                    {showAllStartPages ? 'Show Less' : `Show All (${pages.length})`}
                  </button>
                )}
              </div>
              
              <div className="relative overflow-hidden">
                <div 
                  className="grid gap-3 transition-all duration-500 ease-in-out"
                  style={{
                    maxHeight: showAllStartPages ? `${pages.length * 100}px` : '500px',
                    overflow: showAllStartPages ? 'visible' : 'hidden'
                  }}
                >
                  {pages.slice(0, showAllStartPages ? pages.length : visibleStartPages).map((page, index) => (
                    <button
                      key={`start-${page.id}`}
                      onClick={() => handleStartFromPage(index)}
                      className={`p-4 bg-white rounded-xl border-2 ${currentTheme.border} ${currentTheme.hoverBorder} hover:shadow-lg transition-all duration-200 flex items-center justify-between group`}
                      style={{
                        animation: `slideInRight 0.3s ease-out ${index * 0.05}s both`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentTheme.gradient} flex items-center justify-center`}>
                          <Play className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-800">Start from Page {page.pageNumber}</p>
                          <p className="text-sm text-gray-500">Continue through Page {pages[pages.length - 1].pageNumber}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full ${currentTheme.bg} ${currentTheme.text} text-xs font-medium`}>
                        {pages.slice(index).length} page{pages.slice(index).length > 1 ? 's' : ''}
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Gradient overlay when collapsed */}
                {!showAllStartPages && pages.length > 5 && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                )}
              </div>
            </div>

            {/* Combined Quiz */}
            <div className={`p-6 bg-gradient-to-br from-white to-${currentTheme.bg}/30 rounded-2xl border-2 ${currentTheme.border} shadow-lg`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentTheme.gradient} flex items-center justify-center shadow-md`}>
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Combined Quiz</h2>
                  <p className="text-sm text-gray-600">All pages mixed together</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions: {combinedLimit}
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="5"
                    max={totalQuestions}
                    value={combinedLimit}
                    onChange={(e) => setCombinedLimit(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none 
                      [&::-webkit-slider-thumb]:w-5 
                      [&::-webkit-slider-thumb]:h-5 
                      [&::-webkit-slider-thumb]:rounded-full 
                      [&::-webkit-slider-thumb]:bg-gradient-to-br
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-5 
                      [&::-moz-range-thumb]:h-5 
                      [&::-moz-range-thumb]:rounded-full 
                      [&::-moz-range-thumb]:border-0 
                      [&::-moz-range-thumb]:shadow-lg
                      [&::-moz-range-thumb]:cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, 
                        ${currentTheme.gradient.includes('blue') ? '#3b82f6' : currentTheme.gradient.includes('emerald') ? '#10b981' : '#ec4899'} 0%, 
                        ${currentTheme.gradient.includes('blue') ? '#3b82f6' : currentTheme.gradient.includes('emerald') ? '#10b981' : '#ec4899'} ${(combinedLimit / totalQuestions) * 100}%, 
                        #e5e7eb ${(combinedLimit / totalQuestions) * 100}%, 
                        #e5e7eb 100%)`,
                      '--tw-gradient-from': currentTheme.gradient.includes('blue') ? '#3b82f6' : currentTheme.gradient.includes('emerald') ? '#10b981' : '#ec4899',
                      '--tw-gradient-to': currentTheme.gradient.includes('blue') ? '#4f46e5' : currentTheme.gradient.includes('emerald') ? '#14b8a6' : '#ec4899'
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5</span>
                  <span>{totalQuestions} (max)</span>
                </div>
              </div>

              <button
                onClick={handleCombinedQuiz}
                className={`w-full py-3 bg-gradient-to-r ${currentTheme.gradient} text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2`}
              >
                <Play className="w-5 h-5" />
                Start Combined Quiz
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx="true">{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        input[type="range"]::-webkit-slider-thumb {
          background: linear-gradient(135deg, 
            ${currentTheme.gradient.includes('blue') ? '#3b82f6, #4f46e5' : 
              currentTheme.gradient.includes('emerald') ? '#10b981, #14b8a6' : '#ec4899, #f43f5e'}) !important;
        }
        
        input[type="range"]::-moz-range-thumb {
          background: linear-gradient(135deg, 
            ${currentTheme.gradient.includes('blue') ? '#3b82f6, #4f46e5' : 
              currentTheme.gradient.includes('emerald') ? '#10b981, #14b8a6' : '#ec4899, #f43f5e'}) !important;
        }
      `}</style>
    </div>
  );
};

export default WordMeaningPageSelection;
