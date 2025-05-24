import React from 'react';
import { LayoutProps } from '@/types/layout';
import Header from './Header';
import Footer from './Footer';

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout; 