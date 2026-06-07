import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const TreePage = lazy(() => import('./pages/TreePage').then((module) => ({ default: module.TreePage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })));

export default function App() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-cream font-display text-2xl text-forest">Opening the family archive...</div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tree" element={<TreePage />} />
          <Route path="about" element={<AboutPage />} />
        </Route>
        <Route path="admin" element={<AdminPage />} />
      </Routes>
    </Suspense>
  );
}
