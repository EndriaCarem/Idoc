import { FileText, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isTemplatesPage = location.pathname === '/templates';

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Copiloto de Formatação</h1>
              <p className="text-xs text-muted-foreground">VIRTUS-CC Desafio 1/2025</p>
            </div>
          </div>
          
          {!isTemplatesPage && (
            <Button
              variant="outline"
              onClick={() => navigate('/templates')}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Gerenciar Templates</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
