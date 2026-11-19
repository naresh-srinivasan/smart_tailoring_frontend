// src/Subpages/PromoCodes.jsx
import React, { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import api, { errorMessage } from "../api";
import { Alert, Badge, Button, DataTable, Field, Modal, PageHeader, SearchInput, Toolbar, formatDate, inputClass } from "../Components/Admin/ui";

const emptyForm = { code: "", discountPercentage: "", validTo: "", usageLimit: "", description: "" };
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const promoStatus = (p) => {
  if (!p.isActive) return { label: "Inactive", color: "gray" };
  if (p.validTo && new Date(p.validTo) < new Date()) return { label: "Expired", color: "red" };
  if (p.usageLimit != null && p.usedCount >= p.usageLimit) return { label: "Used up", color: "amber" };
  return { label: "Active", color: "green" };
};

export default function PromoCodes() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modal, setModal] = useState(null); // { mode: "add" | "edit", id? }
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/promo/list");
      setPromos(res.data.promos || []);
    } catch (err) {
      setError(errorMessage(err, "Failed to load promo codes."));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? promos.filter((p) => [p.code, p.description].some((v) => v?.toLowerCase().includes(q))) : promos;
  }, [promos, search]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const close = () => setModal(null);
  const openAdd = () => { setForm(emptyForm); setModal({ mode: "add" }); };
  const openEdit = (p) => {
    setForm({
      code: p.code, discountPercentage: p.discountPercentage, validTo: toDateInput(p.validTo),
      usageLimit: p.usageLimit ?? "", description: p.description || "",
    });
    setModal({ mode: "edit", id: p.id });
  };

  const save = async (e) => {
    e.preventDefault();
    const percent = Number(form.discountPercentage);
    if (!form.code.trim() || !percent || percent < 1 || percent > 100) {
      setError("Enter a promo code and a discount between 1 and 100.");
      close();
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountPercentage: percent,
        validTo: form.validTo ? new Date(form.validTo) : undefined,
        usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
        description: form.description || null,
      };
      if (modal.mode === "add") {
        await api.post("/promo/create", { ...payload, validFrom: new Date() });
        setSuccess("Promo code added.");
      } else {
        await api.put(`/promo/${modal.id}`, payload);
        setSuccess("Promo code updated.");
      }
      close();
      load();
    } catch (err) {
      setError(errorMessage(err, "Failed to save promo code."));
      close();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete promo code ${p.code}?`)) return;
    try {
      await api.delete(`/promo/${p.id}`);
      setPromos((prev) => prev.filter((x) => x.id !== p.id));
      setSuccess("Promo code deleted.");
    } catch (err) {
      setError(errorMessage(err, "Failed to delete promo code."));
    }
  };

  const columns = [
    { key: "code", label: "Code", sortable: true, render: (p) => <span className="font-mono font-semibold text-gray-900">{p.code}</span> },
    { key: "discountPercentage", label: "Discount", sortable: true, render: (p) => `${p.discountPercentage}%` },
    { key: "description", label: "Description", className: "max-w-xs truncate" },
    { key: "validTo", label: "Valid until", sortable: true, render: (p) => formatDate(p.validTo) },
    { key: "usedCount", label: "Used", sortable: true, render: (p) => `${p.usedCount ?? 0} / ${p.usageLimit ?? "∞"}` },
    {
      key: "status", label: "Status", sortable: true, sortValue: (p) => promoStatus(p).label,
      render: (p) => { const s = promoStatus(p); return <Badge color={s.color}>{s.label}</Badge>; },
    },
    {
      key: "actions", label: "Actions", align: "right",
      render: (p) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" onClick={() => openEdit(p)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => remove(p)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Promo codes"
        subtitle={`${promos.length} codes`}
        actions={<Button variant="primary" onClick={openAdd}><FaPlus className="w-3 h-3" /> Add promo code</Button>}
      />
      <Alert type="error" onClose={() => setError("")}>{error}</Alert>
      <Alert type="success">{success}</Alert>
      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search code or description" />
      </Toolbar>
      <DataTable columns={columns} rows={rows} loading={loading} emptyText="No promo codes yet" defaultSort={{ key: "validTo", dir: "desc" }} />

      <Modal
        open={!!modal}
        onClose={close}
        title={modal?.mode === "add" ? "Add promo code" : "Edit promo code"}
        footer={
          <>
            <Button onClick={close}>Cancel</Button>
            <Button variant="primary" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-3">
          <Field label="Code" required><input className={`${inputClass} uppercase`} value={form.code} onChange={set("code")} placeholder="WELCOME10" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Discount %" required><input type="number" min="1" max="100" className={inputClass} value={form.discountPercentage} onChange={set("discountPercentage")} /></Field>
            <Field label="Usage limit" hint="Blank = unlimited"><input type="number" min="1" className={inputClass} value={form.usageLimit} onChange={set("usageLimit")} /></Field>
          </div>
          <Field label="Valid until"><input type="date" className={inputClass} value={form.validTo} onChange={set("validTo")} /></Field>
          <Field label="Description"><input className={inputClass} value={form.description} onChange={set("description")} placeholder="Shown to the admin only" /></Field>
          <button type="submit" className="hidden" />
        </form>
      </Modal>
    </div>
  );
}
