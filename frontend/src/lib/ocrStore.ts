export interface OcrPage {
  pageNumber: number;
  text: string;
}

export interface OcrResultItem {
  id: string;
  fileName: string;
  sizeMB: number;
  processedAt: string;
  language: string;
  confidence: number;
  pages: OcrPage[];
}

let cachedResults: OcrResultItem[] = [];

export const setOcrResults = (results: OcrResultItem[]) => {
  cachedResults = results;
};

export const getOcrResults = () => cachedResults;

export const getOcrResultById = (id: string) => cachedResults.find((item) => item.id === id);

const deriveSeedFromId = (id: string) =>
  id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

export const createFallbackOcrResult = (id: string, fileName?: string): OcrResultItem => {
  const baseName = fileName ? fileName.replace(/\.[^/.]+$/, "") : `문서 ${id}`;
  const seed = deriveSeedFromId(id || baseName);
  const processedDate = new Date();
  const sizeMB = Number((1.2 + (seed % 7) * 0.35).toFixed(2));
  const confidence = 84 + (seed % 12);

  const pages: OcrPage[] = [
    {
      pageNumber: 1,
      text: `문서 제목: ${baseName}\n\n요약\n- 이 문서는 시스템에서 자동 추출한 OCR 결과입니다.\n- 중요 문단과 표 형식 정보는 가독성을 위해 단락으로 재배열되었습니다.\n- 숫자, 기호 등 특수 문자는 후속 검토를 통해 보완하세요.`,
    },
    {
      pageNumber: 2,
      text: `핵심 메시지\n1. 생성 시각: ${processedDate.toLocaleString("ko-KR")}\n2. 예상 카테고리: 정책 및 업무 보고서\n3. 주요 키워드\n   • ${baseName} 관련 정책 요약\n   • 담당 부처와 협업 기관\n   • 향후 일정 및 추진 계획\n\nTIP: 필요한 텍스트를 선택해 복사하거나, 문단별 주석을 추가해 정제 작업을 진행해 보세요.`,
    },
  ];

  return {
    id,
    fileName: fileName ?? `${baseName}.pdf`,
    sizeMB,
    processedAt: processedDate.toISOString(),
    language: "한국어",
    confidence: Math.min(confidence, 99),
    pages,
  };
};
