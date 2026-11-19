// Shared building blocks for every admin page, so all pages share one look and one table.
import React, { useMemo, useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaSort, FaSortUp, FaSortDown, FaSearch, FaTimes } from "react-icons/fa";

/* ---------------- Form controls ---------------- */
export const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100";

const buttonVariants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 border-transparent",
  secondary: "bg-white text-gray-700 hover:bg-gray-50 border-gray-300",
  danger: "bg-white text-red-600 hover:bg-red-50 border-red-200",
  success: "bg-green-600 text-white hover:bg-green-700 border-transparent",
  link: "bg-transparent text-blue-600 hover:bg-blue-50 border-transparent",
};

export function Button({ variant = "secondary", size = "md", className = "", children, ...props }) {
  const sizes = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm";
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-md border transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed ${sizes} ${buttonVariants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, required, children, hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative w-full sm:w-64">
      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-8`}
      />
    </div>
  );
}

/* ---------------- Page chrome ---------------- */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b border-gray-200">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Toolbar({ children }) {
  return <div className="flex flex-wrap items-center gap-2 mb-3">{children}</div>;
}

export function Alert({ type = "error", children, onClose }) {
  if (!children) return null;
  const styles = {
    error: "bg-red-50 text-red-700 border-red-200",
    success: "bg-green-50 text-green-700 border-green-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <div className={`flex items-start justify-between gap-3 border rounded-md px-3 py-2 text-sm mb-3 ${styles[type]}`}>
      <span>{children}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
          <FaTimes className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

const badgeColors = {
  gray: "bg-gray-100 text-gray-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  orange: "bg-orange-100 text-orange-700",
};

export function Badge({ color = "gray", children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeColors[color]}`}>
      {children}
    </span>
  );
}

const orderStatusColor = {
  Pending: "amber",
  "Order Accepted": "blue",
  Shipped: "purple",
  "Out for Delivery": "orange",
  Delivered: "green",
  Cancelled: "red",
};

export const ORDER_STATUSES = Object.keys(orderStatusColor);

export function StatusBadge({ status }) {
  return <Badge color={orderStatusColor[status] || "gray"}>{status}</Badge>;
}

/* ---------------- Modal ---------------- */
export function Modal({ open, title, onClose, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const width = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" }[size];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40" onMouseDown={onClose}>
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${width} max-h-[90vh] flex flex-col`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Drawer: slides in from the right and overlaps the page ---------------- */
export function Drawer({ open, title, subtitle, onClose, children, footer, width = "max-w-md" }) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 250);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full ${width} bg-white shadow-xl flex flex-col
          transform transition-transform duration-300 ease-out ${shown ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 mt-0.5">
            <FaTimes />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50">{footer}</div>}
      </aside>
    </div>
  );
}

/* ---------------- DataTable ----------------
   columns: [{ key, label, sortable, align, render(row), sortValue(row), className }]
   One table for every admin list: sorting, pagination, empty/loading states, optional expandable rows. */
export function DataTable({
  columns,
  rows,
  rowKey = "id",
  loading = false,
  emptyText = "No records found",
  pageSize = 10,
  defaultSort,
  expandedKey = null,
  renderExpanded,
}) {
  const [sort, setSort] = useState(defaultSort || null); // { key, dir }
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    const val = (r) => (col?.sortValue ? col.sortValue(r) : r[sort.key]);
    return [...rows].sort((a, b) => {
      const x = val(a), y = val(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => { setPage(1); }, [rows.length]);

  const start = (page - 1) * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  const toggleSort = (col) => {
    if (!col.sortable) return;
    setSort((s) => (s?.key === col.key ? { key: col.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: col.key, dir: "asc" }));
  };

  const sortIcon = (col) => {
    if (!col.sortable) return null;
    if (sort?.key !== col.key) return <FaSort className="w-3 h-3 text-gray-300" />;
    return sort.dir === "asc" ? <FaSortUp className="w-3 h-3 text-blue-600" /> : <FaSortDown className="w-3 h-3 text-blue-600" />;
  };

  const align = (c) => (c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left");

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c)}
                  className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap ${align(c)} ${c.sortable ? "cursor-pointer select-none hover:text-gray-700" : ""}`}
                >
                  <span className="inline-flex items-center gap-1.5">{c.label}{sortIcon(c)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400">{emptyText}</td></tr>
            ) : (
              visible.map((row) => (
                <React.Fragment key={row[rowKey]}>
                  <tr className="hover:bg-gray-50">
                    {columns.map((c) => (
                      <td key={c.key} className={`px-4 py-2.5 text-gray-700 ${align(c)} ${c.className || ""}`}>
                        {c.render ? c.render(row) : row[c.key] ?? <span className="text-gray-300">-</span>}
                      </td>
                    ))}
                  </tr>
                  {renderExpanded && expandedKey === row[rowKey] && (
                    <tr className="bg-gray-50">
                      <td colSpan={columns.length} className="px-4 py-4 border-t border-gray-100">
                        {renderExpanded(row)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          <span>
            Showing {start + 1}-{Math.min(start + pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><FaChevronLeft className="w-2.5 h-2.5" /></Button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <Button size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}><FaChevronRight className="w-2.5 h-2.5" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");
export const formatINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
