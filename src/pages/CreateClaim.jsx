import { useMemo, useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import Alert from "../components/Alert";
import { useReimbursementActions } from "../hooks/useReimbursementActions";
import { reimbursementApi } from "../api/reimbursementApi";
import {
  CLAIM_TYPE_MAP,
  FINANCE_USER_ID,
  getClaimTypeId,
} from "../config/reimbursementWorkflow";
import { currentUser } from "../lib/currentUser";
import {
  getStoredDepartmentId,
  getStoredDepartmentName,
  getStoredUserName,
} from "../lib/auth";

const FALLBACK_DEPARTMENTS = [
  { id: 1, name: "Operations" },
  { id: 2, name: "Finance" },
  { id: 3, name: "HR" },
  { id: 4, name: "Sales" },
];

const initialForm = {
  employeeUserID: currentUser.userId,
  departmentID: getStoredDepartmentId() || "",
  financeUserID: FINANCE_USER_ID,
  claimDate: new Date().toISOString().slice(0, 10),
  totalAmount: "",
  title: "",
  notes: "",
  createdBy: currentUser.userId,
  reimbursementClaimTypeID: "",
  categoryOther: "",
};

const initialItemForm = {
  expenseDate: new Date().toISOString().slice(0, 10),
  expenseType: "",
  expenseTypeOther: "",
  amount: "",
  description: "",
  billNo: "",
  noBill: false,
  billFile: null,
};

const CreateClaim = () => {
  const [form, setForm] = useState({
    ...initialForm,
    employeeUserID: currentUser.userId,
    createdBy: currentUser.userId,
  });
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [createdClaimId, setCreatedClaimId] = useState(null);
  const [items, setItems] = useState([]);
  const [userDirectory, setUserDirectory] = useState({});
  const [departments, setDepartments] = useState(FALLBACK_DEPARTMENTS);
  const [editingIndex, setEditingIndex] = useState(null);

  const {
    loading,
    error,
    success,
    setError,
    setSuccess,
    createClaim,
    addClaimItem,
    addAttachment,
    submitClaim,
  } = useReimbursementActions();

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      departmentID: getStoredDepartmentId() || prev.departmentID || "",
    }));

    const loadUsers = async () => {
      try {
        const { data } = await reimbursementApi.getUserMaster();
        const payload = data?.Data ?? data?.data ?? data ?? [];
        const list = Array.isArray(payload) ? payload : payload?.Users || [];
        const directory = {};
        list.forEach((item) => {
          const id = Number(item?.ID ?? item?.id);
          const name = item?.Value ?? item?.value ?? item?.FullName ?? item?.fullName;
          if (id) directory[id] = name || `User ${id}`;
        });
        setUserDirectory(directory);
      } catch (err) {
        setUserDirectory({});
      }
    };

    const loadDepartments = async () => {
      try {
        const { data } = await reimbursementApi.getDepartmentMaster();
        const payload = data?.Data ?? data?.data ?? data ?? [];
        const list = Array.isArray(payload) ? payload : payload?.Departments || [];
        const mapped = list
          .map((item) => ({
            id: Number(item?.ID ?? item?.id),
            name: item?.Value ?? item?.value ?? item?.DepartmentName ?? item?.departmentName,
          }))
          .filter((item) => item.id);
        if (mapped.length > 0) {
          setDepartments(mapped);
          setForm((prev) => ({
            ...prev,
            departmentID: getStoredDepartmentId() || prev.departmentID || mapped[0].id,
          }));
        }
      } catch (err) {
        setDepartments(FALLBACK_DEPARTMENTS);
        setForm((prev) => ({
          ...prev,
          departmentID:
            getStoredDepartmentId() || prev.departmentID || FALLBACK_DEPARTMENTS[0]?.id || "",
        }));
      }
    };

    loadUsers();
    loadDepartments();
  }, []);

  const employeeName =
    userDirectory[currentUser.userId] || getStoredUserName() || "Current User";
  const financeName = userDirectory[FINANCE_USER_ID] || "Finance User";

  const departmentName =
    getStoredDepartmentName() ||
    departments.find((dept) => Number(dept.id) === Number(form.departmentID))
      ?.name ||
    "";

  const totalFromItems = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [items]);

  useEffect(() => {
    if (items.length > 0) {
      setForm((prev) => ({ ...prev, totalAmount: String(totalFromItems) }));
    }
  }, [items, totalFromItems]);

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const updateItemField = (field) => (event) => {
    const value = field === "noBill" ? event.target.checked : event.target.value;
    setItemForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBillFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setItemForm((prev) => ({ ...prev, billFile: file }));
  };

  const parseCreatedClaimId = (data) =>
    data?.ReimbursementClaimID ||
    data?.reimbursementClaimID ||
    data?.Data?.ReimbursementClaimID ||
    data?.Data?.reimbursementClaimID ||
    data?.data?.ReimbursementClaimID ||
    data?.data?.reimbursementClaimID ||
    null;

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

  const cacheAttachment = async (claimId, file) => {
    if (!file) return null;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const safeName = file.name.replace(/\s+/g, "_");
      const cacheKey = `reimb-attachment:${claimId}:${safeName}`;
      localStorage.setItem(cacheKey, dataUrl);
      return `local://${cacheKey}`;
    } catch (err) {
      return null;
    }
  };

  const syncItemToBackend = async (claimId, item) => {
    await addClaimItem({
      reimbursementClaimID: claimId,
      expenseDate: item.expenseDate,
      expenseType: item.expenseType === "Other" ? item.expenseTypeOther : item.expenseType,
      amount: item.amount,
      description: item.description,
      billNo: item.noBill ? "No Bill" : item.billNo,
    });

    if (item.billFile && !item.noBill) {
      const cachedPath = await cacheAttachment(claimId, item.billFile);
      await addAttachment({
        reimbursementClaimID: claimId,
        fileName: item.billFile.name,
        filePath: cachedPath || item.billFile.name,
        fileType: item.billFile.type || "application/octet-stream",
        uploadedBy: currentUser.userId,
      });
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!currentUser.userId || !form.claimDate || !form.title) {
      setError("Employee, expense date, and title are required.");
      setSuccess("");
      return;
    }
    if (items.length === 0) {
      setError("Add at least one item before creating the claim.");
      setSuccess("");
      return;
    }
    if (!form.reimbursementClaimTypeID) {
      setError("Select a category.");
      setSuccess("");
      return;
    }
    if (Number(form.reimbursementClaimTypeID) === 0 && !form.categoryOther) {
      setError("Specify the other category.");
      setSuccess("");
      return;
    }

    const payload = {
      employeeUserID: currentUser.userId,
      departmentID: form.departmentID,
      financeUserID: FINANCE_USER_ID,
      claimDate: form.claimDate,
      totalAmount: totalFromItems,
      purpose: form.title,
      remarks:
        Number(form.reimbursementClaimTypeID) === 0
          ? `${form.notes} | Category: ${form.categoryOther}`.trim()
          : form.notes,
      createdBy: currentUser.userId,
      reimbursementClaimTypeID: form.reimbursementClaimTypeID || getClaimTypeId("Travel"),
    };

    const data = await createClaim(payload);
    const claimId = parseCreatedClaimId(data);
    if (!claimId) return;

    const claimIdNumber = Number(claimId);
    setCreatedClaimId(claimIdNumber);

    const updatedItems = [];
    for (const item of items) {
      if (!item.synced) {
        await syncItemToBackend(claimIdNumber, item);
        updatedItems.push({ ...item, synced: true });
      } else {
        updatedItems.push(item);
      }
    }
    setItems(updatedItems);
  };

  const handleAddItem = async (event) => {
    event.preventDefault();
    if (!itemForm.expenseDate || !itemForm.expenseType || !itemForm.amount) {
      setError("Expense date, type, and amount are required.");
      return;
    }
    if (itemForm.expenseType === "Other" && !itemForm.expenseTypeOther) {
      setError("Specify the other expense type.");
      return;
    }
    if (!itemForm.noBill && !itemForm.billFile) {
      setError("Upload a bill or select No Bill.");
      return;
    }

    if (editingIndex !== null) {
      const updated = items.map((item, index) =>
        index === editingIndex
          ? {
              ...item,
              ...itemForm,
              billNo: itemForm.noBill ? "No Bill" : itemForm.billNo,
              billFileName: itemForm.billFile?.name || item.billFileName || null,
            }
          : item
      );
      setItems(updated);
      setEditingIndex(null);
      setItemForm(initialItemForm);
      return;
    }

    const newItem = {
      ...itemForm,
      billNo: itemForm.noBill ? "No Bill" : itemForm.billNo,
      billFileName: itemForm.billFile?.name || null,
      synced: false,
    };

    if (createdClaimId) {
      await syncItemToBackend(createdClaimId, newItem);
      newItem.synced = true;
    }

    setItems((prev) => [...prev, newItem]);
    setItemForm(initialItemForm);
  };

  const handleEditItem = (index) => {
    const item = items[index];
    setEditingIndex(index);
    setItemForm({
      expenseDate: item.expenseDate,
      expenseType: item.expenseType,
      expenseTypeOther: item.expenseTypeOther || "",
      amount: item.amount,
      description: item.description,
      billNo: item.billNo === "No Bill" ? "" : item.billNo,
      noBill: item.billNo === "No Bill",
      billFile: item.billFile || null,
    });
  };

  const handleSubmitClaim = async () => {
    if (!createdClaimId) return;
    if (items.length === 0) {
      setError("Add at least one item before submitting.");
      return;
    }
    await submitClaim({
      reimbursementClaimID: Number(createdClaimId),
      submittedBy: Number(currentUser.userId),
    });
  };

  const isSubmitReady =
    Boolean(createdClaimId) &&
    items.length > 0 &&
    form.title &&
    totalFromItems > 0 &&
    form.claimDate;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Claim"
        subtitle="Capture claim details and add expense items before submitting."
      />

      <Alert tone="error" message={error} />
      <Alert tone="success" message={success} />

      <form
        id="claim-form"
        onSubmit={handleCreate}
        className="grid gap-6 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm lg:grid-cols-2"
      >
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Employee</label>
          <input
            type="text"
            value={employeeName}
            disabled
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Department</label>
          <select
            value={form.departmentID}
            onChange={updateField("departmentID")}
            disabled
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm"
          >
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          {departmentName ? (
            <p className="text-xs text-slate-400">Selected: {departmentName}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Finance</label>
          <input
            type="text"
            value={financeName}
            disabled
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Expense Date</label>
          <input
            type="date"
            value={form.claimDate}
            onChange={updateField("claimDate")}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Category</label>
          <select
            value={form.reimbursementClaimTypeID}
            onChange={updateField("reimbursementClaimTypeID")}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
          >
            <option value="">Select category</option>
            {Object.keys(CLAIM_TYPE_MAP).map((label) => (
              <option key={label} value={getClaimTypeId(label)}>
                {label}
              </option>
            ))}
            <option value={0}>Other</option>
          </select>
          {form.reimbursementClaimTypeID === "0" ? (
            <input
              type="text"
              value={form.categoryOther || ""}
              onChange={updateField("categoryOther")}
              placeholder="Specify other category"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            />
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Total Amount</label>
          <input
            type="number"
            value={totalFromItems || ""}
            disabled
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm"
          />
          <p className="text-xs text-slate-400">Auto-sum of item amounts.</p>
        </div>
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-semibold text-slate-700">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={updateField("title")}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
          />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-semibold text-slate-700">Notes</label>
          <textarea
            value={form.notes}
            onChange={updateField("notes")}
            rows="3"
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
          />
        </div>
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              {createdClaimId
                ? `Created claim ID: ${createdClaimId}`
                : "Create a draft claim first."}
            </div>
            <button
              type="submit"
              disabled={loading.createClaim}
              className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading.createClaim ? "Saving..." : "Create Claim"}
            </button>
          </div>
        </div>
      </form>

      <section
        id="items-form"
        className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Claim Items</h3>
            <p className="text-sm text-slate-500">Add at least one item before submitting.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Items: {items.length}
          </span>
        </div>
        <form onSubmit={handleAddItem} className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Expense Date</label>
            <input
              type="date"
              value={itemForm.expenseDate}
              onChange={updateItemField("expenseDate")}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Expense Type</label>
            <select
              value={itemForm.expenseType}
              onChange={updateItemField("expenseType")}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            >
              <option value="">Select expense type</option>
              {Object.keys(CLAIM_TYPE_MAP).map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
            {itemForm.expenseType === "Other" ? (
              <input
                type="text"
                value={itemForm.expenseTypeOther}
                onChange={updateItemField("expenseTypeOther")}
                placeholder="Specify other expense type"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
              />
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Amount</label>
            <input
              type="number"
              value={itemForm.amount}
              onChange={updateItemField("amount")}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Bill Upload</label>
            <input
              type="file"
              onChange={handleBillFileChange}
              disabled={itemForm.noBill}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            />
            <label className="mt-2 flex items-center gap-3 text-sm text-slate-500">
              <input
                type="checkbox"
                checked={itemForm.noBill}
                onChange={updateItemField("noBill")}
                className="h-5 w-5 rounded border-slate-300"
              />
              No bill
            </label>
          </div>
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea
              value={itemForm.description}
              onChange={updateItemField("description")}
              rows="3"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            />
          </div>
          <div className="lg:col-span-2 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading.addClaimItem}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading.addClaimItem
                ? "Saving..."
                : editingIndex !== null
                  ? "Save Item"
                  : "Add Claim Item"}
            </button>
            <button
              type="button"
              onClick={handleSubmitClaim}
              disabled={!isSubmitReady || loading.submitClaim}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              {loading.submitClaim ? "Submitting..." : "Submit Claim"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Review</h3>
            <p className="text-sm text-slate-500">Review your claim before submitting.</p>
          </div>
          <a href="#claim-form" className="text-xs font-semibold text-brand-600">
            Edit claim
          </a>
        </div>
        <div className="mt-4 grid gap-4 text-sm text-slate-600 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Department</p>
            <p className="font-semibold text-slate-900">{departmentName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Expense Date</p>
            <p className="font-semibold text-slate-900">{form.claimDate}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Title</p>
            <p className="font-semibold text-slate-900">{form.title || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Amount</p>
            <p className="font-semibold text-slate-900">{totalFromItems || "-"}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Items</p>
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">No items added yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {items.map((item, index) => (
                <div
                  key={`${item.expenseType}-${index}`}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.expenseType === "Other" ? item.expenseTypeOther || "Other" : item.expenseType || "Item"}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleEditItem(index)}
                      className="text-xs font-semibold text-brand-600"
                    >
                      Edit item
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.expenseDate} · {item.amount}
                  </p>
                  <p className="text-xs text-slate-500">
                    Bill: {item.noBill ? "No Bill" : "Uploaded"} {item.billFileName ? `(${item.billFileName})` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
          <a href="#items-form" className="mt-3 inline-flex text-xs font-semibold text-brand-600">
            Edit items
          </a>
        </div>
      </section>
    </div>
  );
};

export default CreateClaim;
