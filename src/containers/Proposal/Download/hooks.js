import { useState } from "react";
import * as act from "src/actions";
import fileDownload from "js-file-download";
import { useAction } from "src/redux";
import useFetchMachine from "src/hooks/utils/useFetchMachine";
import {
  handleSaveVotesTimetamps,
  loadVotesTimestamps
} from "src/lib/local_storage";

// TODO: annouce I am finished with the PR and ask if the user will
// only be able to download the votes when voting period has ended.
export function useDownloadVoteTimestamps(token, totalVotes) {
  const [timestamps, setTimestamps] = useState(null);
  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState(0);
  const onFetchTicketVoteTimestamps = useAction(
    act.onFetchTicketVoteTimestamps
  );

  const [
    state,
    send,
    { START, VERIFY, FETCH, RESOLVE, REJECT }
  ] = useFetchMachine({
    actions: {
      initial: () => {
        const ts = loadVotesTimestamps(token);
        if (ts?.length === totalVotes) {
          return send(RESOLVE, { timestamps: ts });
        }
        if (token && !timestamps) {
          return send(START);
        }
        return;
      },
      start: () => {
        // fetch first page of vote timestamps
        onFetchTicketVoteTimestamps(token, page)
          .then((resp) => {
            setTimestamps(resp.votes);
            setPage(page + 1);
            return send(VERIFY);
          })
          .catch((e) => send(REJECT, e));

        return send(FETCH);
      },
      verify: () => {
        if (timestamps?.length === totalVotes) {
          // all timestamps loaded, resolve
          handleSaveVotesTimetamps(token, timestamps);
          fileDownload(
            JSON.stringify(timestamps, null, 2),
            `${token}-votes-timestamps.json`
          );
          return send(RESOLVE, { timestamps });
        } else {
          onFetchTicketVoteTimestamps(token, page)
            .then((resp) => {
              if (resp.votes) {
                setTimestamps([...timestamps, ...resp.votes]);
              } else {
                return send(REJECT, "fetching outbound vote pages");
              }
              setProgress(((timestamps.length * 100) / totalVotes).toFixed(2));
              setPage(page + 1);
              return send(VERIFY);
            })
            .catch((e) => {
              send(REJECT, e);
            });
          return send(FETCH);
        }
      }
    },
    initialValues: {
      status: "idle",
      loading: false,
      timestamps: null,
      progress: 0
    }
  });

  return {
    loading: state.loading || state.verifying,
    error: state.error,
    progress: progress,
    timestamps: state.timestamps
  };
}
