import { useParams } from "react-router";
import MarkdownViewPage from "../components/MarkdownViewPage/MarkdownViewPage";
import { useSummary } from "../utils/api";

export default function Summary() {
  const { id } = useParams();
  return id ? <SummaryView id={id} /> : <>Not Found</>;
}

function SummaryView({ id }: { id: string }) {
  const summaryData = useSummary(id);

  return summaryData?.data ? (
    <MarkdownViewPage
      title={`Summary for \u201c${summaryData.title}\u201d`}
      markdownContent={summaryData.data}
    />
  ) : (
    <>Loading...</>
  );
}
