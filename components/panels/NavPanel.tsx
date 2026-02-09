import { useLayout } from "@/context/layoutContext";

export const NavPanel = () => {
    const { currentPage, pages, setCurrentPage } = useLayout();

    return (
    <div className="h-full bg-gray-800 text-white p-4">
        {pages.map(p => (
            <button
                key={p.id}
                className={`block w-full text-left p-1 ${
                    currentPage.id === p.id ? "bg-blue-500 text-white" : ""
                }`}
                onClick={() => setCurrentPage(p.id)}
            >
                {p.id}
            </button>
        ))}
    </div>
    )
};
