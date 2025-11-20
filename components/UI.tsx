import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string }> = ({ children, className = '', ...props }) => (
  <div className={`bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl overflow-hidden shadow-lg ${className}`} {...props}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = ({ 
  children, variant = 'primary', className = '', ...props 
}) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#0088cc] hover:bg-[#0077b5] text-white shadow-[0_4px_14px_rgba(0,136,204,0.3)]",
    secondary: "bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    {...props}
    className={`w-full bg-[#1c1c1e] border border-[#2c2c2e] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-[#0088cc] focus:ring-1 focus:ring-[#0088cc] transition-colors ${props.className || ''}`}
  />
);

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'bg-blue-500/20 text-blue-400' }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${color}`}>
    {children}
  </span>
);