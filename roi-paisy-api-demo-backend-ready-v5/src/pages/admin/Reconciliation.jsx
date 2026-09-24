import React from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import ResponsiveDataList from "../../components/shared/ResponsiveDataList";
import { getReconciliationApi, getReconciliationByIdApi, createReconciliationApi, updateReconciliationApi, deleteReconciliationApi } from "../../services/admin/reconciliationApi";

export default function Reconciliation() {
  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#112e52] sm:text-[29px]">Reconciliation</h1>
        <p className="mt-1 text-sm text-[#3e5d83]">Compare expected balances and actual blockchain settlement.</p>
      </div>

      <ResponsiveDataList
        title="Reconciliation"
        description="Data is loaded through the module service with search, debounce, pagination and limit."
        api={getReconciliationApi}
        createApi={createReconciliationApi}
        updateApi={updateReconciliationApi}
        deleteApi={deleteReconciliationApi}
        endpoint="/admin/reconciliation"
        filters={[
          {
            key: "status",
            label: "All Status",
            options: [
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },
            ],
          },
        ]}
      />
    </AdminLayout>
  );
}
