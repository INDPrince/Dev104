/**
 * Install Popup - Class Data Download with 6 Parallel Downloads
 * Real progress bar with accurate size calculation
 */

import React, { useState, useEffect } from 'react';
import { Download, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { isClassInstalled, saveClassData, getInstalledClasses } from '../utils/indexedDB';
import { getThemeConfig, switchTheme } from '../utils/themeManager';

const InstallPopup = () => {
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const [selectedClass, setSelectedClass] = useState('11th');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [installedClasses, setInstalledClasses] = useState([]);
  const [error, setError] = useState(null);
  const [downloadedChunks, setDownloadedChunks] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  useEffect(() => {
    // Don't show popup on admin routes
    if (location.pathname.startsWith('/admin')) {
      console.log('[InstallPopup] Skipping on admin route:', location.pathname);
      return;
    }
    
    checkInstallStatus();
  }, [location.pathname]);

  const checkInstallStatus = async () => {
    try {
      console.log('[InstallPopup] Checking install status...');
      const installed = await getInstalledClasses();
      console.log('[InstallPopup] Installed classes:', installed);
      setInstalledClasses(installed);
      
      // Show popup if no class is installed and not on admin route
      if (installed.length === 0 && !location.pathname.startsWith('/admin')) {
        console.log('[InstallPopup] No classes installed, showing popup in 2s...');
        setTimeout(() => setShowPopup(true), 2000); // Show after 2s
      }
    } catch (error) {
      console.error('[InstallPopup] Error checking install status:', error);
    }
  };

  const handleInstall = async () => {
    console.log(`\n[InstallPopup] ========================================`);
    console.log(`[InstallPopup] Starting installation for ${selectedClass}`);
    console.log(`[InstallPopup] ========================================`);
    
    if (!navigator.onLine) {
      const errorMsg = `Cannot install ${selectedClass} - You are offline. Please connect to network.`;
      console.error(`[InstallPopup] ${errorMsg}`);
      setError(errorMsg);
      return;
    }

    setIsInstalling(true);
    setError(null);
    setInstallProgress(0);
    setDownloadedChunks(0);
    setTotalChunks(0);

    try {
      // STEP 1: Check if metadata file exists first
      setCurrentStep('🔍 Checking for data files...');
      console.log(`[InstallPopup] Checking metadata at /pwa-data/${selectedClass}/metadata.js`);
      
      const checkResponse = await fetch(`/pwa-data/${selectedClass}/metadata.js?t=${Date.now()}`);
      console.log(`[InstallPopup] Metadata check status: ${checkResponse.status}`);
      
      if (!checkResponse.ok) {
        throw new Error(`Data files not found for ${selectedClass}. Please sync data from Admin Panel → PWA → Sync Class ${selectedClass} first.`);
      }
      
      const contentType = checkResponse.headers.get('content-type');
      console.log(`[InstallPopup] Content-Type: ${contentType}`);
      
      if (contentType && !contentType.includes('javascript')) {
        throw new Error(`Invalid data file format. Expected JavaScript, got ${contentType}. Please sync data from admin panel.`);
      }
      
      // STEP 2: Load metadata
      setCurrentStep('📊 Loading metadata...');
      const metadataScript = document.createElement('script');
      metadataScript.src = `/pwa-data/${selectedClass}/metadata.js?t=${Date.now()}`;
      
      await new Promise((resolve, reject) => {
        metadataScript.onload = () => {
          console.log('[InstallPopup] Metadata script loaded successfully');
          resolve();
        };
        metadataScript.onerror = (e) => {
          console.error('[InstallPopup] Metadata script load error:', e);
          reject(new Error('Failed to load metadata script. Please sync data from admin panel first.'));
        };
        document.head.appendChild(metadataScript);
      });
      
      const classNum = selectedClass.replace('th', '');
      const metadata = window[`PWA_METADATA_${classNum}`];
      
      console.log(`[InstallPopup] Looking for window.PWA_METADATA_${classNum}`);
      
      if (!metadata) {
        console.error('[InstallPopup] Metadata not found in window object');
        console.log('[InstallPopup] Available window properties:', Object.keys(window).filter(k => k.startsWith('PWA_')));
        throw new Error(`Metadata not loaded properly. Please go to Admin Panel → Database → PWA tab and click "Sync Class ${selectedClass}" to generate data files.`);
      }
      
      console.log('[InstallPopup] ✅ Metadata loaded successfully:', metadata);
      console.log('[InstallPopup] Stats:', metadata.stats);
      setInstallProgress(10);

      // STEP 3: Get chunk list
      setCurrentStep('📦 Preparing download...');
      const chunkNames = metadata.chunksList || [];
      
      if (chunkNames.length === 0) {
        console.error('[InstallPopup] No chunks found in metadata');
        throw new Error('No data chunks found in metadata. Please re-sync from admin panel.');
      }
      
      setTotalChunks(chunkNames.length);
      console.log(`[InstallPopup] 📦 Found ${chunkNames.length} chunks to download:`, chunkNames);
      setInstallProgress(15);

      // STEP 4: Calculate progress
      const baseProgress = 15;
      const downloadProgress = 70; // 15% to 85%
      
      // STEP 5: Download chunks in parallel (max 6 at a time)
      console.log(`[InstallPopup] Starting parallel download (6 chunks at a time)...`);
      setCurrentStep(`⬇️ Downloading data (0/${chunkNames.length})...`);
      const chunks = {};
      const batchSize = 6; // 6 parallel downloads
      let completed = 0;
      const errors = [];
      
      for (let i = 0; i < chunkNames.length; i += batchSize) {
        const batch = chunkNames.slice(i, i + batchSize);
        console.log(`[InstallPopup] 📦 Batch ${Math.floor(i/batchSize) + 1}: Downloading ${batch.join(', ')}`);
        
        await Promise.all(batch.map(async (chunkName) => {
          try {
            console.log(`[InstallPopup] ⬇️ Starting download: ${chunkName}`);
            
            // Check if file exists first
            const checkResp = await fetch(`/pwa-data/${selectedClass}/${chunkName}.js?t=${Date.now()}`, { method: 'HEAD' });
            if (!checkResp.ok) {
              throw new Error(`Chunk file not found: ${chunkName}.js`);
            }
            
            const script = document.createElement('script');
            script.src = `/pwa-data/${selectedClass}/${chunkName}.js?t=${Date.now()}`;
            
            await new Promise((resolve, reject) => {
              script.onload = () => {
                completed++;
                setDownloadedChunks(completed);
                const progress = baseProgress + (completed / chunkNames.length) * downloadProgress;
                setInstallProgress(Math.min(progress, 85));
                setCurrentStep(`⬇️ Downloaded ${completed}/${chunkNames.length} chunks...`);
                console.log(`[InstallPopup] ✅ Downloaded ${chunkName} (${completed}/${chunkNames.length})`);
                resolve();
              };
              script.onerror = (e) => {
                console.error(`[InstallPopup] ❌ Script load error for ${chunkName}:`, e);
                reject(new Error(`Failed to load ${chunkName}.js`));
              };
              document.head.appendChild(script);
            });
            
            // Get data from window
            const dataKey = `PWA_CHUNK_${chunkName.toUpperCase().replace(/-/g, '_')}`;
            chunks[chunkName] = window[dataKey];
            
            if (!chunks[chunkName]) {
              const msg = `Data not found for ${chunkName}, key: ${dataKey}`;
              console.warn(`[InstallPopup] ⚠️ ${msg}`);
              errors.push(msg);
            } else {
              console.log(`[InstallPopup] ✅ ${chunkName} data loaded, type: ${chunks[chunkName].type}`);
            }
          } catch (error) {
            console.error(`[InstallPopup] ❌ Error downloading ${chunkName}:`, error);
            errors.push(`${chunkName}: ${error.message}`);
            throw error;
          }
        }));
      }
      
      setInstallProgress(85);
      console.log(`[InstallPopup] ✅ All ${completed} chunks downloaded`);
      
      if (errors.length > 0) {
        console.warn(`[InstallPopup] ⚠️ Warnings during download:`, errors);
      }

      // STEP 6: Validate data
      setCurrentStep('✔️ Validating data...');
      console.log('[InstallPopup] Validating downloaded chunks...');
      const missingChunks = chunkNames.filter(name => !chunks[name]);
      if (missingChunks.length > 0) {
        console.warn('[InstallPopup] ⚠️ Missing chunks:', missingChunks);
        throw new Error(`Some chunks failed to load: ${missingChunks.join(', ')}. Please try again.`);
      }
      console.log('[InstallPopup] ✅ All chunks validated');
      setInstallProgress(90);

      // STEP 7: Save to IndexedDB
      setCurrentStep('💾 Saving to local storage...');
      console.log(`[InstallPopup] Saving ${selectedClass} data to IndexedDB...`);
      await saveClassData(selectedClass, metadata, chunks);
      console.log(`[InstallPopup] 💾 Successfully saved ${selectedClass} to IndexedDB`);
      setInstallProgress(95);

      // STEP 8: Update installed classes list
      const updatedInstalled = await getInstalledClasses();
      console.log('[InstallPopup] Updated installed classes:', updatedInstalled);
      setInstalledClasses(updatedInstalled);
      
      // STEP 9: Apply theme
      console.log(`[InstallPopup] Applying theme for ${selectedClass}`);
      switchTheme(selectedClass);
      
      setInstallProgress(100);
      setCurrentStep(`✅ Installation complete! ${selectedClass} is ready to use offline.`);
      
      console.log('[InstallPopup] ========================================');
      console.log(`[InstallPopup] ✅ ${selectedClass} INSTALLATION SUCCESSFUL!`);
      console.log('[InstallPopup] ========================================\n');
      
      // Show success for 2s then close
      setTimeout(() => {
        setShowPopup(false);
        setIsInstalling(false);
      }, 2000);

    } catch (error) {
      console.error('[InstallPopup] ========================================');
      console.error('[InstallPopup] ❌ INSTALLATION FAILED');
      console.error('[InstallPopup] Error:', error.message);
      console.error('[InstallPopup] Stack:', error.stack);
      console.error('[InstallPopup] ========================================\n');
      
      setError(error.message);
      setIsInstalling(false);
      setCurrentStep('');
      setInstallProgress(0);
      setDownloadedChunks(0);
      setTotalChunks(0);
    }
  };

  // Don't render on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-green-600 to-pink-600 p-6 rounded-t-2xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="w-8 h-8 animate-bounce" />
              <div>
                <h2 className="text-xl font-bold">Install QuizMaster</h2>
                <p className="text-sm text-white/90">Choose your class to get started offline</p>
              </div>
            </div>
            {!isInstalling && (
              <button 
                onClick={() => setShowPopup(false)} 
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {!isInstalling ? (
            <>
              {/* Class Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['10th', '11th', '12th'].map((cls) => {
                    const isInstalled = installedClasses.includes(cls);
                    const theme = getThemeConfig(cls);
                    const colors = {
                      '10th': 'border-blue-500 bg-blue-50 text-blue-700',
                      '11th': 'border-green-500 bg-green-50 text-green-700',
                      '12th': 'border-pink-500 bg-pink-50 text-pink-700'
                    };
                    
                    return (
                      <button
                        key={cls}
                        onClick={() => setSelectedClass(cls)}
                        disabled={isInstalled}
                        className={`
                          p-4 rounded-lg border-2 transition-all relative
                          ${selectedClass === cls ? colors[cls] + ' scale-105' : 'border-gray-200 bg-gray-50'}
                          ${isInstalled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg'}
                        `}
                      >
                        <div className="text-2xl font-bold">{cls.replace('th', '')}</div>
                        <div className="text-xs mt-1">Class {cls}</div>
                        {isInstalled && (
                          <CheckCircle className="w-4 h-4 absolute top-2 right-2 text-green-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>📱 Note:</strong> You can install multiple classes. Data will be available offline with 6x faster parallel downloads!
                </p>
              </div>

              {/* Install Button */}
              <Button
                onClick={handleInstall}
                disabled={installedClasses.includes(selectedClass)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {installedClasses.includes(selectedClass) 
                  ? `✅ ${selectedClass} Already Installed`
                  : `⬇️ Install ${selectedClass} Data`
                }
              </Button>
            </>
          ) : (
            <>
              {/* Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{currentStep}</span>
                  <span className="font-bold text-gray-900">{Math.round(installProgress)}%</span>
                </div>
                <Progress value={installProgress} className="h-3" />
                {totalChunks > 0 && (
                  <div className="text-xs text-gray-500 text-center">
                    Downloaded: {downloadedChunks}/{totalChunks} chunks (6 parallel)
                  </div>
                )}
              </div>

              {/* Installing Animation */}
              <div className="text-center py-6">
                <div className="inline-block">
                  <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                </div>
                <p className="mt-4 text-gray-600 font-medium">
                  Please wait while we download {selectedClass} data...
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Using 6 parallel downloads for maximum speed ⚡
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default InstallPopup;
