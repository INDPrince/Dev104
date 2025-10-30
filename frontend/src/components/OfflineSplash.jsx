import React, { useEffect, useState } from 'react';
import { Heart, Wifi, WifiOff, Sparkles, Zap } from 'lucide-react';

const OfflineSplash = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSplash, setShowSplash] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Show splash on first load if offline
    if (!navigator.onLine) {
      setShowSplash(true);
      setTimeout(() => setShowSplash(false), 3500);
    }

    // Generate random particles for background animation
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2,
          duration: Math.random() * 3 + 2,
          delay: Math.random() * 2
        });
      }
      setParticles(newParticles);
    };

    generateParticles();

    const handleOnline = () => {
      setIsOnline(true);
      setShowSplash(true);
      setTimeout(() => setShowSplash(false), 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowSplash(true);
      setTimeout(() => setShowSplash(false), 3500);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showSplash) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden">
      {/* Animated Particles Background */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white opacity-20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      {/* Animated Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative text-center space-y-8 p-8 animate-scale-fade-in">
        {/* App Icon with Glow Effect */}
        <div className="relative mx-auto w-40 h-40">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-3xl blur-2xl opacity-60 animate-pulse-glow"></div>
          <div className="relative bg-white rounded-3xl shadow-2xl p-4 animate-bounce-rotate">
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-gradient">
                Q
              </span>
            </div>
          </div>
          
          {/* Status Badge */}
          {!isOnline ? (
            <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full p-3 shadow-lg animate-bounce-pulse">
              <WifiOff className="w-7 h-7" />
            </div>
          ) : (
            <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full p-3 shadow-lg animate-bounce-pulse">
              <Wifi className="w-7 h-7" />
            </div>
          )}

          {/* Sparkles */}
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-spin-slow" />
          <Zap className="absolute -top-2 -left-2 w-6 h-6 text-blue-300 animate-pulse" />
        </div>

        {/* App Name with Glitch Effect */}
        <div className="space-y-3">
          <h1 className="text-6xl font-black text-white animate-title-appear">
            <span className="inline-block animate-letter-bounce" style={{ animationDelay: '0s' }}>Q</span>
            <span className="inline-block animate-letter-bounce" style={{ animationDelay: '0.1s' }}>u</span>
            <span className="inline-block animate-letter-bounce" style={{ animationDelay: '0.2s' }}>i</span>
            <span className="inline-block animate-letter-bounce" style={{ animationDelay: '0.3s' }}>z</span>
            <span className="inline-block animate-letter-bounce mx-2" style={{ animationDelay: '0.4s' }}>M</span>
            <span className="inline-block animate-letter-bounce" style={{ animationDelay: '0.5s' }}>a</span>
            <span className="inline-block animate-letter-bounce" style={{ animationDelay: '0.6s' }}>s</span>
            <span className="inline-block animate-letter-bounce" style={{ animationDelay: '0.7s' }}>t</span>
            <span className="inline-block animate-letter-bounce" style={{ animationDelay: '0.8s' }}>e</span>
            <span className="inline-block animate-letter-bounce" style={{ animationDelay: '0.9s' }}>r</span>
          </h1>
          
          {/* Status with Animation */}
          {!isOnline ? (
            <div className="flex items-center justify-center gap-3 text-orange-400 animate-slide-up">
              <WifiOff className="w-6 h-6 animate-pulse" />
              <span className="font-bold text-xl tracking-wide">Offline Mode</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 text-green-400 animate-slide-up">
              <Wifi className="w-6 h-6 animate-pulse" />
              <span className="font-bold text-xl tracking-wide">Connected</span>
            </div>
          )}
        </div>

        {/* Made with Love - Enhanced */}
        <div className="flex items-center justify-center gap-3 text-white animate-slide-up-delay">
          <span className="text-2xl font-light">Made with</span>
          <Heart className="w-8 h-8 text-red-500 fill-red-500 animate-heartbeat-intense" />
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 animate-gradient">
            by Prince
          </span>
        </div>

        {/* Loading Bar with Gradient */}
        <div className="w-80 mx-auto space-y-2 animate-slide-up-delay-2">
          <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
            <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-loading-bar-smooth"></div>
          </div>
          <div className="flex justify-between text-xs text-white/60">
            <span>Loading...</span>
            <span className="animate-pulse">Please wait</span>
          </div>
        </div>

        {/* Status Message */}
        {!isOnline && (
          <p className="text-base text-white/80 max-w-sm mx-auto animate-fade-in-delayed">
            ✨ You can still access all your downloaded content offline!
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes scale-fade-in {
          from { 
            opacity: 0; 
            transform: scale(0.8);
          }
          to { 
            opacity: 1; 
            transform: scale(1);
          }
        }

        @keyframes bounce-rotate {
          0%, 100% { 
            transform: translateY(0) rotate(0deg); 
          }
          50% { 
            transform: translateY(-20px) rotate(5deg); 
          }
        }

        @keyframes pulse-glow {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.6;
          }
          50% { 
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes bounce-pulse {
          0%, 100% { 
            transform: scale(1) translateY(0); 
          }
          25% { 
            transform: scale(1.1) translateY(-5px); 
          }
          50% { 
            transform: scale(0.9) translateY(0); 
          }
          75% { 
            transform: scale(1.05) translateY(-3px); 
          }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes title-appear {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes letter-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heartbeat-intense {
          0%, 100% { transform: scale(1); }
          10% { transform: scale(1.3); }
          20% { transform: scale(1.1); }
          30% { transform: scale(1.4); }
          40% { transform: scale(1); }
        }

        @keyframes loading-bar-smooth {
          0% { 
            width: 0%; 
            transform: translateX(-100%);
          }
          50% {
            width: 100%;
            transform: translateX(0);
          }
          100% { 
            width: 100%;
            transform: translateX(0);
          }
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0) translateX(0); 
          }
          50% { 
            transform: translateY(-20px) translateX(10px); 
          }
        }

        @keyframes blob {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
          }
          33% { 
            transform: translate(30px, -50px) scale(1.1); 
          }
          66% { 
            transform: translate(-20px, 20px) scale(0.9); 
          }
        }

        .animate-scale-fade-in {
          animation: scale-fade-in 0.6s ease-out;
        }

        .animate-bounce-rotate {
          animation: bounce-rotate 3s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-bounce-pulse {
          animation: bounce-pulse 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }

        .animate-title-appear {
          animation: title-appear 0.8s ease-out;
        }

        .animate-letter-bounce {
          animation: letter-bounce 1s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.3s both;
        }

        .animate-slide-up-delay {
          animation: slide-up 0.8s ease-out 0.5s both;
        }

        .animate-slide-up-delay-2 {
          animation: slide-up 0.8s ease-out 0.7s both;
        }

        .animate-heartbeat-intense {
          animation: heartbeat-intense 1.5s ease-in-out infinite;
        }

        .animate-loading-bar-smooth {
          animation: loading-bar-smooth 3s ease-in-out forwards;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-blob {
          animation: blob 7s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fade-in-delayed {
          animation: scale-fade-in 0.8s ease-out 1s both;
        }
      `}</style>
    </div>
  );
};

export default OfflineSplash;
