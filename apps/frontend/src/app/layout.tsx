import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'KhelKhoj — AI-Powered Athlete Assessment & Talent Identification',
  description: 'National multi-sport athletic assessment platform with YOLO11n-pose biomechanical tracking, OpenCV video analysis, and Sports Authority of India talent scouting.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <footer className="border-t border-slate-800/80 bg-slate-950/40 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span>
                  <span className="font-bold">
                    <span className="text-[#FF7A00]">Khel</span>
                    <span className="text-white">Kho</span>
                    <span className="text-[#10B981]">j</span>
                  </span>{' '}
                  Platform &bull; Powered by Ultralytics YOLO11n-Pose &amp; OpenCV
                </span>
              </div>
              <div>
                Sports Authority of India (SAI) &bull; Khelo India Talent Identification Framework
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
