import { UserMenu } from './UserMenu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import logoImage from '@/assets/idoc-logo-new.png';

const Header = () => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="hover:bg-accent transition-colors" />
        <img 
          src={logoImage} 
          alt="Idoc Logo" 
          className="h-16 w-auto !border-0 !outline-none !ring-0 !shadow-none transition-transform hover:scale-105"
          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
        />
      </div>
      <UserMenu />
    </div>
  );
};

export default Header;
