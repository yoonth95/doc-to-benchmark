import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface GeneratedQA {
  question: string;
  answer: string;
}

const defaultMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "안녕하세요! 문서 내용에 대해 질문해주세요. AI가 자동으로 생성한 질문과 답변도 제공합니다.",
    timestamp: new Date(),
  },
];

const generatedQAs: GeneratedQA[] = [
  {
    question: "이 문서의 주요 내용은 무엇인가요?",
    answer:
      "이 문서는 2023년 국가안전시스템 개편과 관련된 종합대책을 다루고 있으며, 지역안전관리 체계 강화 및 구조·구급 훈련 개선 사항을 포함하고 있습니다.",
  },
  {
    question: "2023년과 2022년의 주요 차이점은?",
    answer:
      "2023년에는 지역안전관리위원회 개최 횟수가 증가했으며, 신규 구조훈련 프로그램이 도입되었습니다. 또한 재난안전 상황관리 체계가 강화되었습니다.",
  },
  {
    question: "문서에서 언급된 개선사항은?",
    answer:
      "주요 개선사항으로는 회의 운영 절차 간소화, 훈련 프로그램 다양화, 그리고 상황관리 시스템의 실시간 모니터링 기능 강화가 있습니다.",
  },
];

const Chat = () => {
  const navigate = useNavigate();
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const pushAssistantMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content,
        timestamp: new Date(),
      },
    ]);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const question = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      pushAssistantMessage(
        `네, 문서를 분석한 결과입니다. ${question}에 대한 답변은 다음과 같습니다: 해당 내용은 문서의 주요 섹션에서 다루고 있으며, 세부적인 통계와 함께 설명되어 있습니다.`,
      );
    }, 1000);
  };

  const handleQuestionClick = (qa: GeneratedQA) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: qa.question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      pushAssistantMessage(qa.answer);
    }, 500);
  };

  return (
    <div className="flex h-full w-full overflow-y-auto bg-gradient-to-br from-background via-accent/30 to-background">
      <div className="container mx-auto flex-1 px-6 py-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/analysis")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">AI 챗봇</h2>
            <p className="text-sm text-muted-foreground">문서 ID: {chatRoomId}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-6">
          <aside className="w-80 space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">AI 생성 질문</h3>
              </div>
              <div className="space-y-3">
                {generatedQAs.map((qa, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(qa)}
                    className="w-full rounded-lg border border-transparent bg-muted/50 p-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-muted"
                  >
                    <p className="mb-1 font-medium">{qa.question}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{qa.answer}</p>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p
                      className={`mt-1 text-xs ${
                        message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5 text-foreground" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="bg-gradient-to-r from-primary to-secondary transition-opacity hover:opacity-90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Chat;
