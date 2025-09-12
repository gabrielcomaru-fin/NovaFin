# Sistema de Cores Semântico

## Visão Geral

O projeto implementa um sistema de cores semântico que garante consistência visual e facilita a manutenção. As cores são definidas como variáveis CSS e adaptam-se automaticamente aos temas claro e escuro.

## Cores Semânticas

### Cores Gerais

| Cor | Variável CSS | Uso | Tema Claro | Tema Escuro |
|-----|--------------|-----|------------|-------------|
| **Success** | `--success` | Estados de sucesso, confirmações | Verde escuro | Verde claro |
| **Warning** | `--warning` | Avisos, pendências, alertas | Amarelo/Laranja | Amarelo claro |
| **Error** | `--error` | Erros, falhas, valores negativos | Vermelho | Vermelho claro |
| **Info** | `--info` | Informações, links, elementos neutros | Azul | Azul claro |

### Cores Financeiras

| Cor | Variável CSS | Uso | Tema Claro | Tema Escuro |
|-----|--------------|-----|------------|-------------|
| **Income** | `--income` | Receitas, investimentos, valores positivos | Verde escuro | Verde claro |
| **Expense** | `--expense` | Despesas, gastos, valores negativos | Vermelho | Vermelho claro |
| **Pending** | `--pending` | Pendências, valores em aberto | Amarelo/Laranja | Amarelo claro |

## Variações de Cores

Cada cor semântica possui 4 variações:

- **DEFAULT**: Cor principal
- **foreground**: Cor do texto sobre a cor principal
- **muted**: Cor de fundo suave
- **border**: Cor da borda

### Exemplo de Uso

```css
/* Cor principal */
.text-success { color: hsl(var(--success)); }
.bg-success { background-color: hsl(var(--success)); }

/* Cor de fundo suave */
.bg-success-muted { background-color: hsl(var(--success-muted)); }

/* Cor da borda */
.border-success { border-color: hsl(var(--success-border)); }

/* Cor do texto sobre a cor principal */
.text-success-foreground { color: hsl(var(--success-foreground)); }
```

## Classes Tailwind

O sistema está integrado ao Tailwind CSS, permitindo o uso das cores através de classes:

```jsx
// Texto
<div className="text-success">Sucesso!</div>
<div className="text-warning">Atenção!</div>
<div className="text-error">Erro!</div>
<div className="text-income">+R$ 1.000,00</div>
<div className="text-expense">-R$ 500,00</div>

// Fundo
<div className="bg-success-muted">Fundo verde suave</div>
<div className="bg-warning-muted">Fundo amarelo suave</div>

// Bordas
<div className="border border-success">Borda verde</div>
<div className="border border-warning">Borda amarela</div>
```

## Casos de Uso

### Dashboard
- **Income**: Aportes, investimentos, metas atingidas
- **Expense**: Gastos, valores negativos
- **Warning**: Pendências, alertas
- **Success**: Metas batidas, progresso positivo

### Formulários
- **Error**: Campos com erro, validações falhadas
- **Success**: Campos válidos, confirmações
- **Warning**: Campos com avisos

### Tabelas e Listas
- **Income**: Valores positivos, receitas
- **Expense**: Valores negativos, despesas
- **Pending**: Status pendente, em aberto

## Benefícios

1. **Consistência**: Cores padronizadas em todo o projeto
2. **Manutenibilidade**: Mudanças centralizadas nas variáveis CSS
3. **Acessibilidade**: Contraste adequado em ambos os temas
4. **Semântica**: Cores com significado claro e específico
5. **Responsividade**: Adaptação automática aos temas

## Migração

Para migrar cores hardcoded para o sistema semântico:

### Antes
```jsx
<div className="text-green-500">Sucesso</div>
<div className="bg-red-100 border-red-200">Erro</div>
```

### Depois
```jsx
<div className="text-success">Sucesso</div>
<div className="bg-error-muted border-error">Erro</div>
```

## Melhores Práticas de Contraste

### ❌ Evitar
```jsx
// Texto branco sobre fundo claro - baixo contraste
<div className="bg-warning-muted text-warning-foreground">Aviso</div>
```

### ✅ Recomendado
```jsx
// Texto escuro sobre fundo claro - bom contraste
<div className="bg-warning-muted text-foreground">Aviso</div>

// Ou texto colorido sobre fundo claro
<div className="bg-warning-muted text-warning">Aviso</div>
```

### Regras de Contraste

1. **Fundo `-muted`**: Use `text-foreground` ou `text-[cor]` para texto principal
2. **Fundo `[cor]`**: Use `text-[cor]-foreground` para texto sobre a cor
3. **Sempre teste**: Verifique contraste em ambos os temas

## Manutenção

Para adicionar novas cores ou modificar existentes:

1. Edite as variáveis CSS em `src/index.css`
2. Atualize o `tailwind.config.js` se necessário
3. Teste em ambos os temas (claro e escuro)
4. Verifique contraste de texto
5. Atualize esta documentação
