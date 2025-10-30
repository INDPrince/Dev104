import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Copy, Trash2, Power, Database, Heart, RefreshCw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

const AdminDevTools = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState(() => {
    const savedLogs = localStorage.getItem('admin_console_logs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  });
  const [pwaEnabled, setPwaEnabled] = useState(true);
  const [errorCount, setErrorCount] = useState(() => {
    const savedLogs = localStorage.getItem('admin_console_logs');
    if (savedLogs) {
      const parsedLogs = JSON.parse(savedLogs);
      return parsedLogs.filter(log => log.type === 'error').length;
    }
    return 0;
  });
  const logsEndRef = useRef(null);
  const lastLogRef = useRef(''); // Track last log to prevent duplicates

  // Add log function - moved outside useEffect for accessibility
  const addLog = (type, message, source = '') => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message);
    
    // Prevent duplicate logs - check if this exact message was just logged
    const logKey = `${type}:${formattedMessage}:${source}`;
    if (lastLogRef.current === logKey) {
      return; // Skip duplicate
    }
    lastLogRef.current = logKey;
    
    // Clear the duplicate check after 3 seconds
    setTimeout(() => {
      if (lastLogRef.current === logKey) {
        lastLogRef.current = '';
      }
    }, 3000);
    
    const newLog = { 
      timestamp, 
      type, 
      message: formattedMessage, 
      source 
    };
    
    setLogs(prevLogs => {
      const updatedLogs = [...prevLogs, newLog];
      // Keep only last 100 logs
      const trimmedLogs = updatedLogs.slice(-100);
      localStorage.setItem('admin_console_logs', JSON.stringify(trimmedLogs));
      return trimmedLogs;
    });
    
    if (type === 'error') {
      setErrorCount(prev => prev + 1);
    }
  };

  // Check if admin is logged in and load persisted logs
  useEffect(() => {
    const checkAdminStatus = () => {
      const isAdmin = localStorage.getItem('adminAuth') === 'true';
      setIsVisible(isAdmin);
      
      // Load persisted logs ONLY if admin is logged in
      if (isAdmin) {
        const savedLogs = localStorage.getItem('admin_console_logs');
        if (savedLogs) {
          const parsedLogs = JSON.parse(savedLogs);
          setLogs(parsedLogs);
          setErrorCount(parsedLogs.filter(log => log.type === 'error').length);
        }
      }
    };
    
    checkAdminStatus();
    
    // Listen for storage changes (logout from another tab)
    window.addEventListener('storage', checkAdminStatus);
    
    return () => {
      window.removeEventListener('storage', checkAdminStatus);
    };
  }, []); // Run only once on mount

  // Enhanced error capture - ALL types of errors
  useEffect(() => {
    if (!isVisible) return;

    // 1. Console methods override
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog.apply(console, args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog('log', message, 'console');
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog('error', message, 'console');
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog('warn', message, 'console');
    };

    // 2. Window error handler - catches runtime errors
    const handleWindowError = (event) => {
      const errorMessage = `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
      addLog('error', errorMessage, 'window');
      return false; // Don't prevent default error handling
    };

    // 3. Unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      const reason = event.reason;
      let errorMessage = 'Unhandled Promise Rejection: ';
      
      if (reason instanceof Error) {
        errorMessage += `${reason.message}\nStack: ${reason.stack}`;
      } else if (typeof reason === 'object') {
        errorMessage += JSON.stringify(reason, null, 2);
      } else {
        errorMessage += String(reason);
      }
      
      addLog('error', errorMessage, 'promise');
    };

    // 4. Network error interceptor (fetch)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      try {
        const response = await originalFetch(...args);
        
        // Log failed HTTP requests
        if (!response.ok) {
          addLog('error', `HTTP ${response.status}: ${response.statusText} - ${url}`, 'network');
        }
        
        return response;
      } catch (error) {
        addLog('error', `Network Error: ${error.message} - ${url}`, 'network');
        throw error;
      }
    };

    // Attach error listeners
    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      window.fetch = originalFetch;
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isVisible]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const clearLogs = () => {
    if (logs.length > 0 && !window.confirm(`Clear all ${logs.length} logs? This cannot be undone.`)) {
      return;
    }
    setLogs([]);
    setErrorCount(0);
    localStorage.removeItem('admin_console_logs');
    // Silent clear - no console.log to prevent capturing
  };

  const copyLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] [${log.source || 'unknown'}] ${log.type.toUpperCase()}: ${log.message}`
    ).join('\n');
    navigator.clipboard.writeText(logText);
    // Silent copy - no console.log
    addLog('Logs copied to clipboard!', 'log', 'devtools');
  };

  const handleTogglePWA = async () => {
    if (!pwaEnabled) {
      setPwaEnabled(true);
      alert('PWA Enabled! Refreshing...');
      window.location.reload();
    } else {
      if (!window.confirm('Disable PWA? Service worker will be unregistered.')) return;
      
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        
        setPwaEnabled(false);
        alert('✅ PWA Disabled!');
      } catch (error) {
        console.error('Error disabling PWA:', error);
        alert('❌ Failed to disable PWA');
      }
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Clear all PWA caches and service workers?')) return;
    
    try {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      // Clear IndexedDB (if any)
      if (window.indexedDB) {
        const databases = await window.indexedDB.databases();
        await Promise.all(databases.map(db => {
          return new Promise((resolve) => {
            const request = window.indexedDB.deleteDatabase(db.name);
            request.onsuccess = resolve;
            request.onerror = resolve;
          });
        }));
      }
      
      // Clear service worker cache via postMessage
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }
      
      addLog('Cache and storage cleared successfully!', 'success');
      alert('✅ Cache, IndexedDB & Service Worker cache cleared! Refresh recommended.');
    } catch (error) {
      console.error('Error clearing cache:', error);
      addLog(`Failed to clear cache: ${error.message}`, 'error');
      alert('❌ Failed to clear cache');
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Dev Tools Button - Fixed bottom-right corner NO WHITE SPACE */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-0 right-0 z-[9999] bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-tl-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
          style={{ padding: '6px', margin: 0, lineHeight: 0 }}
          title="Open Dev Tools"
        >
          <Terminal className="w-5 h-5" style={{ display: 'block' }} />
          {errorCount > 0 && (
            <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1">
              {errorCount > 30 ? '30' : errorCount}
            </span>
          )}
        </button>
      )}

      {/* Dev Tools Panel */}
      {isExpanded && (
        <div className="fixed bottom-0 left-0 right-0 md:right-4 md:left-auto w-full md:w-2/3 lg:w-1/2 h-96 bg-gray-900 text-white shadow-2xl z-[9999] flex flex-col border-t-4 border-purple-500 md:rounded-t-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-purple-400" />
              <span className="font-bold text-sm hidden sm:block">Dev</span>
              <span className="font-bold text-sm sm:hidden">Dev</span>
              {errorCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {errorCount > 30 ? 30 : errorCount}
                </span>
              )}
              <span className="text-xs text-gray-500 ml-2 hidden md:flex items-center gap-1">
                Made with <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> by Prince
              </span>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Admin Panel Button */}
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                title="Go to Admin Panel"
              >
                <Settings className="w-3 h-3" />
                <span className="hidden sm:inline">Admin</span>
              </button>
              
              {/* Refresh */}
              <button
                onClick={refreshPage}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                title="Refresh Page"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              
              {/* PWA Toggle */}
              <button
                onClick={handleTogglePWA}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                  pwaEnabled 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title="Toggle PWA"
              >
                <Power className="w-3 h-3" />
                <span className="hidden sm:inline">PWA {pwaEnabled ? 'ON' : 'OFF'}</span>
              </button>
              
              {/* Clear Cache */}
              <button
                onClick={handleClearCache}
                className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                title="Clear All Cache"
              >
                <Database className="w-3 h-3" />
                <span className="hidden sm:inline">Clear</span>
              </button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={copyLogs}
                className="text-xs text-gray-300 hover:text-white p-1"
                title="Copy Logs"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearLogs}
                className="text-xs text-gray-300 hover:text-white p-1"
                title="Clear Console"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Logs Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No logs yet...</p>
                <p className="text-xs mt-2">Capturing: console, network, errors, promises</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    log.type === 'error'
                      ? 'bg-red-900/20 text-red-300 border-l-4 border-red-500'
                      : log.type === 'warn'
                      ? 'bg-yellow-900/20 text-yellow-300 border-l-4 border-yellow-500'
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-gray-500">[{log.timestamp}]</span>
                    {log.source && (
                      <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">
                        {log.source}
                      </span>
                    )}
                    <span className={`font-bold ${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warn' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`}>
                      {log.type.toUpperCase()}:
                    </span>
                  </div>
                  <div className="ml-2 mt-1 whitespace-pre-wrap break-all">
                    {log.message}
                  </div>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDevTools;
