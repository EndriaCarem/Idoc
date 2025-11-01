import { FileText, History, LayoutDashboard, FileStack, FolderOpen } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Processar', url: '/', icon: FileText },
  { title: 'Arquivos', url: '/arquivos', icon: FolderOpen },
  { title: 'Histórico', url: '/historico', icon: History },
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Templates', url: '/templates', icon: FileStack },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <div className="p-2">
          <SidebarTrigger className="hover:bg-accent/50 transition-all duration-200 rounded-md" />
        </div>
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
                          : 'hover:bg-accent transition-colors'
                      }
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {open && <span className="ml-2">{item.title}</span>}
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
