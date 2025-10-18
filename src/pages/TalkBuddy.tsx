import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic } from "lucide-react";

const TalkBuddy = () => {
  return (
    <div className="min-h-screen gradient-pastel p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="shadow-gentle">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-3xl">Talk Buddy</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Talk mode coming soon...</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default TalkBuddy;
