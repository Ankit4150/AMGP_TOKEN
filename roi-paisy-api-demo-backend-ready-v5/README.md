# ROI Platform Admin Dashboard

This frontend has been updated around the Native Token + ROI + Buyback + DEX + Withdrawal development plan supplied with the project.

## Included admin areas
- Dashboard: users, investments, daily ROI, token distribution, treasury, buyback, withdrawals, pending/failed activity.
- User Management
- KYC Verification
- Token Management
- Investment Management
- ROI Management
- Buyback Management
- Wallets / Treasury
- Withdrawal Management
- Transactions
- Reconciliation
- Audit Logs
- Notifications
- Reports
- Access Control / RBAC
- Settings

## UI / UX
- Responsive desktop and mobile layouts.
- Desktop tables switch to mobile cards.
- Loading/skeleton states.
- Debounced search.
- Pagination with 10/20/50 row limits.
- AbortController support through the query layer.
- Portal-based dropdowns that stay inside the viewport, close on outside click/Escape, and support dark mode.
- CRUD action menus and edit/add modals for generic data-list modules.
- Existing specialized admin pages retain their dedicated CRUD/detail workflows.
- Removed the misleading User Management chevron that looked like a non-functional dropdown.

## Demo/API mode
The existing `.env` is preserved:
- `VITE_API_URL=http://localhost:3000/api`
- `VITE_USE_MOCK_API=true`

No local API URL was changed. When the real backend is ready, change only `VITE_API_URL` and set mock mode to false according to the existing project configuration.

## Important
This is a frontend/admin implementation with demo/mock data. Blockchain, KYC, payout-provider, custody, and production financial integrations still require the real backend/provider contracts and production security review described in the development plan.

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
