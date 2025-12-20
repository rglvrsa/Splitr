import './App.css'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import Navbar from './components/Navbar/Navbar.jsx'
import Login from './pages/Login/Login.jsx'
import Signup from './pages/Signup/Signup.jsx'
import Group from './pages/Group/Group.jsx'
import AllExpenses from './pages/AllExpenses/AllExpenses.jsx'
import AllBalances from './pages/AllBalances/AllBalances.jsx'
import Footer from './components/Footer/Footer.jsx'
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import Lenis from 'lenis'

function App() {

// Initialize Lenis
const lenis = new Lenis({
  autoRaf: true,
});

// Listen for the scroll event and log the event data
lenis.on('scroll', (e) => {
  console.log(e);
});



















  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      setIsSignUp(window.location.hash === '#/sign-up');
    };
    
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);







  return (
    <>
      <SignedOut>
        {isSignUp ? <Signup /> : <Login />}
      </SignedOut>
      <SignedIn>
        <AppProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/group" element={<Group />} />
            <Route path="/all-expenses" element={<AllExpenses />} />
            <Route path="/all-balances" element={<AllBalances />} />
          </Routes>
          <Footer />
        </AppProvider>
      </SignedIn>
    </>
  )
}

export default App

