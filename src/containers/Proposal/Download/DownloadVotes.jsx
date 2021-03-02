import React, { useState } from "react";
import PropTypes from "prop-types";
import DownloadJSON from "src/components/DownloadJSON";
import { useDownloadVoteTimestamps } from "./hooks";
import { Spinner, Link } from "pi-ui";
import { loadVotesTimestamps } from "src/lib/local_storage";

const DownloadVotesWrapper = ({ label, recordToken, totalVotes }) => {
  const [start, setStart] = useState(false);

  const ts = loadVotesTimestamps(recordToken);
  const hasLoadedTimestamps = ts?.length === totalVotes;

  return start || hasLoadedTimestamps ? (
    <DownloadVotes recordToken={recordToken} totalVotes={totalVotes} />
  ) : (
    <Link onClick={() => setStart(true)}>{label}</Link>
  );
};

const DownloadVotes = ({ recordToken, totalVotes }) => {
  const { timestamps, progress, loading, error } = useDownloadVoteTimestamps(
    recordToken,
    totalVotes
  );

  return loading ? (
    <div>
      <span style={{ marginRight: 10 }}>{progress}%</span>
      <Spinner invert />
    </div>
  ) : timestamps ? (
    <DownloadJSON
      label={"Votes Timestamps"}
      fileName={`${recordToken}-votes-timestamps`}
      content={timestamps}
    />
  ) : error ? (
    <div>error: {error}</div>
  ) : null;
};

DownloadVotes.propTypes = {
  recordToken: PropTypes.string,
  label: PropTypes.string
};

export default DownloadVotesWrapper;
