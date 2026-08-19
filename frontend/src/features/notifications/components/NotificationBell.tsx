import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Clock,
  Ticket,
  AlertTriangle,
  AlertOctagon,
  MessageSquare,
  UserCheck,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  useGetMyNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from '../notificationApi';
import { AppNotification, NotificationType } from '../types';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Poll unread count every 30s
  const { data: countData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000,
  });

  const { data: notificationsData, isLoading } = useGetMyNotificationsQuery(
    { page: 1, limit: 15 },
    { skip: !isOpen }
  );

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const unreadCount = countData?.data?.unreadCount || 0;
  const notifications = notificationsData?.data || [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id).unwrap();
      } catch (err) {
        // silent catch
      }
    }
    setIsOpen(false);
    navigate(notification.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (err) {
      // silent catch
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'sla_breached':
        return <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'sla_warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'assignment':
        return <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />;
      case 'comment_added':
      case 'requester_reply':
        return <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'ticket_resolved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      default:
        return <Ticket className="w-4 h-4 text-indigo-500 shrink-0" />;
    }
  };

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4.5 h-4.5 px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full border-2 border-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
          {/* Dropdown Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-100">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-1">
                <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No notifications yet</p>
                <p className="text-[11px] text-slate-400">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((item: AppNotification) => (
                <div
                  key={item._id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex gap-3 items-start transition cursor-pointer hover:bg-slate-50/80 ${
                    !item.isRead ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <div className="mt-0.5">{getNotificationIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          !item.isRead ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                      {item.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
