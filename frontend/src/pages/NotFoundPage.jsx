import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export const NotFoundPage = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-charcoal-50 dark:bg-charcoal-950 min-h-[60vh]">
      <div className="w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6 shadow-soft">
        <Compass className="w-10 h-10 animate-spin-slow" />
      </div>

      <h1 className="text-4xl font-black text-charcoal-900 dark:text-white tracking-tight mb-2">
        404
      </h1>
      <h2 className="text-xl font-bold text-charcoal-800 dark:text-charcoal-200 mb-2">
        Page Not Found
      </h2>
      <p className="text-sm text-charcoal-500 dark:text-charcoal-400 max-w-sm mb-6 leading-relaxed">
        The page or conversation thread you are looking for doesn’t exist or has moved.
      </p>

      <Link to="/chat">
        <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Messages
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
