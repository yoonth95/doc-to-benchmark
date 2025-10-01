import { useState, useCallback } from "react";
import { Upload as UploadIcon, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { setOcrResults } from "@/lib/ocrStore";

const Upload = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcess = () => {
    if (files.length === 0) {
      toast.error("파일을 먼저 업로드해주세요");
      return;
    }

    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      const processedDate = new Date();
      const processedAt = processedDate.toISOString();
      const processedTimeLabel = processedDate.toLocaleTimeString("ko-KR");
      const ocrResults = files.map((file, index) => {
        const sizeMB = Number((file.size / 1024 / 1024).toFixed(2));
        const baseName = file.name.replace(/\.[^/.]+$/, "");

        const samplePages = [
          {
            pageNumber: 1,
            text: `제목: ${baseName}\n\n요약\n- 본 문서는 업로드된 자료를 기반으로 Multi-Agent 시스템이 선 처리한 OCR 결과입니다.\n- 페이지 전반에 걸쳐 핵심 키워드와 문단 구조를 보존하도록 정제되었습니다.\n- 추가 검수 시 오탈자나 누락된 항목을 보완해주세요.`,
          },
          {
            pageNumber: 2,
            text: `세부 내용\n1. OCR 처리 시간: ${processedTimeLabel}\n2. 추정 카테고리: 행정/정책 문서\n3. 주요 문장\n   • ${baseName}의 핵심 정책 방향과 실행 계획 요약\n   • 주관 부처 및 협업 기관 언급\n   • 향후 일정 및 후속 조치 제안\n\nNOTE: 필요한 경우 페이지 단위로 텍스트를 복사하여 편집 툴에 반영하세요.`,
          },
        ];

        const confidence = Math.min(99, Math.max(82, Math.round(88 + Math.random() * 8)));

        return {
          id: `${processedAt}-${index}`,
          fileName: file.name,
          sizeMB,
          processedAt,
          language: "한국어",
          confidence,
          pages: samplePages,
        };
      });

      toast.success("문서 처리가 완료되었습니다");
      setOcrResults(ocrResults);
      setIsProcessing(false);
      setFiles([]);
      const firstDocumentId = ocrResults[0]?.id;
      if (firstDocumentId) {
        navigate(`/ocr-result/${firstDocumentId}`, { state: { ocrResults } });
      } else {
        navigate("/analysis");
      }
    }, 2000);
  };

  return (
    <div className="flex h-full w-full overflow-y-auto bg-gradient-to-br from-background via-accent/30 to-background">
      <div className="container mx-auto flex-1 px-5 py-5">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">문서 업로드</h2>
            <p className="text-muted-foreground">
              분석할 문서를 업로드하고 Multi-Agent 시스템으로 처리하세요
            </p>
          </div>

          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 bg-card"
            }`}
          >
            <div className="p-12 text-center space-y-6">
              <div className="flex justify-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isDragging
                      ? "bg-primary/20 scale-110"
                      : "bg-gradient-to-br from-primary/10 to-secondary/10"
                  }`}
                >
                  <UploadIcon className="w-10 h-10 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  {isDragging ? "여기에 파일을 놓으세요" : "파일을 드래그하거나"}
                </h3>
                <p className="text-muted-foreground">PDF, DOCX, 이미지 파일 지원</p>
              </div>

              <div>
                <input
                  type="file"
                  id="file-input"
                  multiple
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <label htmlFor="file-input">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity cursor-pointer"
                    asChild
                  >
                    <span>파일 선택</span>
                  </Button>
                </label>
              </div>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">업로드된 파일 ({files.length})</h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="outline" size="lg" onClick={() => navigate("/")} className="flex-1">
              취소
            </Button>
            <Button
              size="lg"
              onClick={handleProcess}
              disabled={files.length === 0 || isProcessing}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                "문서 처리 시작"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
