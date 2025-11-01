import { UserMenu } from "./UserMenu";

const Header = () => {
  return (
    <div className="flex items-center justify-between w-full h-14 sm:h-16 bg-white/10 backdrop-blur-md border-b border-white/20 px-3 sm:px-6 rounded-lg">
      <div className="flex items-center">
        <img
          src="https://ahllwwxxyltydsfvaknx.supabase.co/storage/v1/object/public/workspace-files/9f87c379-cf00-44fb-975e-5e546cc2f4ff/fa51f964-c2ac-4165-9cd0-ef5f01758d60/0.34092254284351187.png"
          alt="Idoc Logo"
          className="h-20 sm:h-28 w-auto transition-transform hover:scale-105"
        />
      </div>
      <UserMenu />
    </div>
  );
};

export default Header;
