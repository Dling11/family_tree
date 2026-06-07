import { sampleFamily } from '../data/sampleFamily';
import type { FamilyMember, TreeData } from '../types';
import { api } from './http';

export const getTree = async (): Promise<TreeData> => {
  try {
    const { data } = await api.get<TreeData>('/members/tree');
    return data.members.length ? data : sampleFamily;
  } catch {
    return sampleFamily;
  }
};

export const getMembers = async (): Promise<FamilyMember[]> => {
  const { data } = await api.get<FamilyMember[]>('/members');
  return data;
};

export const createMember = async (form: FormData) => {
  const { data } = await api.post<FamilyMember>('/members', form);
  return data;
};

export const updateMember = async (id: string, form: FormData) => {
  const { data } = await api.put<FamilyMember>(`/members/${id}`, form);
  return data;
};

export const deleteMember = async (id: string) => {
  await api.delete(`/members/${id}`);
};
