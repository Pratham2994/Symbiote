import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Code2, Home, Trophy, Users2, Users, Bell, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { navbarScroll, navLinkHover } from "../utils/animations";
import { motion } from "framer-motion";
import NotificationModal from "./Modals/NotificationModal";
import axios from 'axios';

export default function UserNavbar() {
  const { logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/notifications');
      if (response.data.success && response.data.data) {
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch unread count when component mounts and when modal is closed
  useEffect(() => {
    fetchUnreadCount();
  }, [isNotificationModalOpen]);

  const handleLogout = async () => {
    await logout();
  };

  const renderNavLink = (to, Icon, label, extraProps = {}) => (
    <NavLink
      to={to}
      {...extraProps}
      className="flex items-center gap-2 relative text-ghost-lilac/80 hover:text-venom-purple transition-colors group"
    >
      {({ isActive }) => (
        <>
          <Icon size={20} />
          <span>{label}</span>
          <motion.span
            className="absolute -bottom-1 left-0 h-0.5 bg-venom-purple"
            animate={isActive ? navLinkHover.active : navLinkHover.default}
            whileHover={navLinkHover.hover}
            transition={{ duration: 0.3 }}
          ></motion.span>
        </>
      )}
    </NavLink>
  );

  return (
    <>
      <motion.nav
        className="fixed w-full z-50 transition-all duration-300"
        animate={isScrolled ? navbarScroll.scrolled : navbarScroll.default}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Code2 className="w-8 h-8 text-venom-purple" />
              <span className="text-xl font-bold bg-gradient-to-r from-venom-purple to-ghost-lilac bg-clip-text text-transparent">
                Symbiote
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {renderNavLink("/dashboard", Home, "Home", { end: true })}
              {renderNavLink("/dashboard/hackathons", Trophy, "Hackathons")}
              {renderNavLink("/dashboard/teams", Users2, "Teams")}
              {renderNavLink("/dashboard/friends", Users, "Friends")}
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsNotificationModalOpen(true)}
                className="relative text-ghost-lilac/80 hover:text-venom-purple transition-colors"
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-venom-purple rounded-full text-xs flex items-center justify-center text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <NavLink
                to="/dashboard/profile"
                className={({ isActive }) => `text-ghost-lilac/80 hover:text-venom-purple transition-colors ${isActive ? 'text-venom-purple' : ''}`}
              >
                {({ isActive }) => <User size={24} />}
              </NavLink>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-venom-purple text-ghost-lilac rounded transition-colors hover:bg-venom-purple/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <NotificationModal 
        isOpen={isNotificationModalOpen} 
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </>
  );
}
