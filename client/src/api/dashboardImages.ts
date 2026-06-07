import type { DashboardImage } from '../types';
import { api } from './http';

const defaultDashboardImages: DashboardImage[] = [
  {
    _id: 'rodriguez-clan-local',
    title: 'Rodriguez Family',
    caption: 'Rodriguez family photo.',
    imageUrl: '/images/rodriguez_clan.jpg',
    sortOrder: 0,
    isActive: true,
  },
  {
    _id: 'lolo2-local',
    title: 'Rodriguez family memory',
    caption: 'Rodriguez family photo.',
    imageUrl: '/images/lolo2.jpg',
    sortOrder: 1,
    isActive: true,
  },
];

export const getPublicDashboardImages = async (): Promise<DashboardImage[]> => {
  try {
    const { data } = await api.get<DashboardImage[]>('/dashboard-images/public');
    return [...defaultDashboardImages, ...data];
  } catch {
    return defaultDashboardImages;
  }
};

export const getDashboardImages = async (): Promise<DashboardImage[]> => {
  const { data } = await api.get<DashboardImage[]>('/dashboard-images');
  return data;
};

export const createDashboardImage = async (form: FormData) => {
  const { data } = await api.post<DashboardImage>('/dashboard-images', form);
  return data;
};

export const deleteDashboardImage = async (id: string) => {
  await api.delete(`/dashboard-images/${id}`);
};
