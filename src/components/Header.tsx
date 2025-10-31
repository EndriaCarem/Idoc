import { UserMenu } from "./UserMenu";
import logoImage from "@/assets/logo-idoc.png";

const Header = () => {
  return (
    <div className="flex items-center justify-between w-full h-16 bg-white/10 backdrop-blur-md border-b border-white/20 px-6 rounded-lg">
      <div className="flex items-center">
        <img
          src={logoImage}
          alt="Idoc Logo"
          className="h-28 w-auto transition-transform hover:scale-105"
        />
      </div>
      <UserMenu />
    </div>
  );
};

export default Header;
