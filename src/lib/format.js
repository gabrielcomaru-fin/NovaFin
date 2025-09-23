// Utilitários de formatação reutilizáveis

const currencyBRLFormatter = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	currency: 'BRL',
});

export function formatCurrencyBRL(value) {
	if (typeof value !== 'number' || Number.isNaN(value)) return '-';
	return currencyBRLFormatter.format(value);
}

export function formatPercent(value, options = { maximumFractionDigits: 0 }) {
	if (typeof value !== 'number' || Number.isNaN(value)) return '-';
	const percent = new Intl.NumberFormat('pt-BR', {
		style: 'percent',
		maximumFractionDigits: options.maximumFractionDigits ?? 0,
	});
	return percent.format(value / 100);
}

export function formatNumber(value, options) {
	if (typeof value !== 'number' || Number.isNaN(value)) return '-';
	return new Intl.NumberFormat('pt-BR', options).format(value);
}


