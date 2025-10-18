import { Bot, FileBarChart, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { FeatureGrid, HomeHeader, HomeLayout, UploadCalloutCard } from "@/components/home";

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: "OCR 분석",
      description: "고정밀 OCR로 문서의 텍스트를 정확하게 추출합니다",
    },
    {
      icon: <Bot className="h-6 w-6 text-primary" />,
      title: "AI 챗봇",
      description: "LLM이 자동으로 질문과 답변을 생성합니다",
    },
    {
      icon: <FileBarChart className="h-6 w-6 text-primary" />,
      title: "리포트 생성",
      description: "분석 결과를 종합하여 상세 리포트를 제공합니다",
    },
  ];

  return (
    <HomeLayout>
      <div className="mx-auto flex max-w-4xl flex-col gap-8 text-center">
        <HomeHeader
          title="Multi-Agent 기반"
          highlight="문서 처리 자동화"
          description="Planner, Judge, Parsing, Refiner, Reporter로 구성된 Multi-Agent 구조로 문서 분석을 자동화합니다"
        />

        <UploadCalloutCard onClick={() => navigate("/upload")} />

        <FeatureGrid features={features} />
      </div>
    </HomeLayout>
  );
};

export default Home;
