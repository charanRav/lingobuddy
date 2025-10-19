import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ReadBuddy = () => {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [difficultWords, setDifficultWords] = useState<string[]>([]);
  const [highlightDifficult, setHighlightDifficult] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateContent = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for the reading content",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('read-buddy-generate', {
        body: { topic }
      });

      if (error) throw error;

      setContent(data.content);
      setDifficultWords(data.difficultWords);

      toast({
        title: "Content Generated",
        description: "Click any word to hear its pronunciation!",
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const speakWord = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  };

  const renderContent = () => {
    if (!content) return null;

    const words = content.split(/(\s+)/);
    
    return (
      <div className="leading-relaxed text-base">
        {words.map((word, index) => {
          const cleanWord = word.replace(/[.,!?;:"'()]/g, '').toLowerCase();
          const isDifficult = difficultWords.includes(cleanWord);
          const isWord = /\w/.test(word);

          return (
            <span
              key={index}
              onClick={() => isWord && speakWord(word)}
              className={`
                ${isWord ? 'cursor-pointer hover:bg-primary/10 rounded px-0.5 transition-colors' : ''}
                ${highlightDifficult && isDifficult ? 'bg-yellow-200/50 dark:bg-yellow-900/30 font-semibold' : ''}
              `}
              title={isWord ? "Click to hear pronunciation" : ""}
            >
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen gradient-pastel p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="shadow-gentle">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-3xl">Read Buddy</CardTitle>
              </div>
              <p className="text-muted-foreground mt-2">
                Generate advanced English reading material on any topic
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Topic Input */}
              <div className="space-y-2">
                <Label htmlFor="topic">Enter a Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Space exploration, artificial intelligence..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generateContent}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? "Generating..." : "Generate Reading Content"}
              </Button>

              {/* Highlight Toggle */}
              {content && (
                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="highlight-mode" className="cursor-pointer">
                      Highlight Difficult Words
                    </Label>
                  </div>
                  <Switch
                    id="highlight-mode"
                    checked={highlightDifficult}
                    onCheckedChange={setHighlightDifficult}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Display */}
        <AnimatePresence>
          {content && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="shadow-gentle">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Reading Material</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Volume2 className="w-4 h-4" />
                      <span>Click any word to hear it</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    {renderContent()}
                  </div>
                  
                  {difficultWords.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-sm font-semibold mb-3">
                        Advanced Vocabulary ({difficultWords.length} words)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {difficultWords.map((word, index) => (
                          <button
                            key={index}
                            onClick={() => speakWord(word)}
                            className="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded-full text-sm transition-colors flex items-center gap-1"
                          >
                            {word}
                            <Volume2 className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReadBuddy;
