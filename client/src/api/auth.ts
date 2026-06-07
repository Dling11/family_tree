import { api, ADMIN_TOKEN_KEY } from './http';

export const loginAdmin = async (username: string, password: string) => {
  const { data } = await api.post<{ token: string; username: string }>('/auth/login', { username, password });
  localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
  return data;
};

export const logoutAdmin = () => localStorage.removeItem(ADMIN_TOKEN_KEY);
export const hasAdminSession = () => Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));
