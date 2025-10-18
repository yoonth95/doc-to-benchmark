export const formatDuration = (value?: number | null) => {
  if (value === null || value === undefined) {
    return "-";
  }
  if (value >= 60_000) {
    return `${(value / 60_000).toFixed(1)}분`;
  }
  if (value >= 1_000) {
    const decimals = value >= 10_000 ? 0 : 1;
    return `${(value / 1_000).toFixed(decimals)}초`;
  }
  return `${Math.round(value)}ms`;
};

export const formatCost = (value?: number | null) => {
  if (value === null || value === undefined) {
    return "-";
  }
  if (value >= 1) {
    return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원`;
  }
  if (value >= 0.01) {
    return `${value.toLocaleString("ko-KR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })}원`;
  }
  return `${value.toFixed(4)}원`;
};

export const formatValidity = (value?: string | boolean | null) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  if (typeof value === "boolean") {
    return value ? "정상" : "검증 필요";
  }
  return value;
};
