import React, { useState } from "react";
import "../login/login.css";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Error message state

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // Step 1: Attempt login
    const response = await axios.post('http://localhost:7000/login', {
      email,
      password
    });

    const role = response.data.role;
    localStorage.setItem("role", role);
    localStorage.setItem("email", email);

    // Step 2: If student, fetch and store reg_no
    if (role === "student") {
      const regRes = await axios.get(`http://localhost:7000/student-details/${email}`);
      if (regRes.data && regRes.data.reg_no) {
        localStorage.setItem("reg_no", regRes.data.reg_no);
      }
    }

    // Step 3: Redirect based on role
    role === "admin"
      ? (window.location.href = "/approvals")
      : (window.location.href = "/registrationProgress");

  } catch (error) {
    if (error.response) {
      alert(error.response.data.error || 'Login failed');
    } else {
      setError('Server error');
    }
  }
};


  return (
    <div className="loginpage">
      <div className="container">
        <img
          className="image"
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYB-39YIn8M7nenZPpLqrS485KtB_nMVAvgA&s"
          width={150}
          alt="Login"
        />
        <h3 className="content">Student Achivement Portal</h3>
        {error && <p className="error-message">{error}</p>}

        
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="form-label">Email</label>
          <input
            className="form-input" type="email"
            name="email" placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />

          <label className="form-label">Password</label>
          <input
            className="form-input" type="password"
            name="password" placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          <input className="submit-button" type="submit" value="Login" />
        </form>
      </div>
    </div>
  );
};


export default Login;
