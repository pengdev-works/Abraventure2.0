import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white font-bold tracking-wider mb-2">ABRAVENTURE</p>
          <p className="text-sm">Integrated Tourism Information and Homestay Management System for the Province of Abra</p>
          <p className="text-xs mt-1 text-slate-500">© {new Date().getFullYear()} Provincial Tourism Office (DOT) of Abra. All rights reserved.</p>
          <div className="mt-4 flex justify-center space-x-6 text-xs text-slate-500">
            <span>Verified Stakeholders</span>
            <span>•</span>
            <span>Accredited Guides & Homestays</span>
            <span>•</span>
            <span>27 Municipalities of Abra</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
