import { useCallback, useEffect, useState } from 'react';
import { getMembers, logoutAdmin } from '../api';
import type { FamilyMember } from '../types';

export function useAdminMembers(onUnauthorized: () => void) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [error, setError] = useState('');

  const reload = useCallback(() => getMembers().then((data) => {
    setMembers(data);
    setError('');
  }).catch((requestError: { response?: { status?: number } }) => {
    if (requestError.response?.status === 401) {
      logoutAdmin();
      onUnauthorized();
      return;
    }
    setError('Connect MongoDB and start the server to manage family records.');
  }), [onUnauthorized]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { members, error, reload };
}
