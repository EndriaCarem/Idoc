import { FileText, History, LayoutDashboard, FileStack, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Processar', url: '/', icon: FileText },
  { title: 'Histórico', url: '/historico', icon: History },
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Templates', url: '/templates', icon: FileStack },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url}
                      end
                      className={({ isActive }) => 
                        isActive 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'hover:bg-accent'
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
