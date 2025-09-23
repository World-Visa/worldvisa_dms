import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { Loader2 } from 'lucide-react';

export const NavigationLoader = () => {
  const { isNavigating } = useNotificationStore();

  useEffect(() => {
    // Prevent body scroll when navigating
    if (isNavigating) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isNavigating]);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Navigating...</h3>
          <p className="text-sm text-gray-600">Please wait while we load the application details</p>
        </div>
      </div>
    </div>
  );
};
