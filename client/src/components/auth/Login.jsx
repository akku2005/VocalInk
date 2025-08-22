import React from "react";

export default function Login() {
  return (
    <div className="flex justify-center w-full min-h-screen items-center px-4">
      <div className="w-full max-w-md flex flex-col items-center p-5 gap-6">
        {/* Heading */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#2e291f]">Blogger</h2>
          <h4 className="text-sm text-[#5C4F3B]">Sign in to your account</h4>
        </div>

        {/* Form Inputs */}
        <div className="flex flex-col w-full gap-5">
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm pl-1 text-[#5C4F3B]">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              className="bg-[#F5EFE8] text-[#5C4F3B] placeholder-[#948A7A] focus:ring-[#2e291f] rounded-xl ring ring-[#bdb9b2] focus:outline-none focus:ring-2 w-full py-3 px-4"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm pl-1 text-[#5C4F3B]">
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              className="bg-[#F5EFE8] text-[#5C4F3B] placeholder-[#948A7A] focus:ring-[#2e291f] rounded-xl ring ring-[#bdb9b2] focus:outline-none focus:ring-2 w-full py-3 px-4"
            />
          </div>

          {/* Sign In Button */}
          <button className="bg-amber-800 w-full py-3 text-white rounded-full">
            Sign In
          </button>
        </div>

        {/* Divider Text */}
        <div className="flex flex-col items-center text-sm text-[#5C4F3B] gap-1">
          <span>
            Don’t have an account?{" "}
            <span className="text-orange-400 cursor-pointer">Sign Up</span>
          </span>
          <span className="cursor-pointer">Forgot your password?</span>
          <span className="text-sm text-[#aaa]">— or —</span>
        </div>

        {/* Social Login (just placeholder inputs for now) */}
        <div className="flex flex-col w-full gap-4">
          <input
            type="button"
            value="Sign In with Google"
            className="bg-white text-[#5C4F3B] placeholder-[#948A7A] rounded-xl ring ring-[#bdb9b2] px-4 py-3 text-center cursor-pointer"
          />
          <input
            type="button"
            value="Sign In with Apple"
            className="bg-white text-[#5C4F3B] placeholder-[#948A7A] rounded-xl ring ring-[#bdb9b2] px-4 py-3 text-center cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
