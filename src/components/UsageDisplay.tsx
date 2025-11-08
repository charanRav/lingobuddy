import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const UsageDisplay = () => {
  const [usage, setUsage] = useState<number>(0);
  const [loading, setLoading] = useState(true);

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
    
    // Refresh usage every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  const remaining = Math.max(0, 50 - usage);
  const percentage = (usage / 50) * 100;

  return (
    <Card className="p-4 bg-secondary/30">
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">Daily Conversations</span>
          <span className="text-muted-foreground">
            {remaining} / 50 remaining
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground">
          Resets at midnight
        </p>
      </div>
    </Card>
  );
};
