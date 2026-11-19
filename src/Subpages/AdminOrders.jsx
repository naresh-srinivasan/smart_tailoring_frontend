import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaStar } from "react-icons/fa";
import api, { errorMessage } from "../api";
import {
  Alert, Button, DataTable, Drawer, ORDER_STATUSES, Modal, PageHeader, SearchInput, StatusBadge, Toolbar,
  formatDate, formatINR, inputClass,
} from "../Components/Admin/ui";

// Real orders store `dress_type`; tolerate camelCase too.
const dressOf = (o) => o.items?.dress_type || o.items?.dressType || "";
const extrasOf = (o) => {
  const e = o.items?.extras;
  if (!e || (Array.isArray(e) && e.length === 0)) return "None";
  return Array.isArray(e) ? e.map((x) => x?.name || x).join(", ") : String(e);
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [detailsId, setDetailsId] = useState(null);
  const [otpDraft, setOtpDraft] = useState({}); // { [orderId]: string }
  const [awaitingOtp, setAwaitingOtp] = useState({}); // { [orderId]: true }
  const [feedback, setFeedback] = useState(null);
  const [customer, setCustomer] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDress, setFilterDress] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/orders/admin");
        setOrders(res.data.orders || []);
      } catch (err) {
        setError(errorMessage(err, "Failed to load orders."));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const dressTypes = useMemo(() => [...new Set(orders.map(dressOf).filter(Boolean))], [orders]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filterStatus && o.status !== filterStatus) return false;
      if (filterDress && dressOf(o) !== filterDress) return false;
      if (!q) return true;
      return [o.id, o.User?.name, o.User?.email, o.items?.material, o.items?.color].some((v) => v?.toString().toLowerCase().includes(q));
    });
  }, [orders, search, filterStatus, filterDress]);

  const updateStatus = async (order, status, otp = null) => {
    try {
      const res = await api.put(`/orders/${order.id}/status`, { status, otp });
      const updated = res.data.order;
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated, User: o.User } : o)));
      setAwaitingOtp((p) => ({ ...p, [order.id]: false }));
      setOtpDraft((p) => ({ ...p, [order.id]: "" }));
      setSuccess(`Order #${order.id} is now "${status}".`);
    } catch (err) {
      setError(errorMessage(err, "Failed to update status."));
      setAwaitingOtp((p) => ({ ...p, [order.id]: false }));
    }
  };

  const onStatusSelect = (order, status) => {
    if (status === "Delivered") setAwaitingOtp((p) => ({ ...p, [order.id]: true }));
    else updateStatus(order, status);
  };

  const downloadInvoice = (order) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Order Invoice", 105, 20, null, null, "center");
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    let y = 32;
    const line = (t) => { doc.text(t, 20, y); y += 8; };
    line(`Order ID: ${order.id}`);
    line(`Customer: ${order.User?.name || "N/A"}`);
    line(`Status: ${order.status}`);
    if (order.status === "Cancelled" && order.cancelReason) line(`Cancel Reason: ${order.cancelReason}`);
    line(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    line(`Total Amount: Rs. ${order.totalAmount}`);

    const measurements = Object.entries(order.items?.measurements || {}).map(([k, v]) => [k.replace(/_/g, " "), String(v)]);
    if (measurements.length) {
      autoTable(doc, {
        startY: y + 4,
        head: [["Measurement", "Value"]],
        body: measurements,
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
        styles: { cellPadding: 3, fontSize: 11 },
      });
    }
    doc.save(`Order_${order.id}_Invoice.pdf`);
  };

  const columns = [
    { key: "id", label: "Order", sortable: true, render: (o) => <span className="font-medium text-gray-900">#{o.id}</span> },
    { key: "customer", label: "Customer", sortable: true, sortValue: (o) => o.User?.name || "", render: (o) => o.User?.name || "Unknown" },
    { key: "createdAt", label: "Date", sortable: true, render: (o) => formatDate(o.createdAt) },
    { key: "dress", label: "Dress", sortable: true, sortValue: dressOf, render: (o) => dressOf(o) || "-" },
    { key: "material", label: "Material", sortable: true, sortValue: (o) => o.items?.material || "", render: (o) => o.items?.material || "-" },
    { key: "totalAmount", label: "Amount", sortable: true, align: "right", render: (o) => formatINR(o.totalAmount) },
    {
      key: "status", label: "Status", sortable: true,
      render: (o) => (awaitingOtp[o.id] ? <span className="text-xs text-amber-700">Awaiting OTP</span> : <StatusBadge status={o.status} />),
    },
    {
      key: "actions", label: "Actions", align: "right",
      render: (o) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="link" onClick={() => setDetailsId(o.id)}>Details</Button>
          <Button size="sm" onClick={() => downloadInvoice(o)}>PDF</Button>
          <Button size="sm" onClick={() => setCustomer(o)}>Customer</Button>
          {o.feedback_text && (
            <Button size="sm" onClick={() => setFeedback(o)}>Feedback</Button>
          )}
        </div>
      ),
    },
  ];

  const detailsOrder = orders.find((o) => o.id === detailsId) || null;

  const Section = ({ title, children }) => (
    <section className="pb-4 mb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{title}</h4>
      {children}
    </section>
  );
  const Row = ({ label, children, bold }) => (
    <div className={`flex justify-between gap-4 text-sm py-0.5 ${bold ? "font-semibold text-gray-900" : ""}`}>
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );

  const renderDetails = (o) => {
    const measurements = Object.entries(o.items?.measurements || {});
    const needsOtp = (awaitingOtp[o.id] || o.status === "Delivered") && o.delivery_otp;
    return (
      <>
        <Section title="Order">
          <dl>
            <Row label="Date">{formatDate(o.createdAt)}</Row>
            <Row label="Dress">{dressOf(o) || "-"}</Row>
            <Row label="Material">{o.items?.material || "-"}</Row>
            <Row label="Colour">{o.items?.color || "-"}</Row>
            <Row label="Pattern">{o.items?.pattern || "-"}</Row>
            <Row label="Extras">{extrasOf(o)}</Row>
            <Row label="Total" bold>{formatINR(o.totalAmount)}</Row>
          </dl>
        </Section>

        <Section title="Customer">
          <dl>
            <Row label="Name">{o.User?.name || "-"}</Row>
            <Row label="Email">{o.User?.email || "-"}</Row>
            <Row label="Phone">{o.User?.phone || "-"}</Row>
            <Row label="Address">{o.delivery_address || o.User?.address || "-"}</Row>
          </dl>
        </Section>

        <Section title="Status">
          {o.status === "Cancelled" ? (
            <p className="text-sm text-red-700">Cancelled{o.cancelReason ? `: ${o.cancelReason}` : ""}</p>
          ) : (
            <div className="space-y-2">
              <select
                className={inputClass}
                value={awaitingOtp[o.id] ? "Delivered" : o.status}
                onChange={(e) => onStatusSelect(o, e.target.value)}
              >
                {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              {needsOtp && (
                <div className="space-y-2">
                  <input
                    className={inputClass}
                    placeholder="Delivery OTP from the customer"
                    value={otpDraft[o.id] || ""}
                    onChange={(e) => setOtpDraft((p) => ({ ...p, [o.id]: e.target.value }))}
                  />
                  <Button variant="success" className="w-full" disabled={!otpDraft[o.id]} onClick={() => updateStatus(o, "Delivered", otpDraft[o.id])}>
                    Confirm delivery
                  </Button>
                </div>
              )}
            </div>
          )}
        </Section>

        <Section title="Measurements">
          {measurements.length === 0 ? (
            <p className="text-sm text-gray-400">None recorded</p>
          ) : (
            <dl>
              {measurements.map(([k, v]) => (
                <Row key={k} label={k.replace(/_/g, " ")}>{typeof v === "object" ? JSON.stringify(v) : String(v)}</Row>
              ))}
            </dl>
          )}
        </Section>

        {o.feedback_text && (
          <Section title="Customer feedback">
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className={`w-3.5 h-3.5 ${i < (o.feedback_rating || 0) ? "text-yellow-400" : "text-gray-300"}`} />
              ))}
            </div>
            <p className="text-sm text-gray-700">{o.feedback_text}</p>
          </Section>
        )}
      </>
    );
  };

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${rows.length} of ${orders.length} orders`} />
      <Alert type="error" onClose={() => setError("")}>{error}</Alert>
      <Alert type="success">{success}</Alert>
      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search order, customer, material" />
        <select className={`${inputClass} !w-auto`} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={`${inputClass} !w-auto`} value={filterDress} onChange={(e) => setFilterDress(e.target.value)}>
          <option value="">All dress types</option>
          {dressTypes.map((d) => <option key={d}>{d}</option>)}
        </select>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="No orders match your filters"
        defaultSort={{ key: "createdAt", dir: "desc" }}
      />

      <Drawer
        open={!!detailsOrder}
        onClose={() => setDetailsId(null)}
        title={detailsOrder ? `Order #${detailsOrder.id}` : ""}
        subtitle={detailsOrder ? `${detailsOrder.User?.name || "Customer"} - ${formatDate(detailsOrder.createdAt)}` : ""}
        footer={detailsOrder && <Button onClick={() => downloadInvoice(detailsOrder)}>Download invoice (PDF)</Button>}
      >
        {detailsOrder && renderDetails(detailsOrder)}
      </Drawer>

      <Modal open={!!feedback} onClose={() => setFeedback(null)} title="Customer feedback" size="sm" footer={<Button onClick={() => setFeedback(null)}>Close</Button>}>
        {feedback && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className={`w-4 h-4 ${i < (feedback.feedback_rating || 0) ? "text-yellow-400" : "text-gray-300"}`} />
              ))}
              <span className="ml-1 text-gray-500">({feedback.feedback_rating || 0}/5)</span>
            </div>
            <p className="text-gray-700">{feedback.feedback_text}</p>
          </div>
        )}
      </Modal>

      <Modal open={!!customer} onClose={() => setCustomer(null)} title="Customer details" size="sm" footer={<Button onClick={() => setCustomer(null)}>Close</Button>}>
        {customer && (
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500 text-xs">Name</dt><dd>{customer.User?.name || "N/A"}</dd></div>
            <div><dt className="text-gray-500 text-xs">Email</dt><dd>{customer.User?.email || "N/A"}</dd></div>
            <div><dt className="text-gray-500 text-xs">Phone</dt><dd>{customer.User?.phone || "N/A"}</dd></div>
            <div><dt className="text-gray-500 text-xs">Delivery address</dt><dd>{customer.delivery_address || customer.User?.address || "N/A"}</dd></div>
          </dl>
        )}
      </Modal>
    </div>
  );
}
