import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, ArrowLeft, MessageCircle, Mic, Headphones, BookOpen, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Session {
  id: string;
  type: "chat" | "talk" | "listen" | "read";
  date: string;
  duration?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserEmail(user.email || "");
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "User");
      setEditName(user.user_metadata?.full_name || user.email?.split('@')[0] || "");

      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error loading sessions:", error);
        return;
      }

      const formattedSessions: Session[] = data.map(session => ({
        id: session.id,
        type: session.buddy_type as "chat" | "talk" | "listen" | "read",
        date: session.created_at,
        duration: session.ended_at 
          ? `${Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000)} min`
          : undefined
      }));

      setSessions(formattedSessions);
    };

    loadUserData();
  }, [navigate]);

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.auth.updateUser({
        data: { full_name: editName }
      });

      if (error) throw error;

      setUserName(editName);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case "chat":
        return <MessageCircle className="w-4 h-4" />;
      case "talk":
        return <Mic className="w-4 h-4" />;
      case "listen":
        return <Headphones className="w-4 h-4" />;
      case "read":
        return <BookOpen className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getSessionLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1) + " Buddy";
  };

  return (
    <div className="min-h-screen gradient-pastel p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Profile Info Card */}
          <Card className="shadow-gentle">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-2xl">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{userName}</CardTitle>
                  <CardDescription>{userEmail}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} className="flex-1">
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(userName);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="destructive" onClick={handleLogout} className="w-full">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sessions History Card */}
          <Card className="shadow-gentle">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Your learning journey with LingoBuddy</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No sessions yet. Start practicing to see your progress!
                  </p>
                  <Button onClick={() => navigate("/dashboard")}>
                    Start Learning
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 10).map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {getSessionIcon(session.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{getSessionLabel(session.type)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.date).toLocaleDateString()} • {session.duration || "Session completed"}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
