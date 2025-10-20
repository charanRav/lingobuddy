import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const Splash = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => navigate("/auth"), 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen gradient-soft-blue flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        <motion.div className="relative">
          <motion.img
            src={logo}
            alt="LingoBuddy"
            className="w-32 h-32 mx-auto mb-6 rounded-3xl shadow-gentle"
            animate={isLoading ? { 
              y: [0, -15, 0],
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            } : {}}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut",
              times: [0, 0.5, 1]
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl"
            animate={isLoading ? { 
              opacity: [0.3, 0.6, 0.3],
              scale: [0.9, 1.1, 0.9]
            } : {}}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl font-bold text-primary mb-2"
        >
          LingoBuddy 💬
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-muted-foreground text-lg"
        >
          Your friendly English companion
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-8 flex justify-center gap-2"
        >
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse-gentle" />
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse-gentle" style={{ animationDelay: "0.2s" }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse-gentle" style={{ animationDelay: "0.4s" }} />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Splash;
