import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Headphones, Play, Pause, Volume2, ArrowLeft, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ListenBuddy = () => {
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
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [conversation, setConversation] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [words, setWords] = useState<string[]>([]);
  const [userResponse, setUserResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [correctionTip, setCorrectionTip] = useState("");
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

      // Auto-play if voice mode
      if (mode === "voice") {
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(generatedConversation);
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
          };

          speechSynthesis.speak(utterance);
          setIsPlaying(true);
        }, 500);
      }
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

  const toggleListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserResponse(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      if (isListening) {
        recognition.stop();
        setIsListening(false);
      } else {
        recognition.start();
        setIsListening(true);
      }
    } else {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
    }
  };

  const handleUserSubmit = async () => {
    if (!userResponse.trim()) {
      toast({
        title: "Empty response",
        description: "Please type or speak your response",
        variant: "destructive",
      });
      return;
    }

    const userResponseText = `\n\nYou: ${userResponse}`;
    setConversation(prev => prev + userResponseText);
    const currentInput = userResponse;
    setUserResponse("");
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('listen-buddy-respond', {
        body: { 
          conversation: conversation,
          userResponse: currentInput
        }
      });

      if (error) {
        console.error("Function error:", error);
        throw error;
      }

      const aiResponse = data.response;
      const correction = data.correction || "";
      const buddyMessage = `\n\nBuddy: ${aiResponse}`;
      setConversation(prev => prev + buddyMessage);
      setWords((prev) => [...prev, ...aiResponse.split(/\s+/)]);
      
      if (correction) {
        setCorrectionTip(correction);
      }
      
      if (mode === "voice") {
        const utterance = new SpeechSynthesisUtterance(aiResponse);
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }

      toast({
        title: "Response received",
        description: "Buddy responded to your message",
      });
    } catch (error) {
      console.error("Error generating response:", error);
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
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
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="shadow-gentle">
                  <CardHeader>
                    <CardTitle className="text-xl">Conversation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none max-h-96 overflow-y-auto">
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

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card className="shadow-gentle">
                  <CardHeader>
                    <CardTitle className="text-xl">Your Turn to Speak</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your response or use voice input..."
                        value={userResponse}
                        onChange={(e) => setUserResponse(e.target.value)}
                        className="flex-1"
                        rows={3}
                      />
                      <Button
                        variant={isListening ? "destructive" : "outline"}
                        size="icon"
                        onClick={toggleListening}
                        disabled={isPlaying || isGenerating}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button 
                      onClick={handleUserSubmit} 
                      disabled={isGenerating || !userResponse.trim() || isPlaying}
                      className="w-full"
                    >
                      {isGenerating ? "Generating AI Response..." : "Send Response"}
                    </Button>
                    {correctionTip && (
                      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          💡 <span className="font-medium">Tip:</span> {correctionTip}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ListenBuddy;
