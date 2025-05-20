import React from 'react';

const AuthErrorPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 bg-white rounded shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Failed</h1>
        <p className="text-gray-700">
          We were unable to log you in. Please try again or contact support if the problem persists.
        </p>
        {/* Optional: Add a link back to the login page or homepage */}
        <a href="/auth/google/login" className="mt-4 inline-block text-blue-600 hover:underline">
          Try logging in again
        </a>
      </div>
    </div>
  );
};

export default AuthErrorPage;