import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ResumeProvider } from './store/ResumeContext';
const Home = lazy(() => import('./pages/Home'));
const Builder = lazy(() => import('./pages/Builder'));
const AdminAllowDownload = lazy(() => import('./pages/AdminAllowDownload'));

function App() {
  return (
    <ResumeProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">
              Loading resume builder...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/allowdownload" element={<AdminAllowDownload />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ResumeProvider>
  );
}

export default App;
