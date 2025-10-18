
import { useEffect, useState } from 'react';
import { initDatabase } from '@/utils/database';

export const useDatabase = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        setIsReady(true);
        console.log('Database ready');
      } catch (err) {
        console.error('Database initialization error:', err);
        setError(err as Error);
      }
    };

    init();
  }, []);

  return { isReady, error };
};
