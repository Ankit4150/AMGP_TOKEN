import React from "react";
import UserLayout from "../../components/user/UserLayout";
import ResponsiveDataList from "../../components/shared/ResponsiveDataList";
import { getUserTokenApi, createUserTokenApi, updateUserTokenApi } from "../../services/user/tokenApi";

export default function MyTokens() {
  return (
    <UserLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#112e52] sm:text-[29px]">My Tokens</h1>
        <p className="mt-1 text-sm text-[#3e5d83]">View native token balance, price and estimated value.</p>
      </div>

      <ResponsiveDataList
        title="My Tokens"
        description="Data is loaded through the module service with search, debounce, pagination and limit."
        api={getUserTokenApi}
        createApi={createUserTokenApi}
        updateApi={updateUserTokenApi}
        endpoint="/user/tokens"
        filters={[
          {
            key: "status",
            label: "All Status",
            options: [
              { value: "pending", label: "Pending" },
              { value: "processing", label: "Processing" },
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },
            ],
          },
        ]}
      />
    </UserLayout>
  );
}
