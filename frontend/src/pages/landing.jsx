import React from 'react'
import { Link, useNavigate} from "react-router-dom";

import "../App.css";


export default function LandingPage() {
  const router = useNavigate();
  return (
    <div className='landingPageContainer'>
      <nav>
        <div className='navHeader'>
          <h2>Apna Video Call</h2>
        </div>
        <div className='navList'>
          <p onClick={() =>{
            router("/snkw4132")
          }}>
            Join as Guest
          </p>
          <p onClick={() => {
            router("/auth")
           }}>
            Register
          </p>
            <div onClick={() => {
            router("/auth")
           }}>
            <p>
              Login
            </p>
           </div>
        </div>

      </nav>

      <div className="landingMainContainer">
        
     <div>
        <h1><span style={{color: "#F59E0B"}}>Connect</span> with your Loved Ones</h1>
      <p>Cover a distance by apna video call</p>
      <div role='button'>
        <Link to={"/auth"}>Get Started</Link>
      </div>
     </div>
      

       <div>
         <img src='/mobile.png' alt=''></img>
       </div>

      </div>
        </div>
  )
}
