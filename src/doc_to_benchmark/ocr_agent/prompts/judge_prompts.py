"""
LLM Judge 프롬프트 (3단계)
Pass된 텍스트들을 비교하여 세부 품질 점수 산출
"""

import json
import re
from typing import List, Dict, Any


def create_judge_prompt(
    strategy: str,
    pages: List[Dict],
    doc_meta: Dict[str, Any]
) -> str:
    """
    LLM Judge 프롬프트 생성 (개선 버전)
    
    Args:
        strategy: 전략 이름 (예: 'pdfplumber+custom_split')
        pages: 페이지 데이터 리스트
        doc_meta: 문서 메타데이터
        
    Returns:
        프롬프트 문자열
    """
    
    # 텍스트 샘플 추출 (최대 1000자)
    text_samples = []
    for page in pages[:1]:  # 대표 1페이지만
        text = page.get("text", "")[:1000]
        text_samples.append(f"[페이지 {page.get('page', '?')}]\n{text}")
    
    sample_text = "\n\n".join(text_samples)
    
    # 표 정보
    has_tables = any(page.get("tables", []) for page in pages)
    table_info = ""
    if has_tables:
        total_tables = sum(len(page.get("tables", [])) for page in pages)
        table_info = f"\n표 포함: 총 {total_tables}개"
    
    prompt = f"""당신은 PDF 텍스트 추출 품질을 **정밀 평가**하는 전문가입니다.

📌 **중요**: 이 텍스트는 이미 **2단계 검증을 통과**했습니다.
   → 실무 사용 가능한 수준으로 판정됨
   → 지금은 여러 Pass 전략 중 **최선을 선택**하기 위한 세부 평가입니다.

---

## 📄 평가 대상

**전략**: {strategy}
**문서**: {doc_meta.get('document_name', 'unknown')}
**페이지**: {len(pages)}개{table_info}

**추출된 텍스트**:
```
{sample_text}
```

---

## 🎯 평가 기준 (각 0~100점)

### 1️⃣ **S_read (읽기 순서 완성도)** [0-100점]
**평가 내용**:
- 문단과 문장이 논리적 순서로 배열되었는가?
- 다단(multi-column) 레이아웃이 정확히 처리되었는가?
- 목록, 번호, 계층 구조가 올바른가?

**점수 기준**:
- 95-100: 완벽한 읽기 순서, 레이아웃 완벽 보존
- 85-94: 매우 우수, 사소한 순서 오류
- 70-84: 우수, 일부 순서 이슈 있으나 이해 가능
- 60-69: 보통, 순서가 다소 뒤섞임

### 2️⃣ **S_sent (문장 완결성)** [0-100점]
**평가 내용**:
- 모든 문장이 완전한 형태로 추출되었는가?
- 단어가 중간에 끊기거나 합쳐지지 않았는가?
- 띄어쓰기와 줄바꿈이 자연스러운가?

**점수 기준**:
- 95-100: 완벽한 문장 구조, 원문 그대로
- 85-94: 매우 우수, 미세한 띄어쓰기 오류
- 70-84: 우수, 일부 단어 단절 있으나 이해 가능
- 60-69: 보통, 문장 단절 눈에 띔

### 3️⃣ **S_noise (노이즈 제거 수준)** [0-100점]
**평가 내용**:
- 헤더/푸터가 깨끗이 제거되었는가?
- 페이지 번호가 본문에 섞이지 않았는가?
- 불필요한 기호나 반복 패턴이 없는가?

**점수 기준**:
- 95-100: 완벽한 클린업, 노이즈 0%
- 85-94: 매우 깨끗, 사소한 노이즈
- 70-84: 깨끗, 일부 노이즈 있으나 무시 가능
- 60-69: 보통, 노이즈가 눈에 띄지만 읽기 방해 안 함

### 4️⃣ **S_table (표 추출 완성도)** [0-100점]
**평가 내용** (표가 있는 경우):
- 행과 열이 정확히 구분되었는가?
- 셀 내용이 정확한 위치에 배치되었는가?
- 병합 셀, 헤더가 올바르게 처리되었는가?

**표가 없는 경우**: 90점 부여 (중립)

**점수 기준**:
- 95-100: 표 구조 완벽 보존, 셀 정렬 정확
- 85-94: 매우 우수, 사소한 정렬 오류
- 70-84: 우수, 일부 셀 위치 오류 있으나 이해 가능
- 60-69: 보통, 표 구조는 보존되나 정렬 어긋남

### 5️⃣ **S_fig (도표/이미지 설명 추출)** [0-100점]
**평가 내용** (그림/도표가 있는 경우):
- 그림 캡션이 추출되었는가?
- 차트/그래프의 레이블과 범례가 있는가?
- 다이어그램의 텍스트 요소가 포함되었는가?

**그림이 없는 경우**: 85점 부여 (중립)

**점수 기준**:
- 95-100: 모든 시각 자료 설명 완벽 추출
- 85-94: 캡션과 주요 레이블 추출됨
- 70-84: 일부 캡션 누락, 주요 정보는 있음
- 60-69: 캡션 많이 누락

---

## 📤 응답 형식

**JSON만** 출력하세요 (다른 설명 없이):

```json
{{
  "S_read": 88,
  "S_sent": 92,
  "S_noise": 85,
  "S_table": 90,
  "S_fig": 85,
  "rationale": "전반적으로 매우 우수한 추출 품질. 다단 레이아웃이 정확히 처리되었고 문장 완결성이 뛰어남. 일부 헤더 노이즈가 남아있으나 읽기에 지장 없음. 표 구조가 잘 보존됨.",
  "comments": {{
    "read": "2단 레이아웃이 정확히 좌→우 순서로 처리됨",
    "sent": "문장 단절 없이 자연스러운 흐름",
    "noise": "상단 헤더 일부 잔존하나 무시 가능",
    "table": "3개 표 모두 행/열 구분 명확",
    "fig": "그림 캡션 2개 누락, 나머지는 추출됨"
  }}
}}
```

**평가 원칙**:
1. **Pass 받은 텍스트**이므로 기본 60점 이상
2. **비교 평가**: 다른 전략과 비교할 것을 염두
3. **객관적 평가**: 실제 품질에 기반한 정확한 점수
4. **세부 근거**: rationale과 comments에 구체적 이유

JSON만 출력:"""

    return prompt


def parse_judge_response(response_content: str) -> Dict[str, Any]:
    """
    LLM Judge 응답 파싱
    
    Args:
        response_content: LLM 응답 텍스트
        
    Returns:
        {
            "S_read": float (0-100),
            "S_sent": float (0-100),
            "S_noise": float (0-100),
            "S_table": float (0-100),
            "S_fig": float (0-100),
            "rationale": str,
            "comments": dict
        }
    """
    
    # JSON 추출
    json_str = response_content.strip()
    
    # 마크다운 코드블록 제거
    if "```json" in json_str:
        json_match = re.search(r'```json\s*(.*?)\s*```', json_str, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
    elif "```" in json_str:
        json_match = re.search(r'```\s*(.*?)\s*```', json_str, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
    
    try:
        data = json.loads(json_str)
        
        # 점수 추출 및 검증 (0-100 범위)
        scores = {
            "S_read": max(0, min(100, float(data.get("S_read", 75)))),
            "S_sent": max(0, min(100, float(data.get("S_sent", 75)))),
            "S_noise": max(0, min(100, float(data.get("S_noise", 75)))),
            "S_table": max(0, min(100, float(data.get("S_table", 85)))),  # 표 없으면 높게
            "S_fig": max(0, min(100, float(data.get("S_fig", 80)))),    # 그림 없으면 높게
            "rationale": str(data.get("rationale", "평가 완료")),
            "comments": data.get("comments", {})
        }
        
        return scores
        
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        print(f"[ERROR] Judge 응답 파싱 실패: {str(e)}")
        print(f"응답 내용: {response_content[:300]}...")
        
        # 기본값 반환 (Pass 받았으므로 75점 기본)
        return {
            "S_read": 75.0,
            "S_sent": 75.0,
            "S_noise": 75.0,
            "S_table": 85.0,
            "S_fig": 80.0,
            "rationale": "파싱 실패 - 기본 점수 부여",
            "comments": {}
        }


if __name__ == "__main__":
    # 테스트
    test_pages = [
        {
            "page": 1, 
            "text": "제1장 서론\n\n본 보고서는 2024년 상반기 실적을 분석한 문서입니다.\n매출은 전년 대비 15% 증가하였습니다.",
            "tables": []
        }
    ]
    
    test_meta = {"document_name": "test_report.pdf"}
    
    prompt = create_judge_prompt("pdfplumber+custom_split", test_pages, test_meta)
    print("[OK] Judge 프롬프트 생성 완료 (개선 버전)")
    print(f"길이: {len(prompt)} chars")
    print("\n" + "="*60)
    print(prompt[:500] + "...")
    
    # 응답 파싱 테스트
    test_response = """```json
{
  "S_read": 88,
  "S_sent": 92,
  "S_noise": 85,
  "S_table": 90,
  "S_fig": 85,
  "rationale": "전반적으로 매우 우수",
  "comments": {
    "read": "레이아웃 완벽",
    "sent": "문장 자연스러움"
  }
}
```"""
    
    parsed = parse_judge_response(test_response)
    avg_score = sum(parsed[k] for k in ['S_read', 'S_sent', 'S_noise', 'S_table', 'S_fig']) / 5
    print(f"\n[OK] 응답 파싱 완료")
    print(f"평균 점수: {avg_score:.2f}/100")
    print(f"개별: read={parsed['S_read']}, sent={parsed['S_sent']}, noise={parsed['S_noise']}, table={parsed['S_table']}, fig={parsed['S_fig']}")
