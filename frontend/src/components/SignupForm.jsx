import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import API_BASE_URL from "../api.js";

const SignupForm = ({ role, title }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // 👈 Add loading state
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); // 👈 Start loading

    try {
      await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        name,
        email,
        password,
        role,
      });
      alert(`${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully!`);
      navigate(`/${role}-login`);
    } catch (err) {
      alert("Signup failed. Try again.");
    } finally {
      setLoading(false); // 👈 Stop loading regardless of success/failure
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card shadow-sm p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <h4 className="text-center mb-4">{title}</h4>
        <form onSubmit={handleSignup}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              id="name"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading} // 👈 Optional: disable input during loading
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={loading} // 👈 Disable button while loading
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Signing up...
              </>
            ) : (
              `Sign Up as ${role.charAt(0).toUpperCase() + role.slice(1)}`
            )}
          </button>
        </form>

        <hr />

        <p className="text-center mb-0">
          Already have an account?{" "}
          <Link to={`/${role}-login`} className="text-decoration-none">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;