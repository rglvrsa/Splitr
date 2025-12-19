import React from 'react'
import './Navbar.css'
import { UserButton } from "@clerk/clerk-react";
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <>
    <div id="navbar">
        <div id="navbarleft">
          <img src="/Images/logo.png" alt="logo" id="navlogo"/>
        </div>
        <div id="navbarright">     
          <Link to="/">   
         <div id="navdash"><i className="ri-dashboard-line"></i> Dashboard</div>
         </Link>
         <UserButton 
           appearance={{
             elements: {
               avatarBox: {
                 width: '40px',
                 height: '40px',
                 borderRadius: '50%',
                 border: '2px solid #1db954',
               },
               userButtonPopoverCard: {
                 background: '#141414',
                 border: '1px solid #2a2a2a',
               },
               userButtonPopoverActionButton: {
                 color: '#e5e5e5',
                 '&:hover': {
                   background: '#1d1d1d',
                 },
               },
               userButtonPopoverActionButtonText: {
                 color: '#e5e5e5',
               },
               userButtonPopoverActionButtonIcon: {
                 color: '#a1a1aa',
               },
               userButtonPopoverFooter: {
                 display: 'none',
               },
             },
           }}
         />
        </div>
    </div>
    </>
  )
}

export default Navbar