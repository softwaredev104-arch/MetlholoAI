import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { listFarms, type Farm } from '@/services/farms/farmRepository';

export function usePrimaryFarm() {
  const { firebaseUser } = useAuth();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!firebaseUser) {
      setFarm(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const farms = await listFarms(firebaseUser.uid);
      setFarm(farms[0] ?? null);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser?.uid]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    user: firebaseUser,
    farm,
    loading,
    reload,
  };
}
