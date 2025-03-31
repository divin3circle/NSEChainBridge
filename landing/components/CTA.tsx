"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="w-full py-24 bg-[#111827] rounded-t-2xl mt-14">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center space-y-4 text-center"
        >
          <h2 className="text-xl font-bold tracking-tighter text-white sm:text-2xl md:text-3xl">
            Ready to Start Trading on the Blockchain?
          </h2>
          <p className="mx-auto max-w-[700px] text-gray-400 md:text-md/relaxed lg:text-base/relaxed xl:text-md/relaxed">
            Join us to and start spending your stocks on the blockchain.
          </p>
          <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center mt-8">
            <Link
              href="#"
              className="inline-flex h-10 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-[#111827] shadow transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="https://github.com/divin3circle/NSEChainBridge"
              className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-transparent px-8 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-200 hover:text-[#111827] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
            >
              Learn More
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
