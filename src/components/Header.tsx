import { UserMenu } from "./UserMenu";
import logoImage from "@/assets/idoc-logo-new.png";

const Header = () => {
  return (
    <div className="flex items-center justify-between w-full h-16">
      <div className="flex items-center">
        <img
          src={logoImage}
          alt="Idoc Logo"
          className="h-12 w-auto !border-0 !outline-none !ring-0 !shadow-none transition-transform hover:scale-105"
          style={{ border: "none", outline: "none", boxShadow: "none" }}
        />
      </div>
      <UserMenu />
    </div>
  );
};

export default Header;
