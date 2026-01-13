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
          <Link to="/profile">   
         <div id="navprofile"><i className="ri-user-settings-line"></i> Profile</div>
         </Link>
        <UserButton 
            appearance={{
              elements: {
                avatarBox: {
                  width: '3.2vw',
                  height: '3.2vw',
                  borderRadius: '50%',
                  border: '3px solid #1db954',
                  fontSize: '1.5vw',
                },
                userButtonPopoverCard: {
                  background: '#a49797ff',
                  border: '1px solid #dddadaff',
                  minWidth: '22vw',
                  minHeight: '8vw',
                  padding: '0',
                  fontSize: '1vw',
                },
                userButtonPopoverActionButton: {
                  color: '#e5e5e5',
                  fontSize: '1vw',
                  '&:hover': {
                    background: '#e5e0e0ff',
                  },
                },
                userButtonPopoverActionButtonText: {
                  color: '#e5e5e5',
                  fontSize: '1vw',
                },
                userButtonPopoverActionButtonIcon: {
                  color: '#a1a1aa',
                  fontSize: '1vw',
                },
                userButtonPopoverFooter: {
                  display: 'none',
                },
                // Add these lines to increase name and email font size
                userPreviewTextContainer: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2vw',
                },
                userPreviewMainIdentifier: {
                  fontSize: '100vw !important',
                  fontWeight: '900',
                  color: '#100f0fff',
                },
                userPreviewSecondaryIdentifier: {
                  fontSize: '1.3vw',
                  color: '#000000',
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