import React, { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import api, { errorMessage } from "../api";
import { Alert, Button, DataTable, Field, Modal, PageHeader, SearchInput, Toolbar, inputClass } from "../Components/Admin/ui";

const emptyForm = { name: "", email: "", phone: "", password: "" };

export default function CustomersList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { mode: "add" | "edit", id? }
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/customers");
      setCustomers(res.data.customers || res.data || []);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Failed to fetch customers."));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? customers.filter((c) => [c.name, c.email, c.phone].some((v) => v?.toString().toLowerCase().includes(q)))
      : customers;
  }, [customers, search]);

  const openAdd = () => { setForm(emptyForm); setModal({ mode: "add" }); };
  const openEdit = (c) => { setForm({ name: c.name || "", email: c.email || "", phone: c.phone || "", password: "" }); setModal({ mode: "edit", id: c.id }); };
  const close = () => setModal(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === "add") {
        await api.post("/admin", { ...form, role: "Customer" });
      } else {
        const { password, ...rest } = form; // password is not changed from here
        await api.put(`/admin/${modal.id}`, rest);
      }
      close();
      load();
    } catch (err) {
      setError(errorMessage(err, "Failed to save customer."));
      close();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/${c.id}`);
      setCustomers((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err) {
      setError(errorMessage(err, "Failed to delete customer. They may have existing orders."));
    }
  };

  const columns = [
    { key: "name", label: "Name", sortable: true, render: (c) => <span className="font-medium text-gray-900">{c.name}</span> },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Phone", sortable: true },
    {
      key: "actions", label: "Actions", align: "right",
      render: (c) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" onClick={() => openEdit(c)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => remove(c)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} registered customers`}
        actions={<Button variant="primary" onClick={openAdd}><FaPlus className="w-3 h-3" /> Add customer</Button>}
      />
      <Alert type="error" onClose={() => setError("")}>{error}</Alert>
      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email or phone" />
      </Toolbar>
      <DataTable columns={columns} rows={rows} loading={loading} emptyText="No customers found" defaultSort={{ key: "name", dir: "asc" }} />

      <Modal
        open={!!modal}
        onClose={close}
        title={modal?.mode === "add" ? "Add customer" : "Edit customer"}
        footer={
          <>
            <Button onClick={close}>Cancel</Button>
            <Button variant="primary" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-3">
          <Field label="Name" required><input className={inputClass} value={form.name} onChange={set("name")} required minLength={2} /></Field>
          <Field label="Email" required><input type="email" className={inputClass} value={form.email} onChange={set("email")} required /></Field>
          <Field label="Phone"><input className={inputClass} value={form.phone} onChange={set("phone")} /></Field>
          {modal?.mode === "add" && (
            <Field label="Temporary password" required hint="At least 6 characters. The customer can change it later.">
              <input type="password" className={inputClass} value={form.password} onChange={set("password")} required minLength={6} />
            </Field>
          )}
          <button type="submit" className="hidden" />
        </form>
      </Modal>
    </div>
  );
}
