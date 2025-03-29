import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const AuthModal = ({ type, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-void-black border border-venom-purple/20 rounded-xl p-6 w-full max-w-md shadow-neon"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {type === 'login' ? 'Welcome Back' : 'Join Symbiote'}
          </h2>
          <button
            onClick={onClose}
            className="text-ghost-lilac/60 hover:text-ghost-lilac"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg bg-symbiote-purple/20 border border-venom-purple/30 focus:border-venom-purple focus:outline-none focus:ring-2 focus:ring-venom-purple/20"
              placeholder="your.email@somaiya.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded-lg bg-symbiote-purple/20 border border-venom-purple/30 focus:border-venom-purple focus:outline-none focus:ring-2 focus:ring-venom-purple/20"
              placeholder="••••••••"
            />
          </div>

          {type === 'signup' && (
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 rounded-lg bg-symbiote-purple/20 border border-venom-purple/30 focus:border-venom-purple focus:outline-none focus:ring-2 focus:ring-venom-purple/20"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-venom-purple rounded-lg font-semibold shadow-neon hover:shadow-lg hover:bg-venom-purple/90 transition-all"
          >
            {type === 'login' ? 'Log in' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ghost-lilac/60">
          {type === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => {}}
                className="text-venom-purple hover:text-venom-purple/80 font-medium"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => {}}
                className="text-venom-purple hover:text-venom-purple/80 font-medium"
              >
                Log in
              </button>
            </>
          )}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default AuthModal;
