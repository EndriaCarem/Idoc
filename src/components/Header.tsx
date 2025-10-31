import { UserMenu } from './UserMenu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import logoImage from '@/assets/idoc-logo-new.png';

const Header = () => {
  return (
    <div className="flex items-center justify-between w-full gap-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <img 
          src={logoImage} 
          alt="Idoc Logo" 
          className="h-32 w-auto !border-0 !outline-none !ring-0 !shadow-none"
          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
        />
      </div>
      <UserMenu />
    </div>
  );
};

export default Header;
