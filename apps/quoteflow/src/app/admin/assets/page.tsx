import Link from "next/link";
import { AssetStatus, AssetType } from "@prisma/client";

import { AdminSection, DuePill, EmptyState, FilterBar, FilterInput, FilterSelect, StatusBadge, SubmitButton } from "@/components/admin/ops-ui";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { getCalAssetsList } from "@/features/calops/queries";
import { formatDate, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCalOpsAccess();
  const resolvedSearchParams = await searchParams;
  const { assets, customers, filters } = await getCalAssetsList(resolvedSearchParams);

  return (
    <div className="space-y-4">
      <AdminSection
        title="Calibration assets"
        description="Search customer assets, monitor status and due dates, review procedures, standards, parent-child relationships, history, and placeholders for attachments."
      />

      <FilterBar>
        <FilterInput name="query" defaultValue={filters.query} placeholder="Search asset, serial, customer" />
        <FilterSelect name="customerId" defaultValue={filters.customerId}>
          <option value="">All customers</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.company}</option>
          ))}
        </FilterSelect>
        <FilterSelect name="assetType" defaultValue={filters.assetType}>
          <option value="">All asset types</option>
          {Object.values(AssetType).map((assetType) => (
            <option key={assetType} value={assetType}>{sentenceCase(assetType)}</option>
          ))}
        </FilterSelect>
        <FilterSelect name="status" defaultValue={filters.status}>
          <option value="">All statuses</option>
          {Object.values(AssetStatus).map((status) => (
            <option key={status} value={status}>{sentenceCase(status)}</option>
          ))}
        </FilterSelect>
        <div className="flex gap-2">
          <FilterSelect name="sort" defaultValue={filters.sort} className="flex-1">
            <option value="recent">Recently updated</option>
            <option value="dueDate">Due date</option>
          </FilterSelect>
          <SubmitButton label="Apply" />
        </div>
      </FilterBar>

      {assets.length === 0 ? (
        <EmptyState title="No assets matched the filters" body="Seeded calibration assets appear here after the CalOps seed is loaded." />
      ) : (
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Procedure</th>
                <th>Status</th>
                <th>Due date</th>
                <th>Standards</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <p className="font-medium">{asset.assetId}</p>
                    <p className="mt-1 text-xs text-[#64707a]">{asset.description}</p>
                    <p className="mt-1 text-xs text-[#64707a]">{[asset.manufacturer, asset.model, asset.serialNumber].filter(Boolean).join(" / ")}</p>
                  </td>
                  <td>{asset.customer.company}</td>
                  <td>{sentenceCase(asset.assetType)}</td>
                  <td>{asset.procedure?.procedureNumber ?? "Unassigned"}</td>
                  <td>
                    <StatusBadge label={sentenceCase(asset.status)} tone={asset.status === "OVERDUE" || asset.status === "OOT" ? "danger" : asset.status === "DUE_SOON" ? "warning" : "success"} />
                  </td>
                  <td>
                    <div className="space-y-1">
                      <DuePill date={asset.dueDate} />
                      <p className="text-xs text-[#64707a]">{formatDate(asset.dueDate)}</p>
                    </div>
                  </td>
                  <td>{asset.standards.length}</td>
                  <td>
                    <Link href={`/admin/assets/${asset.id}`} className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

