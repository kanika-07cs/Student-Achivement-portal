import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import NotificationsIcon from '@mui/icons-material/Notifications';
import Avatar from '@mui/material/Avatar';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import LightModeIcon from '@mui/icons-material/LightMode';
import EventIcon from '@mui/icons-material/Event';
import EventNoteIcon from '@mui/icons-material/EventNote';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import HistoryIcon from '@mui/icons-material/History';
import InsightsIcon from '@mui/icons-material/Insights';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import "./navlink.css";

const Navlink = () => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "enabled"
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "enabled");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "disabled");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const role = localStorage.getItem("role") || "student";

  const pages = {
    student: [
      { text: "Registration Progress", link: "/RegistrationProgress", icon: <DescriptionOutlinedIcon /> },
      { text: "Events", link: "/Events", icon: <EventIcon /> },
      { text: "Event Summary", link: "/EventSummary", icon: <EventNoteIcon /> },
    ],
    admin: [
      { text: "Approvals", link: "/Approvals", icon: <HowToRegIcon /> },
      { text: "Registration Approvals", link: "/RegistrationApprovals", icon: <TaskAltIcon /> },
      { text: "Summary Approvals", link: "/SummaryApprovals", icon: <AssignmentTurnedInIcon /> },
      { text: "Event History", link: "/EventHistory", icon: <HistoryIcon /> },
    ],
  };

  const navLinks = pages[role] || [];

  const handleLogout = () => {
    localStorage.removeItem("role");
    window.location.href = "/Login";
  };

  return (
    <>
      <div className="top-navbar">
        <div className="logo-title">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYB-39YIn8M7nenZPpLqrS485KtB_nMVAvgA&s"
            width={50}
            alt="logo"
          />
          <span className="title-text">Student Achievement Portal</span>
        </div>

        <div className="top-right-icons">
          <NotificationsIcon sx={{ color: "#c77dff" }} style={{ cursor: "pointer" }} />
          <Avatar onClick={toggleDarkMode} style={{ cursor: "pointer" }}>
            {darkMode ? <LightModeIcon sx={{ color: "#c77dff" }} /> : <BedtimeIcon sx={{ color: "#c77dff" }} />}
          </Avatar>
        </div>

        {/* Hamburger for mobile */}
        <div id="hamburger" className="hamburger" onClick={toggleSidebar}>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>

      <div className={`sidebar ${sidebarOpen ? "active" : ""}`}>
        <div>
          <ul className="nav-links">
            {navLinks.map((item, index) => (
              <li key={index} className="navbox">
                <NavLink
                  to={item.link}
                  className={({ isActive }) =>
                    isActive ? "navlink active" : "navlink"
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon && <span className="nav-icon">{item.icon}</span>}
                  {item.text}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="logout-wrapper">
          <button className="logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Navlink;
