import { UserMenu } from './UserMenu';
import logoImage from '@/assets/idoc-logo-new.png';

const Header = () => {
  return (
    <div className="flex items-center justify-between w-full">
      <img 
        src={logoImage} 
        alt="Idoc Logo" 
        className="h-24 w-auto !border-0 !outline-none !ring-0 !shadow-none"
        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
      />
      <UserMenu />
    </div>
  );
};

export default Header;
