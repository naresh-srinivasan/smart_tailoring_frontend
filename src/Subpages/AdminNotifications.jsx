import React, { useEffect, useState } from "react";
import api, { errorMessage } from "../api";
import { Alert, Badge, Button, DataTable, PageHeader } from "../Components/Admin/ui";

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/notifications");
        setNotifications(res.data.notifications || []);
      } catch (err) {
        setError(errorMessage(err, "Failed to load notifications."));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      setError(errorMessage(err, "Could not mark as read."));
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(errorMessage(err, "Could not delete notification."));
    }
  };

  const unread = notifications.filter((n) => !n.read).length;

  const columns = [
    { key: "title", label: "Title", sortable: true, render: (n) => <span className={n.read ? "text-gray-600" : "font-semibold text-gray-900"}>{n.title}</span> },
    { key: "message", label: "Message", className: "max-w-md" },
    { key: "createdAt", label: "Received", sortable: true, render: (n) => formatDateTime(n.createdAt) },
    {
      key: "read", label: "Status", sortable: true, sortValue: (n) => (n.read ? 1 : 0),
      render: (n) => <Badge color={n.read ? "gray" : "blue"}>{n.read ? "Read" : "Unread"}</Badge>,
    },
    {
      key: "actions", label: "Actions", align: "right",
      render: (n) => (
        <div className="flex justify-end gap-1.5">
          {!n.read && <Button size="sm" onClick={() => markAsRead(n.id)}>Mark read</Button>}
          <Button size="sm" variant="danger" onClick={() => remove(n.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Notifications" subtitle={`${unread} unread of ${notifications.length}`} />
      <Alert type="error" onClose={() => setError("")}>{error}</Alert>
      <DataTable columns={columns} rows={notifications} loading={loading} emptyText="You're all caught up" defaultSort={{ key: "createdAt", dir: "desc" }} />
    </div>
  );
}
