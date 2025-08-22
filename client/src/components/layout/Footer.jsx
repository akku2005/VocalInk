import React from "react";

export default function Footer() {
  return (
    <footer className="bg-[#3d2c1a] text-gray-300">
      {/* Newsletter Section */}
      <div className=" text-white py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl font-medium tracking-tight mb-3">
            Stay in the Loop
          </h3>
          <p className="mb-6 text-sm md:text-base">
            Subscribe to get the latest posts & updates delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row items-center justify-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full sm:w-2/3 px-4 py-3 rounded-md border border-gray-300 text-gray-200 focus:outline-none "
            />
            <button
              type="submit"
              className="mt-3 sm:mt-0 sm:ml-3 px-6 py-3 bg-amber-600 text-white font-medium rounded-md hover:bg-gray-800 transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Footer Links */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-6 py-14">
        {/* Brand */}
        <div>
          <h2 className="text-2xl font-semibold text-white font-sans">
            VocalLink
          </h2>
          <p className="mt-3 text-sm leading-relaxed">
            Write, Read, Connect. A platform to share stories and ideas with the
            world.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-4">
            Quick Links
          </h3>
          <ul className="space-y-2">
            <li>
              <a href="/" className="hover:text-white">
                Home
              </a>
            </li>
            <li>
              <a href="/posts" className="hover:text-white">
                Browse Posts
              </a>
            </li>
            <li>
              <a href="/ai" className="hover:text-white">
                Write with AI
              </a>
            </li>
            <li>
              <a href="/about" className="hover:text-white">
                About
              </a>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-4">
            Support
          </h3>
          <ul className="space-y-2">
            <li>
              <a href="/help" className="hover:text-white">
                Help Center
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-white">
                Contact Us
              </a>
            </li>
            <li>
              <a href="/terms" className="hover:text-white">
                Terms & Privacy
              </a>
            </li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-4">
            Connect
          </h3>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white">
              Twitter
            </a>
            <a href="#" className="hover:text-white">
              Instagram
            </a>
            <a href="#" className="hover:text-white">
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div className="border-t border-gray-600 py-6 px-6 text-sm flex flex-col md:flex-row justify-between items-center">
        <p>© 2025 VocalLink. All rights reserved.</p>
        <div className="flex gap-4 mt-3 md:mt-0">
          <a href="/terms" className="hover:text-white">
            Terms
          </a>
          <a href="/privacy" className="hover:text-white">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}
