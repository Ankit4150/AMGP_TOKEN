import React from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import ResponsiveDataList from "../../components/shared/ResponsiveDataList";
import { getReportApi, getReportByIdApi, createReportApi, updateReportApi, deleteReportApi } from "../../services/admin/reportApi";

export default function Reports() {
  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#112e52] sm:text-[29px]">Reports</h1>
        <p className="mt-1 text-sm text-[#3e5d83]">Platform reporting and operational summaries.</p>
      </div>

      <ResponsiveDataList
        title="Reports"
        description="Data is loaded through the module service with search, debounce, pagination and limit."
        api={getReportApi}
        createApi={createReportApi}
        updateApi={updateReportApi}
        deleteApi={deleteReportApi}
        endpoint="/admin/reports"
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
