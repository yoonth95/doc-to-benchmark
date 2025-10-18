import { Link } from "react-router-dom";

interface NotFoundCardProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  to?: string;
}

const NotFoundCard = ({
  title = "404",
  description = "요청한 페이지를 찾을 수 없습니다.",
  actionLabel = "홈으로 돌아가기",
  to = "/",
}: NotFoundCardProps) => (
  <div className="rounded-xl border border-border bg-card px-10 py-12 text-center shadow-lg">
    <h1 className="text-5xl font-bold text-primary">{title}</h1>
    <p className="mt-4 text-lg text-muted-foreground">{description}</p>
    <Link
      to={to}
      className="mt-6 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary to-secondary px-5 py-2 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
    >
      {actionLabel}
    </Link>
  </div>
);

export default NotFoundCard;
