import React from "react";
import { motion } from "framer-motion"; // 👈 for smooth transitions
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

const DialogDemo = () => {
  const navigate = useNavigate();

  const handleYes = () => navigate("/InaphPage");
  const handleNo = () => navigate("/signup");

  return (
    <div className="relative w-screen h-screen flex flex-col justify-center items-center overflow-hidden text-center">
      {/* 🔹 Fullscreen Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover opacity-70 blur-sm -z-10"
        src="/cow_video.mp4"
      ></video>

      {/* 🔹 Dark Overlay */}
      <div className="absolute inset-0 bg-black/50 -z-10"></div>

      {/* 🔹 Smooth Fade-in & Slide-up Animation for Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-white max-w-3xl px-6"
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
          Welcome to Livestock
        </h1>
        <p className="text-lg md:text-xl text-gray-200 drop-shadow-md leading-relaxed">
          We’d like to take a minute of your time to know whether you already
          have an account on INAPH or not. Please press the button below to
          continue.
        </p>
      </motion.div>

      {/* 🔹 Smooth Fade-in for Button Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-10"
      >
        <Dialog>
          {/* Trigger Button */}
          <DialogTrigger asChild>
            <Button className="px-8 py-4 text-lg font-semibold shadow-lg rounded-full bg-[#fbbf24] text-black hover:bg-[#f59e0b] transition">
              Press the Button
            </Button>
          </DialogTrigger>

          {/* Dialog Box */}
          <DialogContent className="sm:max-w-[380px] bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-6 border border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-center text-gray-900">
                Do you already have an account with INAPH?
              </DialogTitle>
              <DialogDescription className="text-center text-gray-600 mt-2">
                Please confirm to continue to the next step.
              </DialogDescription>
            </DialogHeader>

            {/* Buttons */}
            <div className="flex justify-center gap-4 mt-6">
              <Button
                onClick={handleYes}
                className="px-6 py-2 rounded-lg bg-[#fbbf24] text-black font-medium hover:bg-[#f59e0b] shadow-md transition"
              >
                Yes, I have
              </Button>
              <Button
                onClick={handleNo}
                className="px-6 py-2 rounded-lg bg-[#fbbf24] text-black font-medium hover:bg-[#f59e0b] shadow-md transition"
              >
                No, create my account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default DialogDemo;
