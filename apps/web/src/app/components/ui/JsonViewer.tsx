import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

type JsonViewerProps = {
  value: unknown;
  className?: string;
  defaultExpandedDepth?: number;
};

const waxblockJsonStyles = {
  container: "wb-json-tree",
  basicChildStyle: "wb-json-node",
  childFieldsContainer: "wb-json-children",
  label: "wb-json-label",
  clickableLabel: "wb-json-label",
  nullValue: "wb-json-null",
  undefinedValue: "wb-json-null",
  stringValue: "wb-json-string",
  booleanValue: "wb-json-boolean",
  numberValue: "wb-json-number",
  otherValue: "wb-json-other",
  punctuation: "wb-json-punctuation",
  collapseIcon: "wb-json-icon",
  expandIcon: "wb-json-icon",
  collapsedContent: "wb-json-collapsed",
  noQuotesForStringValues: false,
  quotesForFieldNames: false,
  ariaLables: {
    collapseJson: "collapse JSON",
    expandJson: "expand JSON",
  },
  stringifyStringValues: false,
};

const JsonViewer = ({ value, className }: JsonViewerProps) => (
  <div className={`wb-json-viewer ${className || ""}`}>
    <JsonView
      data={value as object}
      shouldExpandNode={() => true}
      style={waxblockJsonStyles}
      beforeExpandChange={() => false}
    />
  </div>
);

export default JsonViewer;
