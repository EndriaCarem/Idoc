import { FileText } from 'lucide-react';

const Header = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
        <FileText className="w-6 h-6 text-primary-foreground" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Idoc</h1>
    </div>
  );
};

export default Header;
