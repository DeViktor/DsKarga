'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRecentActivities } from "@/hooks/use-activities";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { Loader2 } from "lucide-react";

function getActivityIcon(targetType: string) {
  const icons: { [key: string]: string } = {
    worker: "👷",
    service: "📋",
    client: "🏢",
    invoice: "🧾",
    payment: "💰",
    attendance: "📅",
    accident: "⚠️",
    epi: "🦺",
    purchasing: "🛒",
    accounting: "📊",
    supervision: "👁️",
    candidate: "👤",
  };
  return icons[targetType] || "📌";
}

function formatActivity(activity: any) {
  const timeAgo = formatDistanceToNow(activity.timestamp, { 
    addSuffix: true, 
    locale: pt 
  });

  return {
    ...activity,
    time: timeAgo,
    avatar: activity.userAvatar || activity.user.charAt(0).toUpperCase(),
    icon: getActivityIcon(activity.targetType),
  };
}

export function RecentActivities() {
  const { activities, loading } = useRecentActivities(10);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Atividades Recentes</CardTitle>
          <CardDescription>Carregando atividades...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Atividades Recentes</CardTitle>
          <CardDescription>Nenhuma atividade recente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>As atividades aparecerão aqui quando os usuários interagirem com o sistema.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Atividades Recentes</CardTitle>
        <CardDescription>Atividades em tempo real no sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((activity) => {
            const formatted = formatActivity(activity);
            return (
              <div key={activity.id} className="flex items-center">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{formatted.icon}</div>
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={`https://picsum.photos/seed/${activity.userId}/40/40`} 
                      alt={activity.user} 
                    />
                    <AvatarFallback>{formatted.avatar}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-4 space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">
                    <span className="font-semibold">{activity.user}</span> {activity.action} 
                    {activity.target && (
                      <span className="font-semibold text-primary">{activity.target}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatted.time}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {activity.targetType}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}