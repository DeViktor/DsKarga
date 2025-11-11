import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { recentActivities } from "@/lib/data";


export function RecentActivities() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Atividades Recentes</CardTitle>
        <CardDescription>Uma visão geral das ações recentes no sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recentActivities.map((activity) => (
             <div key={activity.id} className="flex items-center">
             <Avatar className="h-9 w-9">
               <AvatarImage src={`https://picsum.photos/seed/${activity.id}/40/40`} alt="Avatar" />
               <AvatarFallback>{activity.avatar}</AvatarFallback>
             </Avatar>
             <div className="ml-4 space-y-1">
               <p className="text-sm font-medium leading-none">
                <span className="font-semibold">{activity.user}</span> {activity.action} <span className="font-semibold text-primary">{activity.target}</span>.
               </p>
               <p className="text-sm text-muted-foreground">{activity.time}</p>
             </div>
           </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
