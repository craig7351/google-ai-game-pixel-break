
import React, { useState } from 'react';
import { GameSettings, BallSpeed } from '../types';
import { SPEED_LABELS } from '../constants';
import RetroButton from './RetroButton';
import { Trophy, Play, Settings } from 'lucide-react';
import { audioManager } from '../audio';

interface MenuProps {
  onStart: (settings: GameSettings) => void;
  lastScore?: number;
  highScore: number;
}

const Menu: React.FC<MenuProps> = ({ onStart, lastScore, highScore }) => {
  const [ballCount, setBallCount] = useState<number>(1);
  const [speed, setSpeed] = useState<BallSpeed>(BallSpeed.NORMAL);

  const handleStart = () => {
    // Initialize Audio Context on user gesture
    audioManager.init();
    
    onStart({
      ballCount,
      initialSpeed: speed
    });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl gap-8 p-8 border-4 border-white bg-slate-900 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
          PIXEL BREAKER
        </h1>
        <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
          <Trophy size={16} />
          <span>HIGH SCORE: {highScore}</span>
        </div>
        {lastScore !== undefined && (
          <div className="text-gray-400 text-xs animate-pulse">
            LAST RUN: {lastScore}
          </div>
        )}
      </div>

      <div className="w-full space-y-6">
        {/* Settings Group */}
        <div className="bg-slate-800 p-6 border-2 border-slate-600 relative">
          <div className="absolute -top-3 left-4 bg-slate-900 px-2 text-blue-400 text-xs flex items-center gap-1">
            <Settings size={12} /> CONFIGURATION
          </div>

          {/* Ball Count Selector */}
          <div className="mb-6">
            <label className="block text-white mb-2 text-sm">MULTI-BALL SYSTEM</label>
            <div className="flex gap-4">
              {[1, 2, 3].map((count) => (
                <button
                  key={count}
                  onClick={() => setBallCount(count)}
                  className={`flex-1 py-3 border-2 transition-all ${
                    ballCount === count
                      ? 'bg-blue-600 border-white text-white shadow-[0_0_10px_rgba(37,99,235,0.6)]'
                      : 'bg-slate-700 border-slate-500 text-gray-400 hover:bg-slate-600'
                  }`}
                >
                  {count} {count > 1 ? 'BALLS' : 'BALL'}
                </button>
              ))}
            </div>
          </div>

          {/* Speed Selector */}
          <div>
            <label className="block text-white mb-2 text-sm">INITIAL VELOCITY</label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(SPEED_LABELS).map(([speedValue, label]) => (
                <button
                  key={speedValue}
                  onClick={() => setSpeed(Number(speedValue) as BallSpeed)}
                  className={`py-3 border-2 text-xs md:text-sm transition-all ${
                    speed === Number(speedValue)
                      ? 'bg-red-600 border-white text-white shadow-[0_0_10px_rgba(220,38,38,0.6)]'
                      : 'bg-slate-700 border-slate-500 text-gray-400 hover:bg-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          WARNING: VELOCITY INCREASES OVER TIME
        </div>

        <RetroButton onClick={handleStart} className="w-full py-4 text-xl animate-bounce">
          <span className="flex items-center justify-center gap-2">
            INSERT COIN <Play size={20} fill="currentColor" />
          </span>
        </RetroButton>
      </div>
    </div>
  );
};

export default Menu;
