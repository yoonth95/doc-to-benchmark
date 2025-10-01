import { RouteObject } from "react-router-dom";
import DefaultLayout from "@/layouts/DefaultLayout";
import Home from "@/pages/Home";
import Upload from "@/pages/Upload";
import Analysis from "@/pages/Analysis";
import Chat from "@/pages/Chat";
import Report from "@/pages/Report";
import OcrResult from "@/pages/OcrResult";
import NotFound from "@/pages/NotFound";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "upload", element: <Upload /> },
      { path: "ocr-result/:documentId", element: <OcrResult /> },
      { path: "analysis", element: <Analysis /> },
      { path: "chat/:chatRoomId", element: <Chat /> },
      { path: "report/:itemId", element: <Report /> },
    ],
  },
  { path: "*", element: <NotFound /> },
];
