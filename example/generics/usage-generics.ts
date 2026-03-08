import {generateUserSummaryApiEnvelope, generateUserSummaryConnection} from "./data-gen-generics";

const envelope = generateUserSummaryApiEnvelope({
  error: undefined,
});

const connection = generateUserSummaryConnection(() => ({
  edges: [
    {
      node: envelope.data,
      cursor: "cursor-1",
    },
  ],
}));

console.log(envelope.requestId, connection.edges.length);
