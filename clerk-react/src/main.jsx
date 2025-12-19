import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

// Dark theme appearance for all Clerk components
const clerkAppearance = {
  elements: {
    rootBox: {
      width: '100%',
    },
    card: {
      boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5)',
      borderRadius: '24px',
      border: '1px solid #2a2a2a',
      background: '#141414',
      padding: '36px 32px',
    },
    headerTitle: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: '700',
      fontSize: '1.75rem',
      color: '#ffffff',
      letterSpacing: '-0.5px',
    },
    headerSubtitle: {
      fontFamily: "'Inter', sans-serif",
      color: '#a1a1aa',
      fontSize: '0.95rem',
      marginTop: '8px',
    },
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #0d4a25 0%, #1a7a4c 50%, #0f3d2e 100%)',
      borderRadius: '12px',
      fontSize: '16px',
      fontFamily: "'Inter', sans-serif",
      fontWeight: '600',
      textTransform: 'none',
      padding: '14px 28px',
      border: 'none',
      boxShadow: '0 8px 24px rgba(13, 74, 37, 0.4)',
      transition: 'all 0.3s ease',
      backgroundSize: '200% 200%',
      backgroundPosition: '0% 50%',
      '&:hover': {
        backgroundPosition: '100% 50%',
        boxShadow: '0 12px 32px rgba(13, 74, 37, 0.5)',
        transform: 'translateY(-2px) scale(1.02)',
      },
      '&:active': {
        transform: 'translateY(0) scale(1)',
      },
    },
    formFieldInput: {
      fontFamily: "'Inter', sans-serif",
      borderRadius: '10px',
      border: '1px solid #333333',
      padding: '14px 16px',
      fontSize: '15px',
      color: '#ffffff',
      background: '#1d1d1d',
      transition: 'all 0.2s ease',
      '&:focus': {
        borderColor: '#1db954',
        background: '#222222',
        boxShadow: '0 0 0 3px rgba(29, 185, 84, 0.15)',
      },
      '&::placeholder': {
        color: '#6b7280',
      },
    },
    formFieldLabel: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: '500',
      fontSize: '14px',
      color: '#e5e5e5',
      marginBottom: '6px',
    },
    formFieldHintText: {
      fontFamily: "'Inter', sans-serif",
      color: '#71717a',
      fontSize: '12px',
    },
    footerActionLink: {
      fontFamily: "'Inter', sans-serif",
      color: '#1db954',
      fontWeight: '600',
      textDecoration: 'none',
      '&:hover': {
        color: '#22c55e',
        textDecoration: 'underline',
      },
    },
    footerActionText: {
      fontFamily: "'Inter', sans-serif",
      color: '#a1a1aa',
    },
    socialButtonsBlockButton: {
      fontFamily: "'Inter', sans-serif",
      borderRadius: '10px',
      border: '1px solid #333333',
      padding: '12px 18px',
      fontWeight: '500',
      background: '#1d1d1d',
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: '#444444',
        background: '#262626',
      },
    },
    socialButtonsBlockButtonText: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: '500',
      color: '#e5e5e5',
    },
    dividerLine: {
      background: '#333333',
    },
    dividerText: {
      fontFamily: "'Inter', sans-serif",
      color: '#71717a',
      fontSize: '13px',
      fontWeight: '500',
    },
    formFieldInputShowPasswordButton: {
      color: '#71717a',
      '&:hover': {
        color: '#1db954',
      },
    },
    identityPreviewEditButton: {
      color: '#1db954',
      '&:hover': {
        color: '#22c55e',
      },
    },
    identityPreviewText: {
      color: '#e5e5e5',
      fontFamily: "'Inter', sans-serif",
    },
    identityPreview: {
      background: '#1d1d1d',
      border: '1px solid #333333',
      borderRadius: '10px',
    },
    formResendCodeLink: {
      color: '#1db954',
      fontFamily: "'Inter', sans-serif",
      '&:hover': {
        color: '#22c55e',
      },
    },
    alert: {
      borderRadius: '10px',
      background: '#1d1d1d',
      border: '1px solid #333333',
    },
    alertText: {
      color: '#e5e5e5',
      fontFamily: "'Inter', sans-serif",
    },
    avatarBox: {
      borderRadius: '12px',
    },
    formFieldSuccessText: {
      color: '#1db954',
    },
    formFieldWarningText: {
      color: '#f59e0b',
    },
    formFieldErrorText: {
      color: '#ef4444',
      fontFamily: "'Inter', sans-serif",
    },
    otpCodeFieldInput: {
      fontFamily: "'Inter', sans-serif",
      borderRadius: '8px',
      border: '1px solid #333333',
      background: '#1d1d1d',
      color: '#ffffff',
      '&:focus': {
        borderColor: '#1db954',
        boxShadow: '0 0 0 3px rgba(29, 185, 84, 0.15)',
      },
    },
    footer: {
      background: '#141414',
      borderTop: '1px solid #252525',
      padding: '16px',
      borderRadius: '0 0 24px 24px',
    },
    footerAction: {
      background: '#141414',
    },
    footerActionContainer: {
      background: '#141414',
    },
    footerPages: {
      background: '#141414',
    },
    footerPagesLink: {
      color: '#71717a',
      fontFamily: "'Inter', sans-serif",
      '&:hover': {
        color: '#1db954',
      },
    },
    main: {
      background: '#141414',
    },
    navbar: {
      background: '#141414',
    },
    pageScrollBox: {
      background: '#141414',
    },
    badge: {
      background: 'linear-gradient(135deg, #0d3320 0%, #14532d 100%)',
      color: '#22c55e',
      border: '1px solid #166534',
    },
    tagPrimaryIcon: {
      color: '#22c55e',
    },
    tagPrimaryText: {
      color: '#22c55e',
    },
  },
  layout: {
    socialButtonsPlacement: 'top',
    socialButtonsVariant: 'blockButton',
  },
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY} 
        afterSignOutUrl="/"
        appearance={clerkAppearance}
      >
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </StrictMode>
);
