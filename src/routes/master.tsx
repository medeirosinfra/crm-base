import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MasterLayout } from "@/components/layouts/master-layout";
import { RequireMaster } from "@/components/require-master";

export const Route = createFileRoute("/master")({
  component: () => (
    <RequireMaster>
      <MasterLayout>
        <Outlet />
      </MasterLayout>
    </RequireMaster>
  ),
});
