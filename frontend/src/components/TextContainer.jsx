import React from 'react';

const TextContainer = ({ children, isRTL }) => {
  return (
    <div className="relative p-1 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
      <div className="bg-white rounded-lg p-8">
        <div className={`prose max-w-none ${isRTL ? 'rtl text-right' : 'ltr text-left'}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default TextContainer;