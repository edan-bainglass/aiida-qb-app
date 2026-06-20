import { Button, Col, Form, Row } from "react-bootstrap";

import "./QbControls.scss";

interface QbControlsProps {
  limit: number;
  setLimit: (limit: number) => void;
  offset: number;
  setOffset: (offset: number) => void;
  distinct: boolean;
  setDistinct: (distinct: boolean) => void;
  disabled: boolean;
}

export const QbControls: React.FC<QbControlsProps> = ({
  limit,
  setLimit,
  offset,
  setOffset,
  distinct,
  setDistinct,
  disabled,
}) => {
  return (
    <div id="qb-query-controls">
      <Row className="g-3 align-items-center">
        <Col md={9} id="qb-query-options">
          <Form.Label>Limit</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={limit}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setLimit(Number(event.target.value))
            }
          />
          <Form.Label>Offset</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={offset}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setOffset(Number(event.target.value))
            }
          />
          <Form.Check
            type="switch"
            label="Distinct"
            checked={distinct}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setDistinct(event.target.checked)
            }
          />
        </Col>
        <Col md={3} id="qb-query-submit">
          <Button type="submit" size="lg" variant="dark" disabled={disabled}>
            Run Query
          </Button>
        </Col>
      </Row>
    </div>
  );
};
