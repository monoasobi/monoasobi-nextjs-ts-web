import { getSidebarItems } from "@/server/queries/sidebar";
import { Suspense } from "react";
import { SidebarClient } from "./SidebarClient";

export const Sidebar = () => {
  return (
    <Suspense fallback={null}>
      <SidebarContent />
    </Suspense>
  );
};

const SidebarContent = async () => {
  const items = await getSidebarItems();

  return <SidebarClient items={items} />;
};
