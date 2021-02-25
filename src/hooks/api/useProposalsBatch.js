import { useCallback, useMemo, useState } from "react";
import * as sel from "src/selectors";
import * as act from "src/actions";
import { or } from "src/lib/fp";
import { useSelector, useAction } from "src/redux";
import useThrowError from "src/hooks/utils/useThrowError";
import useFetchMachine, {
  VERIFY,
  FETCH,
  REJECT,
  RESOLVE,
  START
} from "src/hooks/utils/useFetchMachine";
import values from "lodash/fp/values";
import compact from "lodash/fp/compact";
import uniq from "lodash/fp/uniq";
import map from "lodash/fp/map";
import reduce from "lodash/fp/reduce";
import flow from "lodash/fp/flow";
import take from "lodash/fp/take";
import takeRight from "lodash/fp/takeRight";
import isEmpty from "lodash/fp/isEmpty";
import keys from "lodash/fp/keys";
import difference from "lodash/fp/difference";
import isEqual from "lodash/fp/isEqual";
import {
  PROPOSAL_STATE_VETTED,
  PROPOSAL_STATE_UNVETTED,
  INVENTORY_PAGE_SIZE,
  PROPOSAL_PAGE_SIZE
} from "src/constants";
import {
  getRfpLinkedProposals,
  getProposalStatusLabel
} from "src/containers/Proposal/helpers";

const getRfpLinks = (proposals) =>
  flow(
    values,
    map((p) => p.linkto),
    uniq,
    compact
  )(proposals);

const getRfpSubmissions = (proposals) =>
  flow(
    values,
    reduce((acc, p) => [...acc, ...(p.linkedfrom || [])], []),
    uniq,
    compact
  )(proposals);

const getUnfetchedTokens = (proposals, tokens) =>
  difference(tokens)(keys(proposals));

const getTokensForProposalsPagination = (tokens) => [
  take(PROPOSAL_PAGE_SIZE)(tokens),
  takeRight(tokens.length - PROPOSAL_PAGE_SIZE)(tokens)
];

const getCurrentPage = (tokens) => {
  return tokens ? Math.floor(+tokens.length / INVENTORY_PAGE_SIZE) : 0;
};
// XXX add includefiles options param ?
export default function useProposalsBatch({
  fetchRfpLinks,
  fetchVoteSummaries = false,
  unvetted = false,
  proposalStatus,
  allowFetch = true
}) {
  const recordState = useMemo(
    () => (unvetted ? PROPOSAL_STATE_UNVETTED : PROPOSAL_STATE_VETTED),
    [unvetted]
  );
  const [remainingTokens, setRemainingTokens] = useState([]);
  const [{ isVoteStatus, value: status }, setStatus] = useState({});
  const proposals = useSelector(sel.proposalsByToken);
  const voteSummaries = useSelector(sel.summaryByToken);
  const allByStatus = useSelector(sel.allByStatus);
  // console.log(status, allByStatus[getProposalStatusLabel(status)]);
  const page = useMemo(() => {
    const tokens = allByStatus[getProposalStatusLabel(status, isVoteStatus)];
    return getCurrentPage(tokens);
  }, [status, isVoteStatus, allByStatus]);

  const errorSelector = useMemo(
    () => or(sel.apiProposalsBatchError, sel.apiPropsVoteSummaryError),
    []
  );
  const error = useSelector(errorSelector);
  const tokenInventory = useSelector(sel.tokenInventory);

  const onFetchProposalsBatch = useAction(act.onFetchProposalsBatch);
  const onFetchTokenInventory = useAction(act.onFetchTokenInventory);

  const hasRemainingTokens = !isEmpty(remainingTokens);

  const [state, send] = useFetchMachine({
    actions: {
      initial: () => {
        if (!tokenInventory) {
          return send(START);
        }
        return send(VERIFY);
      },
      start: () => {
        const needsVerification = hasRemainingTokens || (status && page === 0);
        console.log("vai carregar o status", status, isVoteStatus, page);
        if (needsVerification) return send(VERIFY);
        onFetchTokenInventory(recordState, status, page + 1)
          .catch((e) => send(REJECT, e))
          .then(([proposals, votes]) => {
            // fetch proposal for given status
            const proposalStatusLabel = getProposalStatusLabel(
              proposalStatus ? proposalStatus.value : 1,
              proposalStatus && proposalStatus.isVoteStatus
            );
            const tokens = (proposalStatus && proposalStatus.isVoteStatus
              ? votes
              : proposals)[recordState][proposalStatusLabel];
            setRemainingTokens(tokens);
            return send(VERIFY);
          });
        return send(FETCH);
      },
      verify: () => {
        if (hasRemainingTokens) {
          // console.log("rem remaining tokens");
          const [fetch, next] = getTokensForProposalsPagination(
            remainingTokens
          );
          onFetchProposalsBatch(fetch, recordState, fetchVoteSummaries)
            .then(([proposals]) => {
              if (fetchRfpLinks) {
                const rfpLinks = getRfpLinks(proposals);
                const rfpSubmissions = getRfpSubmissions(proposals);
                const unfetchedRfpLinks = getUnfetchedTokens(proposals, [
                  ...rfpLinks,
                  ...rfpSubmissions
                ]);
                if (!isEmpty(unfetchedRfpLinks)) {
                  onFetchProposalsBatch(
                    unfetchedRfpLinks,
                    PROPOSAL_STATE_VETTED, // RFP linked proposals will always be vetted
                    fetchVoteSummaries
                  )
                    .then(() => send(RESOLVE))
                    .catch((e) => send(REJECT, e));
                  return send(FETCH);
                }
              }
              setRemainingTokens(next);
              return send(RESOLVE);
            })
            .catch((e) => send(REJECT, e));
          return send(FETCH);
        }
        return send(RESOLVE, { proposals });
      },
      done: () => {}
    },
    initialValues: {
      status: "idle",
      loading: true,
      proposals: {},
      proposalsTokens: {},
      verifying: true
    }
  });

  const onRestartMachine = (newStatus) => {
    const newStatusLabel = getProposalStatusLabel(
      newStatus.value,
      newStatus.isVoteStatus
    );
    const unfetchedTokens = getUnfetchedTokens(proposals, [
      ...(allByStatus[newStatusLabel] || []),
      ...(remainingTokens || [])
    ]);
    setRemainingTokens(unfetchedTokens);
    setStatus(newStatus);
    return send(START);
  };

  const onFetchMoreProposals = useCallback(() => send(VERIFY), [send]);

  const anyError = error || state.error;
  useThrowError(anyError);

  return {
    proposals: getRfpLinkedProposals(proposals, voteSummaries),
    onFetchProposalsBatch,
    proposalsTokens: allByStatus,
    loading: state.loading,
    verifying: state.verifying,
    onRestartMachine,
    onFetchMoreProposals,
    machineCurrentState: state.status
  };
}
