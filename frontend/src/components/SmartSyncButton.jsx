import React, { useState } from 'react';
import { Download, CheckCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { syncClassData, validateSyncedData } from '../utils/smartDataSync';
import { getInstalledClasses } from '../utils/indexedDB';

const SmartSyncButton = ({ classId, onSyncComplete }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if class is already installed
  React.useEffect(() => {
    checkInstallStatus();
  }, [classId]);

  const checkInstallStatus = async () => {
    const installed = await getInstalledClasses();
    setIsInstalled(installed.includes(classId));
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setProgress(null);
    setResult(null);
    
    console.log(`🚀 Starting smart sync for ${classId}...`);

    const syncResult = await syncClassData(classId, (update) => {
      setProgress(update);
      console.log(`📊 [Progress] ${update.step}: ${update.progress}% - ${update.message}`);
    });

    setIsSyncing(false);
    setResult(syncResult);

    // Validate synced data
    if (syncResult.success) {
      const validation = await validateSyncedData(classId);
      console.log('✅ Validation result:', validation);
      
      if (validation.valid) {
        setIsInstalled(true);
        onSyncComplete?.({ success: true, classId, metadata: validation.metadata });
      } else {
        setResult({
          ...syncResult,
          success: false,
          error: `Validation failed: ${validation.message}`
        });
      }
    }
  };

  const getProgressColor = () => {
    if (!progress) return 'bg-blue-500';
    if (progress.step === 'error') return 'bg-red-500';
    if (progress.step === 'complete') return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusIcon = () => {
    if (isSyncing) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (result?.success) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (result?.error) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (isInstalled) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Download className="w-4 h-4" />;
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        className={`w-full ${
          result?.success 
            ? 'bg-green-600 hover:bg-green-700' 
            : result?.error 
            ? 'bg-red-600 hover:bg-red-700'
            : isInstalled
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {getStatusIcon()}
        <span className="ml-2">
          {isSyncing 
            ? `Syncing ${classId}...` 
            : isInstalled 
            ? `Re-sync ${classId}`
            : `Sync ${classId} Data`}
        </span>
      </Button>

      {progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span className="font-medium">{progress.message}</span>
            <span>{progress.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${getProgressColor()} transition-all duration-300 ease-out`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">
            Step: <span className="font-medium">{progress.step}</span>
          </div>
        </div>
      )}

      {result && !isSyncing && (
        <div className={`p-3 rounded-lg text-sm ${
          result.success 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {result.success ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4" />
                Sync Completed Successfully!
              </div>
              <div className="text-xs space-y-0.5 ml-6">
                <div>✅ {result.metadata?.stats?.subjects || 0} subjects</div>
                <div>✅ {result.metadata?.stats?.chapters || 0} chapters</div>
                <div>✅ {result.metadata?.stats?.questions || 0} questions</div>
                <div className="text-gray-600 mt-1">⏱️ Duration: {result.duration}s</div>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="text-xs text-yellow-700 mt-2">
                  ⚠️ Completed with {result.errors.length} warnings
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4" />
                Sync Failed
              </div>
              <div className="text-xs ml-6">
                {result.error || 'Unknown error occurred'}
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="text-xs ml-6 mt-2 space-y-1">
                  <div className="font-medium">Errors:</div>
                  {result.errors.slice(0, 3).map((err, idx) => (
                    <div key={idx}>• {err.type}: {err.error}</div>
                  ))}
                  {result.errors.length > 3 && (
                    <div>... and {result.errors.length - 3} more</div>
                  )}
                </div>
              )}
              <Button
                onClick={handleSync}
                size="sm"
                className="mt-2 bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSyncButton;
