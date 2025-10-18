import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

const stories = [
  {
    title: "Welcome to Your English Journey",
    content: "Learning English can be challenging, but it doesn't have to be lonely or boring. LingoBuddy is here to make your journey engaging, supportive, and fun.",
  },
  {
    title: "The Real Struggles",
    content: "We know the challenges: fear of making mistakes, lack of practice partners, and feeling judged. Traditional learning can feel cold and intimidating.",
  },
  {
    title: "Why We Created LingoBuddy",
    content: "We believe everyone deserves a patient, friendly companion to practice with. A buddy who never judges, always encourages, and makes learning feel natural.",
  },
  {
    title: "You're Not Alone",
    content: "Thousands are on this journey with you. With LingoBuddy, you'll have a supportive companion every step of the way. Let's make English learning lovable together!",
  },
];

const Story = () => {
  const navigate = useNavigate();
  const [currentStory, setCurrentStory] = useState(0);

  const handleNext = () => {
    if (currentStory < stories.length - 1) {
      setCurrentStory(currentStory + 1);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen gradient-soft-blue flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="shadow-gentle border-border/50">
              <CardContent className="p-8 md:p-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    {stories[currentStory].title}
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                    {stories[currentStory].content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {stories.map((_, index) => (
                        <div
                          key={index}
                          className={`h-2 rounded-full transition-all ${
                            index === currentStory
                              ? "w-8 bg-primary"
                              : "w-2 bg-muted"
                          }`}
                        />
                      ))}
                    </div>

                    <Button onClick={handleNext} className="gap-2">
                      {currentStory < stories.length - 1 ? "Next" : "Get Started"}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Story;
