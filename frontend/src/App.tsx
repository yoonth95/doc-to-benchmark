import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

import './index.css';

type UploadRecord = {
  id: string;
  original_name: string;
  stored_name: string;
  size_bytes: number;
  extension: string;
  uploaded_at: string;
};

type ApiError = {
  detail?: string;
};

const API_BASE = '/api/uploads';
const PDF_PROCESS_ENDPOINT = '/api/uploads/pdf/process';

const formatBytes = (size: number): string => {
  if (size === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** idx;
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const isPdfFile = (file: File): boolean => {
  const mime = file.type?.toLowerCase();
  return mime === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};

const parseDispositionFilename = (header: string | null): string | null => {
  if (!header) return null;
  const filenameStarMatch = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (filenameStarMatch) {
    try {
      return decodeURIComponent(filenameStarMatch[1]);
    } catch (error) {
      console.warn('Failed to decode filename* header', error);
    }
  }
  const filenameMatch = header.match(/filename="?([^";]+)"?/i);
  return filenameMatch ? filenameMatch[1] : null;
};

const buildProcessedFilename = (original: string): string => {
  const base = original.replace(/\.pdf$/i, '') || 'document';
  return `${base}_processed.pdf`;
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const parseErrorResponse = async (response: Response, fallback: string): Promise<string> => {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const body: ApiError = await response.json();
      if (body.detail) return body.detail;
    } catch (error) {
      console.warn('Failed to parse error response as JSON', error);
    }
  } else {
    try {
      const text = await response.text();
      if (text) return text;
    } catch (error) {
      console.warn('Failed to read error response as text', error);
    }
  }
  return fallback;
};

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadUploads = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE);
      if (!response.ok) {
        throw new Error('업로드 목록을 불러오지 못했습니다.');
      }
      const data: UploadRecord[] = await response.json();
      setUploads(data);
      setErrorMessage(null);
    } catch (error) {
      console.error(error);
      setErrorMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUploads();
  }, [loadUploads]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    setSelectedFiles((prev) => {
      const uniqueFiles = incoming.filter(
        (file) => !prev.some((item) => item.name === file.name && item.size === file.size),
      );
      if (uniqueFiles.length === 0) {
        return prev;
      }
      return [...prev, ...uniqueFiles];
    });
  }, []);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const onDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const uploadSelected = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      setErrorMessage(null);
      const pdfFiles = selectedFiles.filter(isPdfFile);
      const otherFiles = selectedFiles.filter((file) => !isPdfFile(file));

      for (const pdf of pdfFiles) {
        const formData = new FormData();
        formData.append('file', pdf);
        const response = await fetch(PDF_PROCESS_ENDPOINT, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const message = await parseErrorResponse(response, 'PDF 처리 중 오류가 발생했습니다.');
          throw new Error(message);
        }

        const blob = await response.blob();
        const header = response.headers.get('Content-Disposition');
        const downloadName = parseDispositionFilename(header) ?? buildProcessedFilename(pdf.name);
        triggerDownload(blob, downloadName);
      }

      if (otherFiles.length > 0) {
        const formData = new FormData();
        otherFiles.forEach((file) => {
          formData.append('files', file);
        });

        const response = await fetch(API_BASE, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const message = await parseErrorResponse(response, '업로드 중 오류가 발생했습니다.');
          throw new Error(message);
        }
      }

      setSelectedFiles([]);
      await loadUploads();
    } catch (error) {
      console.error(error);
      setErrorMessage((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const displayedUploads = useMemo(() => {
    return uploads.slice().sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
  }, [uploads]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">파일 업로드 데모</h1>
            <p className="mt-1 text-sm text-slate-600">
              파일을 업로드하고 이름, 확장자, 용량, 업로드 시간을 확인하세요.
            </p>
          </div>
          <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
            React + FastAPI
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl grow flex-col gap-6 px-6 py-8">
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
          <label
            htmlFor="file-input"
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-transparent bg-slate-50 px-6 py-12 text-center transition hover:bg-slate-100"
          >
            <div className="rounded-full bg-brand/10 p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                fill="none"
                className="h-8 w-8 text-brand"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5V3m0 0-3.75 3.75M12 3l3.75 3.75M4.5 16.5v3.75h15V16.5"
                />
              </svg>
            </div>
            <div>
              <p className="text-base font-medium text-slate-900">
                파일을 드래그하거나 클릭해서 선택하세요
              </p>
              <p className="mt-1 text-sm text-slate-500">여러 파일을 동시에 업로드할 수 있습니다.</p>
            </div>
            <input
              id="file-input"
              type="file"
              multiple
              className="hidden"
              onChange={onInputChange}
            />
          </label>

          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">
                  선택된 파일 {selectedFiles.length}개
                </h2>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-sm font-medium text-brand hover:text-brand-dark"
                >
                  선택 초기화
                </button>
              </div>
              <ul className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
                {selectedFiles.map((file) => (
                  <li key={`${file.name}-${file.size}`} className="flex items-center justify-between bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                    </div>
                    <p className="text-xs uppercase text-slate-400">{file.name.includes('.') ? file.name.split('.').pop() : '—'}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={uploadSelected}
                  disabled={uploading}
                  className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {uploading ? '업로드 중…' : '업로드'}
                </button>
              </div>
            </div>
          )}
        </section>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-700">업로드 이력</h2>
          </header>
          <div className="relative">
            {loading ? (
              <div className="flex items-center justify-center px-6 py-16 text-sm text-slate-500">
                업로드 정보를 불러오는 중입니다…
              </div>
            ) : displayedUploads.length === 0 ? (
              <div className="flex items-center justify-center px-6 py-16 text-sm text-slate-500">
                아직 업로드된 파일이 없습니다.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      파일명
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      확장자
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      용량
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      업로드 시간
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayedUploads.map((upload) => (
                    <tr key={upload.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-900">
                        {upload.original_name}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {upload.extension || '-'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatBytes(upload.size_bytes)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {dateFormatter.format(new Date(upload.uploaded_at))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
