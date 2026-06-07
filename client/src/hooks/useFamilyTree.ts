import { useEffect, useState } from 'react';
import { getTree } from '../api';
import type { TreeData } from '../types';

export function useFamilyTree() {
  const [tree, setTree] = useState<TreeData>({ members: [], edges: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTree().then(setTree).finally(() => setLoading(false));
  }, []);

  return { tree, loading };
}
