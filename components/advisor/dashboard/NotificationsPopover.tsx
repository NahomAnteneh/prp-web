"use client";

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationsPopoverProps {
  count?: number;
}

export default function NotificationsPopover({ count = 0 }: NotificationsPopoverProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/recent');
      const data = await response.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId?: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          markAll: !notificationId,
        }),
      });
      
      if (response.ok) {
        if (notificationId) {
          setNotifications(notifications.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          ));
        } else {
          setNotifications(notifications.map(n => ({ ...n, read: true })));
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {count > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-medium text-sm">Notifications</h3>
          {notifications.some(n => !n.read) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => markAsRead()}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner className="h-6 w-6" />
            </div>
          ) : notifications.length > 0 ? (
            <ul className="divide-y">
              {notifications.map((notification) => (
                <li 
                  key={notification.id} 
                  className={cn(
                    "px-4 py-3 hover:bg-gray-50 transition-colors",
                    !notification.read && "bg-blue-50"
                  )}
                >
                  <a 
                    href={notification.link || '#'} 
                    className="block"
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      setOpen(false);
                    }}
                  >
                    <div className="text-sm">{notification.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No notifications
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 