import React from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, Database } from 'lucide-react'

export default function Privacy() {
    return (
        <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-serif mb-4">Privacy Policy</h1>
                    <p className="text-gray-400">Your privacy is important to us</p>
                </div>

                <div className="prose prose-invert max-w-none space-y-8 text-gray-300">
                    <section className="bg-surface p-8 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4 text-accent-1">
                            <Lock className="w-6 h-6" />
                            <h2 className="text-xl font-semibold m-0">Information We Collect</h2>
                        </div>
                        <p>
                            We collect information you provide directly to us, such as when you create an account, make a purchase, sign up for our newsletter, or contact us for support. This may include your name, email address, shipping address, and payment information.
                        </p>
                    </section>

                    <section className="bg-surface p-8 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4 text-accent-2">
                            <Eye className="w-6 h-6" />
                            <h2 className="text-xl font-semibold m-0">How We Use Your Information</h2>
                        </div>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>To process your orders and payments</li>
                            <li>To send you order confirmations and updates</li>
                            <li>To respond to your comments and questions</li>
                            <li>To send you marketing communications (if opted in)</li>
                        </ul>
                    </section>

                    <section className="bg-surface p-8 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4 text-accent-3">
                            <Database className="w-6 h-6" />
                            <h2 className="text-xl font-semibold m-0">Data Security</h2>
                        </div>
                        <p>
                            We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.
                        </p>
                    </section>
                </div>
            </motion.div>
        </div>
    )
}
