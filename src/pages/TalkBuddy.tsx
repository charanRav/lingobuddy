import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  correction?: string;
}

const TalkBuddy = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Recognized:", transcript);
        
        const userMessage: Message = { role: "user", content: transcript };
        setMessages(prev => [...prev, userMessage]);
        
        // Get AI response
        await getAIResponse(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          toast({
            title: "No speech detected",
            description: "Please try speaking again",
            variant: "destructive",
          });
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      toast({
        title: "Speech recognition not supported",
        description: "Please use Chrome or Safari",
        variant: "destructive",
      });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (sessionActive && timeRemaining > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            endSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionActive, timeRemaining]);

  const getAIResponse = async (userMessage: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('talk-buddy-chat', {
        body: { message: userMessage }
      });

      if (error) throw error;

      const aiResponse = data.message;
      
      // Extract correction if present
      const correctionMatch = aiResponse.match(/\[Tip: (.*?)\]/);
      const correction = correctionMatch ? correctionMatch[1] : undefined;
      const cleanMessage = aiResponse.replace(/\[Tip: .*?\]/g, '').trim();

      const assistantMessage: Message = {
        role: "assistant",
        content: cleanMessage,
        correction,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response
      speakText(cleanMessage);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to use a more natural voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.includes('en') && (voice.name.includes('Natural') || voice.name.includes('Premium'))
      ) || voices.find(voice => voice.lang.includes('en-US'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech recognition not available",
        description: "Please use a supported browser",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting recognition:", error);
      }
    }
  };

  const startSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to start a session",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("sessions")
      .insert({ user_id: user.id, buddy_type: "talk" })
      .select()
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return;
    }

    setSessionId(data.id);
    setSessionActive(true);
    setMessages([]);
    setTimeRemaining(30 * 60);
    
    toast({
      title: "Session started!",
      description: "You have 30 minutes. Tap the mic to start talking.",
    });
  };

  const endSession = async () => {
    if (sessionId) {
      await supabase
        .from("sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    setSessionActive(false);
    setIsListening(false);
    setSessionId(null);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    toast({
      title: "Session ended",
      description: `Great practice! You completed ${messages.filter(m => m.role === 'user').length} turns.`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen gradient-soft-blue p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header with Timer */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Talk Buddy 🗣️</h1>
          <p className="text-muted-foreground mb-4">Practice speaking English with AI</p>
          
          {sessionActive && (
            <div className="inline-block px-6 py-2 bg-primary/10 rounded-full">
              <span className="text-2xl font-bold text-primary">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </motion.div>

        {/* Conversation Area */}
        <Card className="shadow-gentle mb-6 min-h-[400px]">
          <CardContent className="p-6">
            {!sessionActive ? (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" onClick={startSession} className="text-lg px-8 py-6">
                    Start 30-Minute Session
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'} rounded-2xl px-4 py-3`}>
                        <p>{msg.content}</p>
                        {msg.correction && (
                          <p className="mt-2 text-sm opacity-80 border-t border-current/20 pt-2">
                            💡 Tip: {msg.correction}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isSpeaking && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Speaking...</span>
                  </motion.div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controls */}
        {sessionActive && (
          <div className="flex items-center justify-center gap-4">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                onClick={toggleListening}
                disabled={isSpeaking}
                className="rounded-full w-20 h-20"
              >
                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </Button>
            </motion.div>

            <Button variant="outline" onClick={endSession}>
              End Session
            </Button>
          </div>
        )}

        {sessionActive && (
          <p className="text-center text-muted-foreground text-sm mt-4">
            {isListening ? "🎤 Listening... Speak now" : isSpeaking ? "🔊 AI is speaking..." : "Tap the microphone to speak"}
          </p>
        )}
      </div>
    </div>
  );
};

export default TalkBuddy;
