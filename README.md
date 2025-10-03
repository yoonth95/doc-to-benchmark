# Doc to Benchmark

Doc to Benchmark는 멀티 에이전트 OCR 파이프라인을 FastAPI 백엔드와 Vite 기반 React 프론트엔드로 감싼 문서 분석 워크벤치입니다.
<br/>
Upstage Solar LLM과 상용/오픈소스 OCR 제공자를 조합해 문서를 처리하고, 품질·시간·비용 지표를 한눈에 비교할 수 있는 벤치마크 대시보드를 제공합니다.

## 주요 특징

- **멀티 에이전트 파이프라인**: Planner → Judge → Parsing → Refiner → Reporter 에이전트가 LangGraph로 구성되어 문서 추출, 품질 검증, 전략 선택을 자동화합니다.
- **OCR 제공자 벤치마킹**: PyPDFium2, PDFMiner, PDFPlumber, Upstage OCR 등 다양한 전략을 페이지 단위로 평가하고 선호 전략을 추천합니다.
- **문서 통찰 대시보드**: React + Tailwind UI가 페이지 미리보기, LLM Judge 점수, 처리 속도·비용, Mermaid 기반 단계 흐름도를 모두 시각화합니다.
- **패키지형 배포**: `doc-to-benchmark` 콘솔 명령 하나로 FastAPI 앱과 빌드된 정적 자산을 동시에 제공하며, PyPI 배포를 위한 커스텀 빌드 파이프라인이 포함되어 있습니다.

## 시스템 구성 요약

- **Backend (Python 3.10+)**
  - FastAPI + Uvicorn ASGI 서버
  - SQLAlchemy 2.x + SQLite (비동기 엔진 `sqlite+aiosqlite`)
  - `/api` 네임스페이스에 문서 목록, 분석 항목, 인사이트, 전략 변경, 업로드 API 제공
  - 업로드 시 `UploadStorage`가 파일과 메타데이터를 디스크에 기록하고, `ocr_pipeline.process_document`가 LangGraph OCR 에이전트를 동기 실행하여 DB에 결과를 반영
  - 앱 시작 시 마이그레이션 유사 스키마 보정과 샘플 데이터 시드 수행 (`seed_if_empty`)
- **OCR Agent (src/doc_to_benchmark/ocr_agent)**
  - LangGraph로 구성된 문서 처리 그래프, Upstage Solar LLM을 이용한 Judge 단계, PDF 정규화 도구(pdfplumber, pdfminer, pypdfium2 등)를 포함
  - `C드라이브/사용자/<사용자이름>/.doc_to_benchmark/ocr_agent/data` 경로에 리포트/로그/중간 산출물을 보관
  - 사용자가 입력한 Solar API 키로 주입해 Upstage API를 호출
- **Frontend (Node 20+, npm 10+)**
  - Vite + React 18 + TypeScript + Tailwind CSS 4
  - React Router 7 및 React Query 5 기반의 클라이언트 라우팅/데이터 상태 관리
  - Mermaid, Recharts, Lucide, Radix UI 컴포넌트로 벤치마크 결과를 시각화
  - `frontend/src/lib/api-client.ts`가 `/api` 엔드포인트와 직렬화 규칙을 캡슐화하고, 업로드 시 API 키를 헤더로 추가

## 빠른 시작

### 1. 기본 요구 사항

- Python 3.10 이상
- Node.js 20 이상 / npm 10 이상

### 2. 백엔드 설치 및 실행

```bash
python -m venv .venv
source .venv/bin/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -e .

# 개발용 라이브 리로드
doc-to-benchmark --reload --host 127.0.0.1 --port 8000
```

서버 최초 실행 시 `C드라이브/사용자/<사용자이름>/.doc_to_benchmark` 하위에 업로드 스토리지와 SQLite 데이터베이스(`app.db`)가 생성됩니다.

### 3. 프론트엔드 개발 서버

```bash
cd frontend
npm install
npm run dev
```

Vite 개발 서버는 `/api/*` 요청을 FastAPI(기본 8000번 포트)로 프록시합니다. 브라우저에서 `http://localhost:5173`으로 접속하면 업로드/분석 UI를 확인할 수 있습니다.

### 4. 프로덕션 번들

- 프론트엔드: `npm run build`
- 백엔드: `doc-to-benchmark --host 0.0.0.0 --port 8000`

패키지 배포 시 `setup.py`의 커스텀 `build_py` 명령이 `scripts/build_frontend.py`를 호출하여 Vite 빌드 결과를 `src/doc_to_benchmark/static/`에 복사합니다.

## 환경 변수 및 구성

| 변수                       | 기본값                        | 설명                                                                                  |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| `DOC_TO_BENCHMARK_STORAGE` | `~/.doc_to_benchmark/uploads` | 업로드 파일, 메타데이터(`metadata.json`), SQLite DB(`../app.db`)가 저장되는 루트 경로 |
| `SKIP_FRONTEND_BUILD`      | unset                         | `python -m build` 실행 시 값이 `1`이면 Vite 빌드를 건너뜁니다                         |

업로드 API는 항상 `x-ocr-api-key: <YOUR_SOLAR_API_KEY>` 헤더를 요구합니다. 키가 없거나 유효하지 않으면 401 오류가 반환됩니다.

## REST API 개요

| Method | Endpoint                                 | 설명                                                                                   |
| ------ | ---------------------------------------- | -------------------------------------------------------------------------------------- |
| `GET`  | `/api/documents`                         | 업로드된 문서의 요약 목록과 추천/선택 전략 정보를 반환                                 |
| `GET`  | `/api/analysis-items`                    | LLM이 생성한 Q&A 분석 항목을 문서명과 함께 반환                                        |
| `GET`  | `/api/documents/{document_id}/insights`  | 페이지 미리보기, 제공자별 벤치마크, 에이전트 상태, Mermaid 차트를 포함한 상세 인사이트 |
| `PUT`  | `/api/documents/{document_id}/selection` | 특정 문서에 대해 선택한 OCR 전략을 업데이트                                            |
| `POST` | `/api/uploads`                           | 단일 파일 업로드 및 즉시 OCR 파이프라인 실행 (`file`, 헤더 `x-ocr-api-key` 필요)       |
| `GET`  | `/api/uploads`                           | `/api/documents`와 동일한 데이터를 반환하는 레거시 엔드포인트                          |

API 응답/요청 스키마는 `src/doc_to_benchmark/schemas.py`에서 정의되며, 프론트엔드 매핑은 `frontend/src/lib/api-client.ts`를 참고하세요.

## 데이터베이스와 스토리지

- SQLite 데이터베이스는 스토리지 루트 상위에 `app.db` 파일로 생성되며, SQLAlchemy 비동기 세션(`async_sessionmaker`)을 통해 접근합니다.
- 스키마는 앱 시작 시 자동 생성/보정되며, 문서·페이지·페이지별 OCR 결과·에이전트 상태를 저장합니다.
- 업로드된 원본 파일과 JSON 메타데이터는 `metadata.json`으로 관리되어 CLI/테스트에서 쉽게 열람할 수 있습니다.

## 개발 및 품질 관리

- 프론트엔드 정적 분석: `npm run lint`
- 프론트엔드 프로덕션 번들 검증: `npm run build`
- 백엔드: 아직 pytest 스위트는 제공되지 않으며, FastAPI를 실행한 뒤 실제 업로드를 통해 시나리오를 검증할 수 있습니다.
- 에이전트 통합 상세는 `docs/ocr_agent_integration_notes.md`에 기록되어 있습니다.

## 배포 노트

1. `python -m build`로 wheel/sdist를 생성하면 Vite 빌드 결과가 패키지에 자동 포함됩니다.
2. 필요 시 `SKIP_FRONTEND_BUILD=1 python -m build`로 프론트 빌드를 생략할 수 있습니다.
3. 배포 후에는 `doc-to-benchmark` 콘솔 명령으로 서버를 실행하면 정적 SPA가 FastAPI와 동일한 프로세스에서 제공됩니다.

## 라이선스

MIT License를 사용하고 있습니다.
