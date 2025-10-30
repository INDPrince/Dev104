import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, Play, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { getWordMeaningPages } from '../firebase/services';

const WordMeaningPageSelection = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { subject } = location.state || {};
  
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [combinedLimit, setCombinedLimit] = useState(20);
  
  // Carousel states for "Practice by Page"
  const [currentPracticeSlide, setCurrentPracticeSlide] = useState(0);
  const practiceCarouselRef = useRef(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  // Carousel states for "Start From Specific Page"
  const [currentStartSlide, setCurrentStartSlide] = useState(0);
  const startCarouselRef = useRef(null);

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
      progressColor: '#3b82f6',
    },
    '11th': {
      gradient: 'from-emerald-500 to-teal-600',
      light: 'from-emerald-50 to-teal-50',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
      progressColor: '#10b981',
    },
    '12th': {
      gradient: 'from-pink-500 to-rose-600',
      light: 'from-pink-50 to-rose-50',
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      border: 'border-pink-200',
      hoverBorder: 'hover:border-pink-400',
      progressColor: '#ec4899',
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

  // Practice by Page: 6 cards per slide (3x2 grid)
  const practiceCardsPerSlide = 6;
  const totalPracticeSlides = Math.ceil(pages.length / practiceCardsPerSlide);

  const goToPracticeSlide = (index) => {
    setCurrentPracticeSlide(index);
  };

  const nextPracticeSlide = () => {
    if (currentPracticeSlide < totalPracticeSlides - 1) {
      setCurrentPracticeSlide(currentPracticeSlide + 1);
    }
  };

  const prevPracticeSlide = () => {
    if (currentPracticeSlide > 0) {
      setCurrentPracticeSlide(currentPracticeSlide - 1);
    }
  };

  // Start From Specific Page: 5 items per slide
  const startItemsPerSlide = 5;
  const totalStartSlides = Math.ceil(pages.length / startItemsPerSlide);

  const goToStartSlide = (index) => {
    setCurrentStartSlide(index);
  };

  const nextStartSlide = () => {
    if (currentStartSlide < totalStartSlides - 1) {
      setCurrentStartSlide(currentStartSlide + 1);
    }
  };

  const prevStartSlide = () => {
    if (currentStartSlide > 0) {
      setCurrentStartSlide(currentStartSlide - 1);
    }
  };

  // Touch handlers for mobile swipe - IMPROVED
  const handleTouchStart = (e, type) => {
    const touch = e.touches ? e.touches[0] : e;
    setTouchStart(touch.clientX);
    setTouchEnd(touch.clientX);
  };

  const handleTouchMove = (e, type) => {
    const touch = e.touches ? e.touches[0] : e;
    setTouchEnd(touch.clientX);
  };

  const handleTouchEnd = (type) => {
    const swipeDistance = touchStart - touchEnd;
    const minSwipeDistance = 50; // Reduced for better sensitivity
    
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe left - next slide
        if (type === 'practice') {
          nextPracticeSlide();
        } else {
          nextStartSlide();
        }
      } else {
        // Swipe right - prev slide
        if (type === 'practice') {
          prevPracticeSlide();
        } else {
          prevStartSlide();
        }
      }
    }
    
    // Reset
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e, type) => {
    setTouchStart(e.clientX);
    setTouchEnd(e.clientX);
    e.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e, type) => {
    if (touchStart !== 0) {
      setTouchEnd(e.clientX);
    }
  };

  const handleMouseUp = (e, type) => {
    if (touchStart !== 0) {
      handleTouchEnd(type);
      e.currentTarget.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = (e, type) => {
    if (touchStart !== 0) {
      setTouchStart(0);
      setTouchEnd(0);
      e.currentTarget.style.cursor = 'grab';
    }
  };

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
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.light} pb-8`}>
      {/* Header */}
      <div className={`bg-white/80 backdrop-blur-sm border-b ${currentTheme.border} sticky top-0 z-50`}>
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
            {/* Practice by Page - Carousel (3x2 grid, 6 cards per slide) */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Practice by Page</h2>
              
              <div className="relative z-10">
                {/* Carousel Container */}
                <div 
                  className="overflow-hidden cursor-grab active:cursor-grabbing rounded-xl"
                  onTouchStart={(e) => handleTouchStart(e, 'practice')}
                  onTouchMove={(e) => handleTouchMove(e, 'practice')}
                  onTouchEnd={() => handleTouchEnd('practice')}
                  onMouseDown={(e) => handleMouseDown(e, 'practice')}
                  onMouseMove={(e) => handleMouseMove(e, 'practice')}
                  onMouseUp={(e) => handleMouseUp(e, 'practice')}
                  onMouseLeave={(e) => handleMouseLeave(e, 'practice')}
                  ref={practiceCarouselRef}
                >
                  <div 
                    className="flex transition-all duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentPracticeSlide * 100}%)` }}
                  >
                    {Array.from({ length: totalPracticeSlides }).map((_, slideIndex) => (
                      <div key={slideIndex} className="min-w-full px-1">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {pages
                            .slice(slideIndex * practiceCardsPerSlide, (slideIndex + 1) * practiceCardsPerSlide)
                            .map((page, index) => (
                              <button
                                key={page.id}
                                onClick={() => handlePageSelect(page.id, page.pageNumber)}
                                className={`p-4 bg-white rounded-xl border-2 ${currentTheme.border} ${currentTheme.hoverBorder} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105`}
                                style={{
                                  animation: `fadeInScale 0.4s ease-out ${index * 0.08}s both`,
                                  opacity: currentPracticeSlide === slideIndex ? 1 : 0.3,
                                  transition: 'opacity 0.5s ease-in-out'
                                }}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${currentTheme.gradient} flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110`}>
                                    <span className="text-white font-bold">{page.pageNumber}</span>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">Page {page.pageNumber}</span>
                                  <span className="text-xs text-gray-500">{page.questionCount || 0} words</span>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Arrows - FIXED z-index */}
                {totalPracticeSlides > 1 && (
                  <>
                    <button
                      onClick={prevPracticeSlide}
                      disabled={currentPracticeSlide === 0}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center transition-all duration-300 z-50 ${
                        currentPracticeSlide === 0 
                          ? 'opacity-0 cursor-not-allowed pointer-events-none' 
                          : 'opacity-100 hover:scale-110 hover:shadow-2xl'
                      }`}
                    >
                      <ChevronLeft className={`w-6 h-6 ${currentTheme.text}`} />
                    </button>
                    <button
                      onClick={nextPracticeSlide}
                      disabled={currentPracticeSlide === totalPracticeSlides - 1}
                      className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center transition-all duration-300 z-50 ${
                        currentPracticeSlide === totalPracticeSlides - 1 
                          ? 'opacity-0 cursor-not-allowed pointer-events-none' 
                          : 'opacity-100 hover:scale-110 hover:shadow-2xl'
                      }`}
                    >
                      <ChevronRight className={`w-6 h-6 ${currentTheme.text}`} />
                    </button>
                  </>
                )}

                {/* Pagination Dots - IMPROVED */}
                {totalPracticeSlides > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: totalPracticeSlides }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToPracticeSlide(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentPracticeSlide 
                            ? `w-8 bg-gradient-to-r ${currentTheme.gradient} shadow-lg` 
                            : 'w-2 bg-gray-300 hover:bg-gray-400 hover:w-4'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Start From Page Options - Carousel (5 items per slide) */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Start From Specific Page</h2>
              
              <div className="relative z-10">
                {/* Carousel Container */}
                <div 
                  className="overflow-hidden cursor-grab active:cursor-grabbing rounded-xl"
                  onTouchStart={(e) => handleTouchStart(e, 'start')}
                  onTouchMove={(e) => handleTouchMove(e, 'start')}
                  onTouchEnd={() => handleTouchEnd('start')}
                  onMouseDown={(e) => handleMouseDown(e, 'start')}
                  onMouseMove={(e) => handleMouseMove(e, 'start')}
                  onMouseUp={(e) => handleMouseUp(e, 'start')}
                  onMouseLeave={(e) => handleMouseLeave(e, 'start')}
                  ref={startCarouselRef}
                >
                  <div 
                    className="flex transition-all duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentStartSlide * 100}%)` }}
                  >
                    {Array.from({ length: totalStartSlides }).map((_, slideIndex) => (
                      <div key={slideIndex} className="min-w-full px-1">
                        <div className="grid gap-3">
                          {pages
                            .slice(slideIndex * startItemsPerSlide, (slideIndex + 1) * startItemsPerSlide)
                            .map((page, index) => {
                              const globalIndex = slideIndex * startItemsPerSlide + index;
                              return (
                                <button
                                  key={`start-${page.id}`}
                                  onClick={() => handleStartFromPage(globalIndex)}
                                  className={`p-4 bg-white rounded-xl border-2 ${currentTheme.border} ${currentTheme.hoverBorder} hover:shadow-lg transition-all duration-300 flex items-center justify-between group hover:scale-[1.02]`}
                                  style={{
                                    animation: `slideInRight 0.4s ease-out ${index * 0.08}s both`,
                                    opacity: currentStartSlide === slideIndex ? 1 : 0.3,
                                    transition: 'opacity 0.5s ease-in-out'
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentTheme.gradient} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12`}>
                                      <Play className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="text-left">
                                      <p className="font-semibold text-gray-800">Start from Page {page.pageNumber}</p>
                                      <p className="text-sm text-gray-500">Continue through Page {pages[pages.length - 1].pageNumber}</p>
                                    </div>
                                  </div>
                                  <div className={`px-3 py-1 rounded-full ${currentTheme.bg} ${currentTheme.text} text-xs font-medium transition-transform duration-300 group-hover:scale-110`}>
                                    {pages.slice(globalIndex).length} page{pages.slice(globalIndex).length > 1 ? 's' : ''}
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Arrows - FIXED z-index */}
                {totalStartSlides > 1 && (
                  <>
                    <button
                      onClick={prevStartSlide}
                      disabled={currentStartSlide === 0}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center transition-all duration-300 z-50 ${
                        currentStartSlide === 0 
                          ? 'opacity-0 cursor-not-allowed pointer-events-none' 
                          : 'opacity-100 hover:scale-110 hover:shadow-2xl'
                      }`}
                    >
                      <ChevronLeft className={`w-6 h-6 ${currentTheme.text}`} />
                    </button>
                    <button
                      onClick={nextStartSlide}
                      disabled={currentStartSlide === totalStartSlides - 1}
                      className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center transition-all duration-300 z-50 ${
                        currentStartSlide === totalStartSlides - 1 
                          ? 'opacity-0 cursor-not-allowed pointer-events-none' 
                          : 'opacity-100 hover:scale-110 hover:shadow-2xl'
                      }`}
                    >
                      <ChevronRight className={`w-6 h-6 ${currentTheme.text}`} />
                    </button>
                  </>
                )}

                {/* Pagination Dots - IMPROVED */}
                {totalStartSlides > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: totalStartSlides }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToStartSlide(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentStartSlide 
                            ? `w-8 bg-gradient-to-r ${currentTheme.gradient} shadow-lg` 
                            : 'w-2 bg-gray-300 hover:bg-gray-400 hover:w-4'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Combined Quiz - FIXED SLIDER ALIGNMENT */}
            <div className={`p-6 bg-gradient-to-br from-white to-${currentTheme.bg}/30 rounded-2xl border-2 ${currentTheme.border} shadow-lg overflow-hidden`}>
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
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Number of Questions: <span className="font-bold text-lg">{combinedLimit}</span>
                </label>
                <div className="relative pt-4 pb-3">
                  {/* Background track */}
                  <div className="absolute w-full h-2 bg-gray-200 rounded-full top-4"></div>
                  {/* Progress fill */}
                  <div 
                    className="absolute h-2 rounded-full top-4 transition-all duration-200"
                    style={{
                      width: `${((combinedLimit - 5) / (totalQuestions - 5)) * 100}%`,
                      backgroundColor: currentTheme.progressColor
                    }}
                  ></div>
                  {/* Range input */}
                  <input
                    type="range"
                    min="5"
                    max={totalQuestions}
                    value={combinedLimit}
                    onChange={(e) => setCombinedLimit(parseInt(e.target.value))}
                    className="relative w-full cursor-pointer range-slider-custom"
                    style={{
                      background: 'transparent'
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Min: 5</span>
                  <span>Max: {totalQuestions}</span>
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
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.85) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Custom Range Slider with visible track */
        .range-slider-custom {
          -webkit-appearance: none;
          appearance: none;
          height: 20px;
          background: transparent;
          outline: none;
        }
        
        .range-slider-custom::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: ${currentTheme.progressColor};
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        
        .range-slider-custom::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: ${currentTheme.progressColor};
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        
        .range-slider-custom::-webkit-slider-runnable-track {
          background: transparent;
          height: 20px;
        }
        
        .range-slider-custom::-moz-range-track {
          background: transparent;
          height: 20px;
        }
      `}</style>
    </div>
  );
};

export default WordMeaningPageSelection;
