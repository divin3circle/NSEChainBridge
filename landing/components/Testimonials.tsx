"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "NSEChainBridge has revolutionized how I trade stocks. The blockchain integration makes everything faster and more transparent.",
    author: "John Doe",
    role: "Active Trader",
    rating: 5,
  },
  {
    quote:
      "The platform's security features and instant settlement times have made trading a breeze. Highly recommended!",
    author: "Jane Smith",
    role: "Investment Manager",
    rating: 5,
  },
  {
    quote:
      "Being able to trade NSE stocks on blockchain is game-changing. The community insights feature is incredibly valuable.",
    author: "David Wilson",
    role: "Retail Investor",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="w-full py-24 bg-gray-50">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center space-y-4 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-[#111827]">
            What Our Users Say
          </h2>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Hear from our community of traders and investors
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col p-6 bg-white rounded-lg shadow-lg"
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-current text-yellow-400"
                  />
                ))}
              </div>
              <blockquote className="flex-1">
                <p className="text-lg text-gray-700">{testimonial.quote}</p>
              </blockquote>
              <div className="mt-6">
                <p className="font-semibold text-[#111827]">
                  {testimonial.author}
                </p>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
