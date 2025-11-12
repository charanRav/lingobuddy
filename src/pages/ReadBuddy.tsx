import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Volume2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ReadBuddy = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");

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
  const [content, setContent] = useState("");
  const [difficultWords, setDifficultWords] = useState<string[]>([]);
  const [highlightDifficult, setHighlightDifficult] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [wordDefinitions, setWordDefinitions] = useState<Record<string, string>>({});
  const [showingDefinition, setShowingDefinition] = useState<string | null>(null);
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

      // Handle if the response is a string that needs parsing
      let parsedData = data;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          // If it's not valid JSON, treat the whole string as content
          console.warn('Response is not JSON, using as plain content');
          parsedData = {
            content: data,
            difficultWords: [],
            definitions: {}
          };
        }
      }

      // Ensure we have the correct data structure
      const contentText = parsedData.content || parsedData.generatedText || '';
      const words = parsedData.difficultWords || parsedData.difficult_words || [];
      const defs = parsedData.definitions || {};

      setContent(contentText);
      setDifficultWords(words);
      setWordDefinitions(defs);

      toast({
        title: "Content Generated",
        description: "Click any word to hear and learn its meaning!",
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
    const cleanWord = word.replace(/[.,!?;:"'()]/g, '').toLowerCase();
    const savedSpeed = localStorage.getItem("pronunciationSpeed");
    const speed = savedSpeed ? parseFloat(savedSpeed) : 1.0;
    
    const utterance = new SpeechSynthesisUtterance(cleanWord);
    utterance.rate = speed;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
    
    // Show definition if available
    if (wordDefinitions[cleanWord]) {
      setShowingDefinition(cleanWord);
      setTimeout(() => setShowingDefinition(null), 3000);
    }
  };

  const renderContent = () => {
    if (!content) return null;

    // Split content by paragraphs (double newlines or single newlines)
    const paragraphs = content.split(/\n\n|\n/).filter(p => p.trim());
    
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, pIndex) => {
          const words = paragraph.split(/(\s+)/);
          
          return (
            <p key={pIndex} className="leading-relaxed text-base">
              {words.map((word, index) => {
                const cleanWord = word.replace(/[.,!?;:"'()]/g, '').toLowerCase();
                const isDifficult = difficultWords.includes(cleanWord);
                const isWord = /\w/.test(word);

                const definition = wordDefinitions[cleanWord];
                const isShowingDef = showingDefinition === cleanWord;

                return (
                  <span key={index} className="relative inline-block">
                    <span
                      onClick={() => isWord && speakWord(word)}
                      className={`
                        ${isWord ? 'cursor-pointer hover:bg-primary/10 rounded px-0.5 transition-colors' : ''}
                        ${highlightDifficult && isDifficult ? 'bg-yellow-200/50 dark:bg-yellow-900/30 font-semibold' : ''}
                      `}
                      title={isWord ? "Click to hear pronunciation" : ""}
                    >
                      {word}
                    </span>
                    {isShowingDef && definition && (
                      <motion.span
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg whitespace-nowrap z-10 border"
                      >
                        {definition}
                      </motion.span>
                    )}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen gradient-pastel p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

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
                      <span>Click any word to hear & learn</span>
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
