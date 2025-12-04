import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-lg"
            >
                <h1 className="text-9xl font-serif text-accent-1 opacity-20 mb-4">404</h1>
                <h2 className="text-3xl font-serif mb-6">Page Not Found</h2>
                <p className="text-gray-400 mb-8 text-lg">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10"
                    >
                        <Home className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <Link
                        to="/collection"
                        className="luxury-button inline-flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Browse Collection
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
