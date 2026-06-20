import type { QbRequest } from "@/types/query";

import "./Preview.scss";

interface PreviewProps {
  request: QbRequest;
}

export const Preview: React.FC<PreviewProps> = ({ request }) => {
  return (
    <div id="qb-preview">
      <h2>Preview</h2>
      <pre>{JSON.stringify(request, null, 2)}</pre>
    </div>
  );
};
