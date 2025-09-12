import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';

export function CompactSearchFilter({ 
  searchTerm, 
  onSearchChange, 
  categories, 
  selectedCategory, 
  onCategoryChange,
  paymentStatus,
  onPaymentStatusChange,
  sortBy,
  onSortChange,
  placeholder = "Buscar...",
  showCategoryFilter = true,
  showPaymentFilter = false,
  showSortFilter = true
}) {
  const handleClearSearch = () => {
    onSearchChange('');
  };

  const handleClearCategory = () => {
    onCategoryChange('all');
  };

  const handleClearPaymentStatus = () => {
    onPaymentStatusChange('all');
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border">
      {/* Campo de busca */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-6 pr-8 h-8 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filtro por categoria */}
      {showCategoryFilter && (
        <div className="flex items-center gap-1">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs border-0 bg-transparent shadow-none">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCategory !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCategory}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Filtro por status de pagamento */}
      {showPaymentFilter && (
        <div className="flex items-center gap-1">
          <Select value={paymentStatus} onValueChange={onPaymentStatusChange}>
            <SelectTrigger className="w-[120px] h-8 text-xs border-0 bg-transparent shadow-none">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pagas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>
          {paymentStatus !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearPaymentStatus}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Ordenação */}
      {showSortFilter && (
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[120px] h-8 text-xs border-0 bg-transparent shadow-none">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Mais recente</SelectItem>
            <SelectItem value="date-asc">Mais antigo</SelectItem>
            <SelectItem value="value-desc">Maior valor</SelectItem>
            <SelectItem value="value-asc">Menor valor</SelectItem>
            <SelectItem value="description">A-Z</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
