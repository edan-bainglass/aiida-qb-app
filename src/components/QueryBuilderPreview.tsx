import type { QueryBuilderRequest } from "@/types/query";

export const QueryBuilderPreview: React.FC<QueryBuilderPreviewProps> = ({
  request,
}) => {
  return (
    <div className="qb-preview">
      <h2>Preview</h2>
      <pre>{JSON.stringify(request, null, 2)}</pre>
    </div>
  );
};

interface QueryBuilderPreviewProps {
  request: QueryBuilderRequest;
}
