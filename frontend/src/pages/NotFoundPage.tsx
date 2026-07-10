import { Link } from "react-router-dom";
import { FolderKanban } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#041421]">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#042630] text-[#4c7273]">
        <FolderKanban size={32} />
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-[#d0d6d6]">404</h1>
      <p className="mt-2 text-sm text-[#4c7273]">Page not found</p>
      <Link
        to="/"
        className="pf-btn-primary mt-6"
      >
        Back to Board
      </Link>
    </div>
  );
}