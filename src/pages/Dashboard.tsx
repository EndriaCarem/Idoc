import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalDocuments: number;
  totalAlerts: number;
  totalSuggestions: number;
  documentsByTemplate: { template: string; count: number }[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    totalAlerts: 0,
    totalSuggestions: 0,
    documentsByTemplate: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('processed_documents')
        .select('*');

      if (error) throw error;

      const documents: any[] = data || [];
      const templateCounts: { [key: string]: number } = {};
      
      let totalAlerts = 0;
      let totalSuggestions = 0;

      documents.forEach(doc => {
        totalAlerts += doc.alerts_count || 0;
        totalSuggestions += doc.suggestions_count || 0;
        
        const template = doc.template_name || 'Sem template';
        templateCounts[template] = (templateCounts[template] || 0) + 1;
      });

      const documentsByTemplate = Object.entries(templateCounts).map(([template, count]) => ({
        template,
        count,
      }));

      setStats({
        totalDocuments: documents.length,
        totalAlerts,
        totalSuggestions,
        documentsByTemplate,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">Visão geral do sistema de formatação</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total de Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground mt-1">Processados até agora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Alertas Gerados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.totalAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">Conformidade e validações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Sugestões</CardTitle>
            <CheckCircle className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.totalSuggestions}</div>
            <p className="text-xs text-muted-foreground mt-1">Melhorias propostas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Eficiência</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {stats.totalDocuments > 0 
                ? ((stats.totalSuggestions / stats.totalDocuments) * 10).toFixed(1) 
                : '0'}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tempo economizado</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Documentos por Template</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Distribuição de documentos processados</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {stats.documentsByTemplate.length === 0 ? (
            <p className="text-sm sm:text-base text-muted-foreground text-center py-6 sm:py-8">Nenhum documento processado ainda</p>
          ) : (
            <div className="space-y-3">
              {stats.documentsByTemplate.map((item) => (
                <div key={item.template} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base truncate">{item.template}</span>
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{item.count} doc(s)</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
