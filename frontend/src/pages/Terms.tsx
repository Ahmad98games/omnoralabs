import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Scale, FileText } from 'lucide-react'

export default function Terms() {
    return (
        <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-serif mb-4">Terms & Conditions</h1>
                    <p className="text-gray-400">Last updated: November 2025</p>
                </div>

                <div className="prose prose-invert max-w-none space-y-8 text-gray-300">
                    <section className="bg-surface p-8 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4 text-accent-1">
                            <Scale className="w-6 h-6" />
                            <h2 className="text-xl font-semibold m-0">1. Agreement to Terms</h2>
                        </div>
                        <p>
                            By accessing our website, you agree to be bound by these Terms of Service and to comply with all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                        </p>
                    </section>

                    <section className="bg-surface p-8 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4 text-accent-2">
                            <FileText className="w-6 h-6" />
                            <h2 className="text-xl font-semibold m-0">2. Use License</h2>
                        </div>
                        <p>
                            Permission is granted to temporarily download one copy of the materials (information or software) on Omnora's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
                        </p>
                    </section>

                    <section className="bg-surface p-8 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4 text-accent-3">
                            <Shield className="w-6 h-6" />
                            <h2 className="text-xl font-semibold m-0">3. Disclaimer</h2>
                        </div>
                        <p>
                            The materials on Omnora's website are provided on an 'as is' basis. Omnora makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-white mb-2">4. Limitations</h3>
                        <p>
                            In no event shall Omnora or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Omnora's website.
                        </p>
                    </section>
                </div>
            </motion.div>
        </div>
    )
}
