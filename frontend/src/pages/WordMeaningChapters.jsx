import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';
import { getWordMeaningSubjects, getWordMeaningChapters } from '../firebase/services';

const WordMeaningChapters = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

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
      iconBg: 'from-blue-100 to-indigo-100',
      iconText: 'text-blue-700',
      shadow: 'hover:shadow-blue-100/50',
    },
    '11th': {
      gradient: 'from-emerald-500 to-teal-600',
      light: 'from-emerald-50 to-teal-50',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
      iconBg: 'from-emerald-100 to-teal-100',
      iconText: 'text-emerald-700',
      shadow: 'hover:shadow-emerald-100/50',
    },
    '12th': {
      gradient: 'from-pink-500 to-rose-600',
      light: 'from-pink-50 to-rose-50',
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      border: 'border-pink-200',
      hoverBorder: 'hover:border-pink-400',
      iconBg: 'from-pink-100 to-rose-100',
      iconText: 'text-pink-700',
      shadow: 'hover:shadow-pink-100/50',
    }
  };
  const currentTheme = classThemes[selectedClass] || classThemes['11th'];

  useEffect(() => {
    loadData();
  }, [subjectId]);

  const loadData = async () => {
    const subjects = await getWordMeaningSubjects();
    const foundSubject = subjects.find(s => s.id === subjectId);
    if (foundSubject) {
      setSubject(foundSubject);
      const chaptersData = await getWordMeaningChapters(subjectId);
      setChapters(chaptersData);
    }
    setLoading(false);
  };

  const handleChapterSelect = (chapterId) => {
    navigate(`/word-meaning/pages/${chapterId}`, {
      state: { subject, chapterId }
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${currentTheme.light} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 ${currentTheme.border} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
          <p className="text-gray-600">Loading chapters...</p>
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
              className={`p-2 hover:${currentTheme.bg} rounded-lg transition-colors`}
            >
              <ArrowLeft className={`w-5 h-5 ${currentTheme.text}`} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{subject?.name || 'Word Meaning'}</h1>
              <p className="text-sm text-gray-500">Select a Chapter</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Chapters</h2>
          <p className="text-gray-600">Choose a chapter to view pages</p>
        </div>

        {chapters.length === 0 ? (
          <div className="text-center py-8 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No chapters available yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className="group cursor-pointer"
                onClick={() => handleChapterSelect(chapter.id)}
                onMouseEnter={() => setHoveredCard(chapter.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  animation: `slideUp 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                <div className={`bg-white rounded-2xl p-6 border-2 ${currentTheme.border} ${currentTheme.hoverBorder} transition-all duration-300 hover:shadow-xl ${currentTheme.shadow} hover:-translate-y-1`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        hoveredCard === chapter.id 
                          ? `bg-gradient-to-br ${currentTheme.gradient} shadow-lg scale-110` 
                          : `bg-gradient-to-br ${currentTheme.iconBg}`
                      }`}>
                        <BookOpen className={`w-7 h-7 transition-colors ${
                          hoveredCard === chapter.id ? 'text-white' : currentTheme.iconText
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{chapter.name}</h3>
                        <p className="text-sm text-gray-500">{chapter.totalPages || 0} Pages</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-6 h-6 text-gray-400 transition-all duration-300 ${
                      hoveredCard === chapter.id ? `translate-x-2 ${currentTheme.text}` : ''
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
      `}</style>
    </div>
  );
};

export default WordMeaningChapters;
