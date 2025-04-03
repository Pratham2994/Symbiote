import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Code2, Home, Trophy, Users2, Users, Bell, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { navbarScroll, navLinkHover } from "../utils/animations";
import { motion } from "framer-motion";
import NotificationModal from "./Modals/NotificationModal";

export default function UserNavbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
                className="relative p-2 hover:bg-venom-purple/20 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6 text-ghost-lilac" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-venom-purple text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
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
