import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { NotFoundCard, NotFoundLayout } from "@/components/not-found";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <NotFoundLayout>
      <NotFoundCard />
    </NotFoundLayout>
  );
};

export default NotFound;
