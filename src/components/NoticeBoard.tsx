
import React from 'react';
import { Bell, Calendar, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Notice {
  id: number;
  title: string;
  type: 'academic' | 'facility' | 'registration' | 'general';
  date: string;
  urgent: boolean;
}

interface NoticeBoardProps {
  notices: Notice[];
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({ notices }) => {
  const getNoticeIcon = (type: string) => {
    switch (type) {
      case 'academic':
        return Bell;
      case 'facility':
        return Info;
      case 'registration':
        return Calendar;
      default:
        return Info;
    }
  };

  const getNoticeColor = (type: string) => {
    switch (type) {
      case 'academic':
        return 'default';
      case 'facility':
        return 'secondary';
      case 'registration':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const urgentNotices = notices.filter(notice => notice.urgent);
  const regularNotices = notices.filter(notice => !notice.urgent);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notice Board</h2>
        <p className="text-muted-foreground">Stay updated with important announcements</p>
      </div>

      {/* Urgent Notices */}
      {urgentNotices.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-destructive">Urgent Notices</h3>
          {urgentNotices.map((notice) => {
            const Icon = getNoticeIcon(notice.type);
            return (
              <Alert key={notice.id} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  <span>{notice.title}</span>
                  <Badge variant={getNoticeColor(notice.type) as any}>
                    {notice.type}
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  Posted on {notice.date}
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Regular Notices */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Notices</h3>
        <div className="grid gap-4">
          {regularNotices.map((notice) => {
            const Icon = getNoticeIcon(notice.type);
            return (
              <Card key={notice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{notice.title}</h3>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Posted on {notice.date}
                      </div>
                    </div>
                    
                    <Badge variant={getNoticeColor(notice.type) as any}>
                      {notice.type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Notice Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Notice Categories</CardTitle>
          <CardDescription>Filter notices by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['academic', 'facility', 'registration', 'general'].map((category) => {
              const count = notices.filter(n => n.type === category).length;
              const Icon = getNoticeIcon(category);
              
              return (
                <div key={category} className="p-4 border rounded-lg text-center hover:bg-muted/50 cursor-pointer transition-colors">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium capitalize">{category}</h4>
                  <p className="text-sm text-muted-foreground">{count} notices</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
