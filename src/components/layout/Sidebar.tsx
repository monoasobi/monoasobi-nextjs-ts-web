import { getSidebarItems } from "@/server/queries/sidebar";
import { Suspense } from "react";
import { SidebarClient } from "./SidebarClient";
import { SidebarLoading } from "./Sidebar/SidebarLoading";

export const Sidebar = () => {
  return (
    <Suspense fallback={<SidebarLoading />}>
      <SidebarContent />
    </Suspense>
  );
};

const SidebarContent = async () => {
  const items = await getSidebarItems();

  return <SidebarClient items={items} />;
};
