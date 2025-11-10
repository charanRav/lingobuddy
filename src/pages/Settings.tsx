import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Moon, Sun, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [personalityTone, setPersonalityTone] = useState(() => 
    localStorage.getItem("buddyPersonality") || "friendly"
  );
  const [accentPreference, setAccentPreference] = useState(() =>
    localStorage.getItem("accentPreference") || "us"
  );

  useEffect(() => {
    setMounted(true);
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
    };
    checkAuth();
  }, [navigate]);

  const handlePersonalityChange = (value: string) => {
    setPersonalityTone(value);
    localStorage.setItem("buddyPersonality", value);
  };

  const handleAccentChange = (value: string) => {
    setAccentPreference(value);
    localStorage.setItem("accentPreference", value);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-pastel p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="shadow-gentle">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <SettingsIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl">Settings</CardTitle>
                  <CardDescription>Customize your LingoBuddy experience</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Toggle */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Appearance</h3>
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? (
                      <Moon className="w-5 h-5" />
                    ) : (
                      <Sun className="w-5 h-5" />
                    )}
                    <div>
                      <Label htmlFor="dark-mode" className="cursor-pointer">
                        Dark Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Switch between light and dark theme
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  />
                </div>
              </div>

              {/* Buddy Personality */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Buddy Personality</h3>
                <div className="p-4 rounded-lg border bg-card">
                  <Label htmlFor="personality" className="mb-3 block">
                    Choose your buddy's tone
                  </Label>
                  <Select value={personalityTone} onValueChange={handlePersonalityChange}>
                    <SelectTrigger id="personality">
                      <SelectValue placeholder="Select personality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal - Professional and structured</SelectItem>
                      <SelectItem value="friendly">Friendly - Warm and supportive</SelectItem>
                      <SelectItem value="fun">Fun - Playful and energetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Voice Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Voice Preferences</h3>
                
                {/* Accent */}
                <div className="p-4 rounded-lg border bg-card">
                  <Label htmlFor="accent" className="mb-3 block">
                    Accent Preference
                  </Label>
                  <Select value={accentPreference} onValueChange={handleAccentChange}>
                    <SelectTrigger id="accent">
                      <SelectValue placeholder="Select accent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">🇺🇸 American English</SelectItem>
                      <SelectItem value="uk">🇬🇧 British English</SelectItem>
                      <SelectItem value="au">🇦🇺 Australian English</SelectItem>
                      <SelectItem value="in">🇮🇳 Indian English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
