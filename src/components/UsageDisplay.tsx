import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, AlertTriangle } from "lucide-react";

export const UsageDisplay = () => {
  const [usage, setUsage] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check and show notifications based on usage
  const checkAndNotify = (currentUsage: number) => {
    const today = new Date().toDateString();
    const notificationKey = `usage-notifications-${today}`;
    const notifications = JSON.parse(localStorage.getItem(notificationKey) || '{"shown80": false, "shown100": false}');

    // 80% limit notification (40 conversations)
    if (currentUsage >= 40 && currentUsage < 50 && !notifications.shown80) {
      toast({
        title: "⚠️ Usage Warning",
        description: "You've used 40 out of 50 daily conversations (80%). Only 10 remaining!",
        variant: "default",
        duration: 6000,
      });
      notifications.shown80 = true;
      localStorage.setItem(notificationKey, JSON.stringify(notifications));
    }

    // 100% limit notification (50 conversations)
    if (currentUsage >= 50 && !notifications.shown100) {
      toast({
        title: "🚫 Daily Limit Reached",
        description: "You've used all 50 daily conversations. Your limit will reset at midnight.",
        variant: "destructive",
        duration: 8000,
      });
      notifications.shown100 = true;
      localStorage.setItem(notificationKey, JSON.stringify(notifications));
    }
  };

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get today's usage from daily_usage table
        const { data, error } = await supabase
          .from('daily_usage' as any)
          .select('chat_count, talk_count, listen_count, read_count')
          .eq('user_id', user.id)
          .eq('usage_date', new Date().toISOString().split('T')[0])
          .maybeSingle();

        if (!error && data) {
          const total = ((data as any).chat_count || 0) + ((data as any).talk_count || 0) + 
                       ((data as any).listen_count || 0) + ((data as any).read_count || 0);
          setUsage(total);
          checkAndNotify(total);
        } else {
          setUsage(0);
        }
      } catch (error) {
        console.error("Error fetching usage:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
    
    // Clean up old notification states on mount
    const today = new Date().toDateString();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('usage-notifications-') && !key.includes(today)) {
        localStorage.removeItem(key);
      }
    }
    
    // Refresh usage every 10 seconds for real-time updates
    const interval = setInterval(fetchUsage, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  const remaining = Math.max(0, 50 - usage);
  const percentage = (usage / 50) * 100;
  
  // Determine color based on usage
  const getStatusColor = () => {
    if (usage >= 50) return "text-destructive";
    if (usage >= 40) return "text-orange-500";
    return "text-muted-foreground";
  };

  const getProgressColor = () => {
    if (usage >= 50) return "bg-destructive";
    if (usage >= 40) return "bg-orange-500";
    return "";
  };

  return (
    <Card className="p-4 bg-secondary/30">
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Daily Conversations</span>
            {usage >= 50 && <AlertCircle className="w-4 h-4 text-destructive" />}
            {usage >= 40 && usage < 50 && <AlertTriangle className="w-4 h-4 text-orange-500" />}
          </div>
          <span className={getStatusColor()}>
            {remaining} / 50 remaining
          </span>
        </div>
        <Progress value={percentage} className={`h-2 ${getProgressColor()}`} />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Resets at midnight
          </p>
          {usage >= 40 && (
            <p className="text-xs font-medium text-orange-500">
              {usage >= 50 ? "Limit reached" : "Approaching limit"}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
