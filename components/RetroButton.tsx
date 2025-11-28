import React from 'react';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

const RetroButton: React.FC<RetroButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-6 py-3 font-bold uppercase transition-transform active:scale-95 border-b-4 border-r-4";
  
  let variantStyles = "";
  switch (variant) {
    case 'primary':
      variantStyles = "bg-blue-500 text-white border-blue-800 hover:bg-blue-400";
      break;
    case 'secondary':
      variantStyles = "bg-gray-600 text-white border-gray-800 hover:bg-gray-500";
      break;
    case 'danger':
      variantStyles = "bg-red-500 text-white border-red-800 hover:bg-red-400";
      break;
  }

  return (
    <button 
      className={`${baseStyle} ${variantStyles} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default RetroButton;