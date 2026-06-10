import type { QbRequest } from "@/types/query";

import "./QbPreview.scss";

export const QbPreview: React.FC<QbPreviewProps> = ({ request }) => {
  return (
    <div id="qb-preview">
      <h2>Preview</h2>
      <pre>{JSON.stringify(request, null, 2)}</pre>
    </div>
  );
};

interface QbPreviewProps {
  request: QbRequest;
}
