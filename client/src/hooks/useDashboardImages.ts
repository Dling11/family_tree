import { useCallback, useEffect, useState } from 'react';
import { getDashboardImages, getPublicDashboardImages } from '../api';
import type { DashboardImage } from '../types';

export function usePublicDashboardImages() {
  const [images, setImages] = useState<DashboardImage[]>([]);

  useEffect(() => {
    getPublicDashboardImages().then(setImages);
  }, []);

  return images;
}

export function useAdminDashboardImages() {
  const [images, setImages] = useState<DashboardImage[]>([]);
  const reload = useCallback(() => getDashboardImages().then(setImages).catch(() => undefined), []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { images, reload };
}
