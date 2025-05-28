"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Bell, Clock, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Notification {
  id: string
  message: string
  read: boolean
  createdAt: Date | string
  link?: string
  type?: string
  entityId?: string
  content?: string
}

interface ApiResponse {
  notifications: Notification[]
  unreadCount: number
}

interface NotificationDropdownProps {
  unreadCount: number
  userId?: string
  onMarkAllAsRead: () => void
}

export default function NotificationDropdown({ unreadCount, userId, onMarkAllAsRead }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fix hydration issue
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!userId) {
      setError("User ID not available")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log(`Fetching notifications from: /api/users/${userId}/notifications`)
      console.log(`User ID:`, userId)
      console.log(`Full URL:`, `${window.location.origin}/api/users/${userId}/notifications`)
      const response = await fetch(`/api/users/${userId}/notifications`)

      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", errorText)
        throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as ApiResponse
      console.log("Fetched notifications:", data)

      // Transform dates from strings to Date objects
      const transformedNotifications = data.notifications.map((notification) => ({
        ...notification,
        createdAt: new Date(notification.createdAt),
      }))

      setNotifications(transformedNotifications)
    } catch (err) {
      console.error("Error fetching notifications:", err)
      setError(err instanceof Error ? err.message : "Failed to load notifications")
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (isOpen && isMounted) {
      fetchNotifications()
    }
  }, [isOpen, userId, isMounted])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const formatTimeAgo = (date: Date) => {
    if (!isMounted) return "" // Prevent hydration mismatch

    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!userId) {
      return
    }

    const unreadNotifications = notifications.filter((n) => !n.read)
    if (unreadNotifications.length === 0) {
      return
    }

    setIsLoading(true)

    try {
      console.log("Marking all as read for user:", userId)
      const response = await fetch(`/api/users/${userId}/notifications`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationIds: unreadNotifications.map((n) => n.id),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Mark all as read error:", errorText)
        throw new Error(`Failed to mark notifications as read: ${response.statusText}`)
      }

      // Call the parent component's handler to update the UI
      onMarkAllAsRead()

      // Update local state to show all as read
      setNotifications(notifications.map((n) => ({ ...n, read: true })))
    } catch (err) {
      console.error("Error marking notifications as read:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Mark individual notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    if (!userId) {
      return
    }

    try {
      console.log("Marking notification as read:", notificationId)
      const response = await fetch(`/api/users/${userId}/notifications`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Mark as read error:", errorText)
        throw new Error(`Failed to mark notification as read: ${response.statusText}`)
      }

      // Update local state
      setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))

      // Update unread count in UI
      if (notifications.find((n) => n.id === notificationId && !n.read)) {
        onMarkAllAsRead()
      }
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }

  const getNotificationTitle = (notification: Notification) => {
    return notification.type
      ? `${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}`
      : notification.message.split(" ").slice(0, 3).join(" ") + "..."
  }

  if (!isMounted) {
    return (
      <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1">
            <Badge variant="destructive" className="flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
              {unreadCount}
            </Badge>
          </span>
        )}
      </Button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification bell button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1">
            <Badge variant="destructive" className="flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
              {unreadCount}
            </Badge>
          </span>
        )}
      </Button>

      {/* Notification dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background rounded-md shadow-lg border z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={handleMarkAllAsRead}
              disabled={isLoading || unreadCount === 0}
            >
              Mark all as read
            </Button>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-sm text-destructive">
                <p>{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs h-8 mx-auto block"
                  onClick={fetchNotifications}
                >
                  Try again
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No notifications</div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`p-3 border-b hover:bg-muted/50 transition-colors ${
                      !notification.read ? "bg-accent/10" : ""
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={notification.link || "/notifications"}
                          onClick={() => {
                            setIsOpen(false)
                            if (!notification.read) {
                              handleMarkAsRead(notification.id)
                            }
                          }}
                        >
                          <p className="text-sm font-medium">{getNotificationTitle(notification)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                          <div className="flex items-center mt-1.5 text-xs">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {formatTimeAgo(notification.createdAt as Date)}
                            </span>
                          </div>
                        </Link>
                      </div>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1"></span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t">
            <Link
              href="/notifications"
              className="block text-center text-xs text-primary hover:underline p-1"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
              <ExternalLink className="inline-block ml-1 h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
