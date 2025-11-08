import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mic, Headphones, BookOpen, Settings, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UsageDisplay } from "@/components/UsageDisplay";

const buddyModes = [
  {
    id: "chat",
    title: "Chat Buddy",
    emoji: "🗨️",
    description: "Practice writing and get real-time feedback",
    icon: MessageCircle,
    route: "/chatbuddy",
    gradient: "from-blue-400/20 to-cyan-400/20",
    iconBg: "bg-blue-500",
  },
  {
    id: "talk",
    title: "Talk Buddy",
    emoji: "🗣️",
    description: "Have voice conversations and improve speaking",
    icon: Mic,
    route: "/talkbuddy",
    gradient: "from-purple-400/20 to-pink-400/20",
    iconBg: "bg-purple-500",
  },
  {
    id: "listen",
    title: "Listen Buddy",
    emoji: "🎧",
    description: "Enhance comprehension with AI-generated content",
    icon: Headphones,
    route: "/listenbuddy",
    gradient: "from-green-400/20 to-teal-400/20",
    iconBg: "bg-green-500",
  },
  {
    id: "read",
    title: "Read Buddy",
    emoji: "📖",
    description: "Read advanced English with pronunciation help",
    icon: BookOpen,
    route: "/readbuddy",
    gradient: "from-orange-400/20 to-yellow-400/20",
    iconBg: "bg-orange-500",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen gradient-soft-blue p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with navigation buttons */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-end gap-2 sm:gap-3 mb-6"
        >
          <Button
            variant="outline"
            onClick={() => navigate("/profile")}
            className="gap-2 text-sm sm:text-base"
            size="sm"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/settings")}
            className="gap-2 text-sm sm:text-base"
            size="sm"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </motion.div>

        {/* Usage Display */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <UsageDisplay />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-4">
            Choose Your Buddy Mode
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg px-4">
            Select how you'd like to practice English today
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {buddyModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(mode.route)}
              className="cursor-pointer"
            >
              <Card className={`shadow-gentle hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${mode.gradient} border-2 hover:border-primary/50 h-full`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 rounded-2xl ${mode.iconBg}`}
                    >
                      <mode.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-2xl">{mode.title}</CardTitle>
                        <span className="text-2xl">{mode.emoji}</span>
                      </div>
                      <CardDescription className="text-base">
                        {mode.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-primary font-medium">
                    Click to start practicing
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="ml-2"
                    >
                      →
                    </motion.span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
