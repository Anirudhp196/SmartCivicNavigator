import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function LayoutWithNavbar() {
  return (
    <>
      <Navbar />
      <div className="pt-4">
        {/* This Outlet renders the content of the nested route */}
        <Outlet />
      </div>
    </>
  );
}

export default LayoutWithNavbar; 