'use client';

import { useData } from '@/contexts/DataContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const { isAuthenticated, loading, signIn } = useData();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">👶</div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">
          宝宝成长记录
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          记录宝宝的身高、体重、头围数据，追踪成长趋势
        </p>

        <div className="space-y-3">
          <div id="apple-sign-in-button"></div>

          <button
            onClick={signIn}
            className="w-full py-3 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            开始使用
          </button>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            数据安全存储在 iCloud 中
          </p>
        </div>
      </div>
    </div>
  );
}
