import { UserMenu } from './UserMenu';
import logoImage from '@/assets/idoc-logo-new.png';

const Header = () => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <img 
          src={logoImage} 
          alt="Idoc Logo" 
          className="w-10 h-10 rounded-lg"
        />
        <h1 className="text-xl font-bold text-foreground">Idoc</h1>
      </div>
      <UserMenu />
    </div>
  );
};

export default Header;
