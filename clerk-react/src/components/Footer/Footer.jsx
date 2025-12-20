import React, { useState,useRef,useEffect} from "react";
import "./Footer.css";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(ScrollTrigger);

function Footer() {
    const p12Ref = useRef(null);
    const fbot=useRef(null);
    const [xval,setx]=useState(0);
    const [yval,sety]=useState(0);


    useEffect(() => {
      const handleMouseMove = (e) => {
          if (p12Ref.current) {
              const rect = p12Ref.current.getBoundingClientRect();
              setx(e.clientX - rect.x - rect.width / 2);
              sety(e.clientY - rect.y - rect.height / 2);
          }
      };
  
      document.addEventListener('mousemove', handleMouseMove);
  
      
      return () => {
          document.removeEventListener('mousemove', handleMouseMove);
      };
  }, []);
  
      
      useGSAP(()=>{
        const mm=gsap.matchMedia();
        mm.add("(min-width: 490px)",()=>{
        gsap.to(p12Ref.current, {
          transform:`rotateX(${yval/20}deg) rotateY(${xval/15}deg)`,
          ease: "power4.out",
          duration:1.99
        });
      });
      },[xval,yval]);  


      useGSAP(()=>{
        const links=document.querySelectorAll(".link a");
        const socials=document.querySelectorAll("#socials p");
        const mm=gsap.matchMedia();
        mm.add("(min-width: 490px)",()=>{
        gsap.to(links,{
          transform:"translateY(0)",
          opacity:1,
          stagger:0.26,
          ease:"expo.out",
          duration:1.99,
          scrollTrigger:{
            trigger:"#footer",
            start:"top 45%",
            end:"top -7%",
            scrub:true,
          
          }
      })
      gsap.to(socials,{
        transform:"translateY(0)",
        opacity:1,
        stagger:0.18,
        ease:"hop.out",
        duration:1.99,
        scrollTrigger:{
          trigger:"#footer",
          start:"top 45%",
          end:"top -7%",
          scrub:true,
          
        }
      })
      gsap.to("#video-wrapper",{
        clipPath:"polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        ease:"expo.out",
        duration:3,
        scrollTrigger:{
          trigger:"#footer",
          start:"top 19%",
          end:"top -10%",
          scrub:true,
         
        }
      })
      gsap.to("#header span",{
        rotateY:0,
        transform:"scale(0.75)",             
        stagger:0.4,                
        opacity:1,
        ease:"expo.out",
        duration:2.1,
        scrollTrigger:{
          trigger:"#footer",
          start:"top 19%",
          end:"top -10%",
          scrub:true,
         
        }

      })
    })
     mm.add("(max-width: 490px)",()=>{
      gsap.to(links,{
        transform:"translateY(0)",
        opacity:1,
        stagger:0.26,
        ease:"hop.out",
        scrollTrigger:{
          trigger:"#footer",
          start:"top 76%",
          end:"top 66%",
          scrub:true,
          
        }
        
      })
      gsap.to(socials,{
        transform:"translateY(0)",
        opacity:1,
        stagger:0.18,
        ease:"hop.out",
        duration:1.99,
        scrollTrigger:{
          trigger:"#footer",
          start:"top 76%",
          end:"top 67%",
          scrub:true,
          
          
        }
      })
      gsap.to("#header span",{
        rotateY:0, 
        transform:"translateY(0)",             
        stagger:0.4,                
        opacity:1,
        ease:"expo.out",
        duration:2.1,
        scrollTrigger:{
          trigger:"#footer",
          start:"top 76%",
          end:"top 67%",
          scrub:0.5,
          

        }

      })
     })
    })
      
    
  return (
    <>
    <div id="footer">
      <div id="fleft">
      
        <div id="fmain" ref={p12Ref} >
        <img src="Images/logo2.png" alt="Logo" />
        </div>
        <div id="links">
          <div className="link" ><a href="#"  id="on"><i className="ri-arrow-right-up-line"></i>&nbsp;Contact Us</a></div>
          <div className="link"><a href="#" className="off"><i className="ri-arrow-right-up-line closed" id="off"></i>&nbsp;About Us</a></div>
          <div className="link"><a href="#" className="off"><i className="ri-arrow-right-up-line closed" id="off"></i>&nbsp;Privacy Policy</a></div>
          <div className="link"><a href="#" className="off"><i className="ri-arrow-right-up-line closed" id="off"></i>&nbsp;Terms & Conditions</a></div>
        </div>
        <div id="video-wrapper">
          <video src="/Video/v1.mp4" autoPlay loop muted playsInline></video>
        </div>
        </div>
        <div id="fright">
          <div id="socials">
            <div className="sub-col">
              <p>Kalna Gate,Khan Pukur</p>
              <p>West Bengal, India</p>
              <div className="spacediv"></div>
              <p>+91 xxxxxxxxx</p>
              <p>info@splitr.com</p>
            </div>
            <div className="sub-col">
              <a href="https://www.instagram.com/splitr.in/"><p>INSTAGRAM</p></a>
              <a href="https://www.facebook.com/splitr.in/"><p>FACEBOOK</p></a>
              <a href="https://twitter.com/splitr.in"><p>TWITTER</p></a>
              <a href="https://www.youtube.com/@splitr.in"><p>YOUTUBE</p></a>
              <div className="spacediv"></div>
             
            </div>
          </div>
          <div id="header">
          <span>S</span><span>P</span><span>L</span><span>I</span><span>T</span><span>R</span>
          </div>
        </div>
    </div>
    </>
  )
}

export default Footer