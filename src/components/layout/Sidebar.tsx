import { getSidebarItems } from "@/server/queries/sidebar";
import { SidebarClient } from "./SidebarClient";

export const Sidebar = async () => {
  const items = await getSidebarItems();

  return <SidebarClient items={items} />;
};
