import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, GraduationCap, ArrowLeft } from 'lucide-react';

const Layout = ({ children, showBackButton = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(localStorage.getItem('selectedClass') || '11th');
  const [availableClasses] = useState([
    { id: '1', name: '10th' },
    { id: '2', name: '11th' },
    { id: '3', name: '12th' }
  ]);

  // Theme colors for each class
  const classThemes = {
    '10th': {
      gradient: 'from-blue-500 to-indigo-600',
      light: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    '11th': {
      gradient: 'from-emerald-500 to-teal-600',
      light: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    '12th': {
      gradient: 'from-pink-500 to-rose-600',
      light: 'from-pink-50 to-rose-50',
      border: 'border-pink-200',
      hoverBorder: 'hover:border-pink-400',
      bg: 'bg-pink-50',
      text: 'text-pink-600',
    }
  };

  const currentTheme = classThemes[selectedClass] || classThemes['11th'];

  const handleClassChange = (classValue) => {
    setSelectedClass(classValue);
    localStorage.setItem('selectedClass', classValue);
    setIsClassDropdownOpen(false);
    
    // Update manifest and theme
    const themeColors = {
      '10th': '#3b82f6',
      '11th': '#10b981',
      '12th': '#ec4899'
    };
    
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', themeColors[classValue]);
    
    // Reload current page to apply new theme
    window.location.reload();
  };

  // Hide navbar on admin pages
  const isAdminPage = location.pathname.startsWith('/admin');
  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.light}`}>
      {/* Persistent Header - No reload */}
      <div className={`bg-white/80 backdrop-blur-sm border-b ${currentTheme.border} sticky top-0 z-50`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div className={`w-10 h-10 bg-gradient-to-br ${currentTheme.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">QuizMaster</h1>
                <p className="text-xs text-gray-500">Test Your Knowledge</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Class Selector */}
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
                          onClick={() => handleClassChange(cls.name)}
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

      {/* Page Content with smooth transition */}
      <div className="animate-fadeIn">
        {children}
      </div>
    </div>
  );
};

export default Layout;
