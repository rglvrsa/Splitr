import React from 'react'
import { SignIn } from "@clerk/clerk-react";
import './Login.css'

const Login = () => {
  return (
    <div className="login-page">
      <div className="login-background">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
        <div className="gradient-blob blob-3"></div>
      </div>
      
      <div className="login-content">
        <div className="login-branding">
          <img src="/Images/logo.png" alt="Splitr Logo" className="login-logo" />
        </div>
        
        <div className="login-form-wrapper">
          <SignIn 
            routing="hash" 
            signUpUrl="#/sign-up"
          />
        </div>
        
        <p className="login-footer">
          Split expenses effortlessly with friends & family
        </p>
      </div>
    </div>
  )
}

export default Login
