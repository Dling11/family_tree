import type { FamilyGroup } from '../types';
import { api } from './http';

export const getFamilyGroups = async (): Promise<FamilyGroup[]> => {
  const { data } = await api.get<FamilyGroup[]>('/family-groups');
  return data;
};

export const createFamilyGroup = async (name: string): Promise<FamilyGroup> => {
  const { data } = await api.post<FamilyGroup>('/family-groups', { name });
  return data;
};
