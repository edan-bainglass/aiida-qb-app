import type { QueryBuilderRequest } from "@/types/query";

import "./QueryBuilderPreview.scss";

export const QueryBuilderPreview: React.FC<QueryBuilderPreviewProps> = ({
  request,
}) => {
  return (
    <div id="qb-preview">
      <h2>Preview</h2>
      <pre>{JSON.stringify(request, null, 2)}</pre>
    </div>
  );
};

interface QueryBuilderPreviewProps {
  request: QueryBuilderRequest;
}
