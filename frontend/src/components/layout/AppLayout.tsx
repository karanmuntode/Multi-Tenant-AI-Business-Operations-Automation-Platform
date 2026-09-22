/* ── App Layout ──────────────────────────────
   Main layout wrapper with sidebar + header + content area.
   ──────────────────────────────────────────── */

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Header />
        <div className="app-content animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
