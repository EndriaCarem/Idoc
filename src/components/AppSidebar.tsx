import { FileText, History, LayoutDashboard, FileStack, FolderOpen, Users, Settings, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

const menuItems = [
  { title: 'Processar', url: '/', icon: FileText },
  { title: 'Arquivos', url: '/arquivos', icon: FolderOpen },
  { title: 'Compartilhado', url: '/compartilhado', icon: Users },
  { title: 'Histórico', url: '/historico', icon: History },
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Templates', url: '/templates', icon: FileStack },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao sair');
      return;
    }
    toast.success('Você saiu com sucesso');
    navigate('/auth');
  };

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

      <SidebarFooter>
        <Separator className="mb-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configurações">
              <NavLink
                to="/configuracoes"
                className={({ isActive }) =>
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-accent transition-colors'
                }
              >
                <Settings className="h-5 w-5 shrink-0" />
                {open && <span className="ml-2">Configurações</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Sair">
              <LogOut className="h-5 w-5 shrink-0" />
              {open && <span className="ml-2">Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
