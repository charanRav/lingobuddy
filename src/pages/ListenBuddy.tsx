import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Headphones, Play, Pause, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ListenBuddy = () => {
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [conversation, setConversation] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [words, setWords] = useState<string[]>([]);
  const { toast } = useToast();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const generateConversation = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for the conversation",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('listen-buddy-generate', {
        body: { topic, mode }
      });

      if (error) throw error;

      const generatedConversation = data.conversation;
      setConversation(generatedConversation);
      
      // Extract words for highlighting
      const allWords = generatedConversation.split(/\s+/);
      setWords(allWords);

      toast({
        title: "Conversation Generated",
        description: "Ready to listen!",
      });
    } catch (error) {
      console.error('Error generating conversation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate conversation",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const playConversation = () => {
    if (mode === "voice") {
      if (isPlaying) {
        speechSynthesis.pause();
        setIsPlaying(false);
      } else {
        if (speechSynthesis.paused) {
          speechSynthesis.resume();
          setIsPlaying(true);
        } else {
          const utterance = new SpeechSynthesisUtterance(conversation);
          utteranceRef.current = utterance;
          
          utterance.rate = 0.9;
          utterance.pitch = 1;
          
          let wordCount = 0;
          utterance.onboundary = (event) => {
            if (event.name === 'word') {
              setCurrentWordIndex(wordCount);
              wordCount++;
            }
          };

          utterance.onend = () => {
            setIsPlaying(false);
            setCurrentWordIndex(-1);
          };

          utterance.onerror = () => {
            setIsPlaying(false);
            toast({
              title: "Playback Error",
              description: "Failed to play audio",
              variant: "destructive",
            });
          };

          speechSynthesis.speak(utterance);
          setIsPlaying(true);
        }
      }
    }
  };

  const stopPlayback = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentWordIndex(-1);
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-3xl">Listen Buddy</CardTitle>
              </div>
              <p className="text-muted-foreground mt-2">
                Choose a topic and listen to an engaging English conversation
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Topic Input */}
              <div className="space-y-2">
                <Label htmlFor="topic">Enter a Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Climate change, technology, sports..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isGenerating || isPlaying}
                />
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <Label>Choose Mode</Label>
                <RadioGroup value={mode} onValueChange={(value) => setMode(value as "chat" | "voice")} disabled={isGenerating || isPlaying}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="chat" id="chat" />
                    <Label htmlFor="chat" className="cursor-pointer">Chat Mode (Read)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="voice" id="voice" />
                    <Label htmlFor="voice" className="cursor-pointer">Voice Mode (Listen)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generateConversation}
                disabled={isGenerating || isPlaying}
                className="w-full"
                size="lg"
              >
                {isGenerating ? "Generating..." : "Generate Conversation"}
              </Button>

              {/* Voice Controls */}
              {conversation && mode === "voice" && (
                <div className="flex gap-2">
                  <Button
                    onClick={playConversation}
                    variant="secondary"
                    className="flex-1"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        {speechSynthesis.paused ? "Resume" : "Play Audio"}
                      </>
                    )}
                  </Button>
                  {isPlaying && (
                    <Button onClick={stopPlayback} variant="outline">
                      Stop
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Transcript Display */}
        <AnimatePresence>
          {conversation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="shadow-gentle">
                <CardHeader>
                  <CardTitle className="text-xl">Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    {mode === "voice" ? (
                      <p className="leading-relaxed text-base whitespace-pre-wrap">
                        {words.map((word, index) => (
                          <span
                            key={index}
                            className={`transition-colors duration-200 ${
                              index === currentWordIndex
                                ? "bg-primary/20 font-semibold"
                                : ""
                            }`}
                          >
                            {word}{" "}
                          </span>
                        ))}
                      </p>
                    ) : (
                      <p className="leading-relaxed text-base whitespace-pre-wrap">
                        {conversation}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ListenBuddy;
