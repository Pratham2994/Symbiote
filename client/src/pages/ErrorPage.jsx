import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, AlertCircle } from "lucide-react";
import UserNavbar from "../components/UserNavbar";

const ErrorPage = () => {
    return (
        <div className="min-h-screen bg-[#0B0B0B] text-ghost-lilac">
            <div className="absolute inset-0 bg-gradient-to-b from-void-black via-symbiote-purple/20 to-void-black"></div>
            <UserNavbar />
            <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.2
                        }}
                        className="relative mb-8"
                    >
                        <div className="absolute inset-0 bg-venom-purple/20 rounded-full blur-2xl"></div>
                        <div className="relative bg-symbiote-purple/20 border border-venom-purple/30 rounded-full p-6 shadow-neon">
                            <AlertCircle className="w-24 h-24 text-venom-purple" />
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-5xl py-3 font-bold mb-4 bg-gradient-to-r from-venom-purple to-symbiote-purple bg-clip-text text-transparent"
                    >
                        Oops! Page Not Found
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-xl text-ghost-lilac/80 mb-8 max-w-2xl"
                    >
                        The page you're looking for doesn't exist or has been moved. Let's get you back on track!
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex gap-4"
                    >
                        <Link
                            to="/dashboard"
                            className="group px-6 py-3 bg-venom-purple rounded-lg shadow-neon hover:shadow-neon-lg hover:bg-venom-purple/90 transition-all flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Back to Home
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-12 p-6 bg-symbiote-purple/10 border border-venom-purple/30 rounded-xl max-w-2xl"
                    >
                        <h2 className="text-xl font-semibold mb-4 text-venom-purple">Need Help?</h2>
                        <p className="text-ghost-lilac/70">
                            If you believe this is a mistake or need assistance, please contact our support team.
                        </p>
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
};

export default ErrorPage; 