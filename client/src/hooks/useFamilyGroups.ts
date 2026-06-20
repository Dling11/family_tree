import { useCallback, useEffect, useState } from 'react';
import { getFamilyGroups, logoutAdmin } from '../api';
import type { FamilyGroup } from '../types';

export function useFamilyGroups(onUnauthorized: () => void) {
  const [groups, setGroups] = useState<FamilyGroup[]>([]);

  const reload = useCallback(() => getFamilyGroups().then(setGroups).catch((requestError: { response?: { status?: number } }) => {
    if (requestError.response?.status === 401) {
      logoutAdmin();
      onUnauthorized();
    }
  }), [onUnauthorized]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { groups, reload };
}
