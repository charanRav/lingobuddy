import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headphones } from "lucide-react";

const ListenBuddy = () => {
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-3xl">Listen Buddy</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Listen mode coming soon...</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ListenBuddy;
