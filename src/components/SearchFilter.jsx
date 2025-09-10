import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';

export function SearchFilter({ 
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
    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/50 rounded-lg">
      {/* Campo de busca */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
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
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
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
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={paymentStatus} onValueChange={onPaymentStatusChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status de pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
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
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Mais recente</SelectItem>
            <SelectItem value="date-asc">Mais antigo</SelectItem>
            <SelectItem value="value-desc">Maior valor</SelectItem>
            <SelectItem value="value-asc">Menor valor</SelectItem>
            <SelectItem value="description">Descrição A-Z</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

