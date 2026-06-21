import type { QbRequest } from "@/types/query";

import "./Preview.scss";

interface PreviewProps {
  request: QbRequest;
}

export const Preview: React.FC<PreviewProps> = ({ request }) => {
  return (
    <section id="qb-preview">
      <div className="qb-section-header">
        <h2>Preview</h2>
      </div>
      <pre>{JSON.stringify(request, null, 2)}</pre>
    </section>
  );
};
