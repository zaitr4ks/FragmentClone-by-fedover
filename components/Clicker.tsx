
import React, { useState } from 'react';
import { User } from '../types';
import { playSound } from '../services/soundService';

interface ClickerProps {
  onUpdateBalance: (newBalance: number) => void;
  user: User;
}

export const Clicker: React.FC<ClickerProps> = ({ onUpdateBalance, user }) => {
  const [clicks, setClicks] = useState<{id: number, x: number, y: number, val: number}[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playSound('coin');
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const id = Date.now();
    setClicks(prev => [...prev, { id, x, y, val: 1 }]);
    
    // Haptic feedback pattern if available
    if (navigator.vibrate) navigator.vibrate(50);

    onUpdateBalance(user.balance + 1);

    // Cleanup animation
    setTimeout(() => {
      setClicks(prev => prev.filter(c => c.id !== id));
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
          TON Clicker
        </h1>
        <p className="text-gray-400">Tap to mine simulated TON currency</p>
      </div>

      <div className="relative">
        <button 
          onClick={handleClick}
          className="relative group w-64 h-64 rounded-full bg-gradient-to-b from-[#0088cc] to-[#005f8f] shadow-[0_0_60px_-15px_rgba(0,136,204,0.6)] border-4 border-[#33aaff] flex items-center justify-center active:scale-95 transition-all duration-100 overflow-hidden"
        >
           {/* Shine effect */}
           <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           
           <img 
             src="https://cryptologos.cc/logos/toncoin-ton-logo.png?v=029" 
             alt="TON" 
             className="w-32 h-32 object-contain drop-shadow-lg pointer-events-none select-none" 
           />

           {/* Floating Numbers */}
           {clicks.map(click => (
             <span 
               key={click.id}
               className="absolute text-2xl font-bold text-white animate-float-up pointer-events-none"
               style={{ left: click.x, top: click.y }}
             >
               +1
             </span>
           ))}
        </button>
      </div>

      <div className="bg-[#1c1c1e] px-8 py-4 rounded-2xl border border-[#2c2c2e] flex flex-col items-center">
        <span className="text-gray-400 text-sm uppercase tracking-wider">Current Balance</span>
        <span className="text-3xl font-mono font-bold text-white flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
          {user.balance.toLocaleString()} TON
        </span>
      </div>
      
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
