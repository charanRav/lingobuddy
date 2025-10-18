import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Mic, Headphones, BookOpen } from "lucide-react";

const buddyModes = [
  {
    id: "chat",
    title: "Chat Buddy",
    description: "Practice writing and get real-time feedback",
    icon: MessageCircle,
    route: "/chatbuddy",
    gradient: "from-blue-400 to-blue-600",
  },
  {
    id: "talk",
    title: "Talk Buddy",
    description: "Have voice conversations and improve speaking",
    icon: Mic,
    route: "/talkbuddy",
    gradient: "from-purple-400 to-purple-600",
  },
  {
    id: "listen",
    title: "Listen Buddy",
    description: "Enhance comprehension with AI-generated content",
    icon: Headphones,
    route: "/listenbuddy",
    gradient: "from-green-400 to-green-600",
  },
  {
    id: "read",
    title: "Read Buddy",
    description: "Read advanced English with pronunciation help",
    icon: BookOpen,
    route: "/readbuddy",
    gradient: "from-orange-400 to-orange-600",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-pastel p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose Your Buddy Mode
          </h1>
          <p className="text-muted-foreground text-lg">
            Select how you'd like to practice English today
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {buddyModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(mode.route)}
              className="cursor-pointer"
            >
              <Card className="h-full shadow-soft hover:shadow-gentle transition-all border-border/50">
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center mb-4`}>
                    <mode.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{mode.title}</CardTitle>
                  <CardDescription className="text-base">
                    {mode.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Click to start practicing →
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
