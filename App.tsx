
import React, { useState } from 'react';
import Menu from './components/Menu';
import GameCanvas from './components/GameCanvas';
import RetroButton from './components/RetroButton';
import { GameSettings, GameState } from './types';
import { Volume2, VolumeX } from 'lucide-react';
import { audioManager } from './audio';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [won, setWon] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const handleStartGame = (newSettings: GameSettings) => {
    setSettings(newSettings);
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (score: number, isVictory: boolean) => {
    setFinalScore(score);
    setWon(isVictory);
    if (score > highScore) {
      setHighScore(score);
    }
    setGameState(isVictory ? GameState.VICTORY : GameState.GAME_OVER);
  };

  const handleBackToMenu = () => {
    setGameState(GameState.MENU);
  };

  const toggleMute = () => {
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-['Press_Start_2P'] relative overflow-hidden">
      
      {/* CRT Scanline Effect Overlay */}
      <div className="absolute inset-0 z-50 pointer-events-none" 
           style={{
             background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
             backgroundSize: '100% 2px, 3px 100%'
           }}
      />
      <div className="absolute inset-0 z-40 pointer-events-none bg-blue-900/5 radial-gradient" />

      {/* Audio Control */}
      <button 
        onClick={toggleMute}
        className="absolute top-4 right-4 z-50 text-white opacity-50 hover:opacity-100 transition-opacity p-2 border border-white/20 bg-black/50"
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>

      {gameState === GameState.MENU && (
        <Menu onStart={handleStartGame} lastScore={finalScore > 0 ? finalScore : undefined} highScore={highScore} />
      )}

      {gameState === GameState.PLAYING && settings && (
        <div className="relative z-10">
          <button 
            onClick={handleBackToMenu}
            className="absolute -top-12 left-0 text-white text-xs hover:text-red-400 mb-2"
          >
            ← ABORT MISSION
          </button>
          <GameCanvas 
            settings={settings} 
            onGameOver={handleGameOver} 
            onBack={handleBackToMenu}
          />
        </div>
      )}

      {(gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
        <div className="relative z-20 flex flex-col items-center justify-center gap-6 p-12 bg-slate-900 border-4 border-white text-center shadow-2xl animate-in fade-in zoom-in duration-300">
          <h2 className={`text-4xl ${gameState === GameState.VICTORY ? 'text-green-500' : 'text-red-500'} mb-4 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]`}>
            {gameState === GameState.VICTORY ? 'MISSION CLEAR!' : 'GAME OVER'}
          </h2>
          
          <div className="space-y-2 mb-6">
            <p className="text-white text-xl">SCORE: <span className="text-yellow-400">{finalScore}</span></p>
            {finalScore === highScore && finalScore > 0 && (
              <p className="text-sm text-blue-400 animate-pulse">NEW HIGH SCORE!</p>
            )}
          </div>

          <div className="flex flex-col gap-4 w-full">
            <RetroButton onClick={() => setGameState(GameState.MENU)}>
              RETURN TO BASE
            </RetroButton>
            {settings && (
              <RetroButton variant="secondary" onClick={() => handleStartGame(settings)}>
                RETRY
              </RetroButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
