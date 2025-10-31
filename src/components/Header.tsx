import { UserMenu } from './UserMenu';
import logoImage from '@/assets/idoc-logo-new.png';

const Header = () => {
  return (
    <div className="flex items-center justify-between w-full">
      <img 
        src={logoImage} 
        alt="Idoc Logo" 
        className="h-16 w-auto"
      />
      <UserMenu />
    </div>
  );
};

export default Header;
