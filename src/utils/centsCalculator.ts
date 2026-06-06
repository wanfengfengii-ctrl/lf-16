export function calculateCentsDeviation(targetFreq: number, measuredFreq: number): number {
  if (targetFreq <= 0 || measuredFreq <= 0) return 0;
  return 1200 * Math.log2(measuredFreq / targetFreq);
}

export function getStatusColor(
  centsDeviation: number | undefined,
  allowedDeviation: number,
  status: string
): { main: string; light: string; dark: string; bg: string } {
  if (centsDeviation === undefined || status === 'tuning') {
    return {
      main: '#64748b',
      light: '#94a3b8',
      dark: '#475569',
      bg: 'rgba(100, 116, 139, 0.1)',
    };
  }

  const absDeviation = Math.abs(centsDeviation);

  if (status === 'needs-review') {
    return {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      bg: 'rgba(245, 158, 11, 0.15)',
    };
  }

  if (absDeviation > allowedDeviation) {
    return {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      bg: 'rgba(239, 68, 68, 0.15)',
    };
  }

  return {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
    bg: 'rgba(16, 185, 129, 0.15)',
  };
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'tuning':
      return '调校中';
    case 'verified':
      return '已定音';
    case 'needs-review':
      return '待复核';
    default:
      return status;
  }
}

export function formatFrequency(freq: number | undefined): string {
  if (freq === undefined) return '--';
  return freq.toFixed(2) + ' Hz';
}

export function formatCents(cents: number | undefined): string {
  if (cents === undefined) return '--';
  const sign = cents > 0 ? '+' : '';
  return sign + cents.toFixed(2) + ' c';
}
