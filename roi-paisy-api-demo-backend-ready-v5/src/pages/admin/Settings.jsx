import React from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import ResponsiveDataList from "../../components/shared/ResponsiveDataList";
import { getSettingsApi, getSettingsByIdApi, createSettingsApi, updateSettingsApi, deleteSettingsApi } from "../../services/admin/settingsApi";

export default function Settings() {
  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#112e52] sm:text-[29px]">Settings</h1>
        <p className="mt-1 text-sm text-[#3e5d83]">Platform and operational settings.</p>
      </div>

      <ResponsiveDataList
        title="Settings"
        description="Data is loaded through the module service with search, debounce, pagination and limit."
        api={getSettingsApi}
        createApi={createSettingsApi}
        updateApi={updateSettingsApi}
        deleteApi={deleteSettingsApi}
        endpoint="/admin/settings"
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
