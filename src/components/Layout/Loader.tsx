import React from "react";

const Loader: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-16 w-full">
    <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin shadow-glow mb-4"></div>
    {text && (
      <div className="text-white/80 text-lg font-semibold mt-2 animate-pulse">
        {text}
      </div>
    )}
  </div>
);

export default Loader;
