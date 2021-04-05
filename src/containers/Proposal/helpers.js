import {
  BLOCK_DURATION_MAINNET,
  BLOCK_DURATION_TESTNET,
  PROPOSAL_STATUS_PUBLIC,
  PROPOSAL_VOTING_ACTIVE,
  PROPOSAL_VOTING_NOT_AUTHORIZED,
  PROPOSAL_VOTING_AUTHORIZED,
  PROPOSAL_VOTING_FINISHED,
  PROPOSAL_VOTING_APPROVED,
  PROPOSAL_STATUS_ARCHIVED,
  PROPOSAL_STATUS_UNREVIEWED,
  PROPOSAL_STATUS_UNREVIEWED_CHANGES,
  PROPOSAL_STATUS_CENSORED,
  PROPOSAL_STATE_VETTED,
  PROPOSAL_STATE_UNVETTED,
  PRE_VOTE,
  AUTHORIZED,
  ACTIVE_VOTE,
  APPROVED,
  REJECTED,
  ARCHIVED,
  UNREVIEWED,
  PUBLIC,
  CENSORED,
  NOJS_ROUTE_PREFIX,
  PROPOSAL_VOTING_REJECTED,
  PROPOSAL_VOTING_INELIGIBLE,
  INELIGIBLE
} from "../../constants";
import { getTextFromIndexMd } from "src/helpers";
import set from "lodash/fp/set";
import values from "lodash/fp/values";
import pick from "lodash/pick";
import isEmpty from "lodash/fp/isEmpty";
import get from "lodash/fp/get";
import keys from "lodash/fp/keys";

/**
 * Returns the total amount of votes received by a given proposal voteSummary
 * @param {Object} voteSummary
 */
export const getVotesReceived = (voteSummary) => {
  if (!voteSummary || !voteSummary.results) {
    return 0;
  }
  return voteSummary.results.reduce(
    (totalVotes, option) => (totalVotes += option.votes),
    0
  );
};

/**
 * Return the votes quorum of a given proposal vote status
 * @param {Object} voteSummary
 */
export const getQuorumInVotes = (voteSummary) =>
  Math.trunc(
    (voteSummary.eligibletickets * voteSummary.quorumpercentage) / 100
  );

/**
 * Returns true if the given proposal is public
 * @param {Object} proposal
 * @returns {Boolean} isPublic
 */
export const isPublicProposal = (proposal) =>
  !!proposal && proposal.status === PROPOSAL_STATUS_PUBLIC;

/**
 * Returns true if the given proposal is an approved RFP
 * and it's deadline didn't expire yet
 * @param {Object} proposal
 * @param {Object} voteSummary
 * @returns {Boolean} isActiveApproved
 */
export const isActiveApprovedRfp = (proposal, voteSummary) =>
  isApprovedProposal(proposal, voteSummary) &&
  proposal.linkby &&
  isActiveRfp(proposal.linkby);

/**
 * Return true if RFP is still active and didn't expire
 * @param {number} linkby RFP deadline timestamp in seconds
 */
export const isActiveRfp = (linkby) =>
  Math.round(new Date().getTime() / 1000) < Number(linkby);

/**
 * Returns true if RFP's linkby meets the minimum period
 * @param {number} proposalLinkBy proposal linkBy as seconds unix
 * @param {number} minlinkbyperiod min possible linkby period as seconds unix
 * @returns {Boolean} isRfpReadyToVote
 */
export const isRfpReadyToVote = (proposalLinkBy, minlinkbyperiod) => {
  const currentTimeSec = new Date().getTime() / 1000;
  return Math.round(currentTimeSec + minlinkbyperiod) < proposalLinkBy;
};

/**
 * Returns true if RFP was approved & deadline already expired
 * which means RFP ready to start runoff vote
 * @param {Object} proposal
 * @param {Object} voteSummary
 * @returns {Boolean} isActiveApproved
 */
/// XXX revert me
export const isRfpReadyToRunoff = (
  proposal,
  voteSummary,
  rfpSubmissionsVoteSummaries
) => {
  const isSubmissionsPreVote =
    rfpSubmissionsVoteSummaries &&
    !isEmpty(rfpSubmissionsVoteSummaries) &&
    !Object.values(rfpSubmissionsVoteSummaries).some((vs) =>
      [
        PROPOSAL_VOTING_FINISHED,
        PROPOSAL_VOTING_APPROVED,
        PROPOSAL_VOTING_REJECTED,
        PROPOSAL_VOTING_ACTIVE
      ].includes(vs.status)
    );
  return (
    isApprovedProposal(proposal, voteSummary) &&
    isVotingFinishedProposal(voteSummary) &&
    proposal.linkby &&
    new Date().getTime() / 1000 > Number(proposal.linkby) &&
    isSubmissionsPreVote
  );
};
/**
 * Returns true if the given proposal is unreviewed
 * @param {Object} proposal
 * @returns {Boolean} isUnreviewed
 */
export const isUnreviewedProposal = (proposal) =>
  proposal.status === PROPOSAL_STATUS_UNREVIEWED ||
  proposal.status === PROPOSAL_STATUS_UNREVIEWED_CHANGES;

/**
 * Returns true if the given proposal is censored
 * @param {Object} proposal
 * @returns {Boolean} isCensored
 */
export const isCensoredProposal = (proposal) =>
  proposal?.status === PROPOSAL_STATUS_CENSORED;

/**
 * Returns true if the given proposal is public, but voting
 * is not authorized yet.
 * @param {Object} voteSummary
 * @returns {Boolean} isVotingNotAuthorized
 */
export const isVotingNotAuthorizedProposal = (voteSummary) =>
  !!voteSummary && voteSummary.status === PROPOSAL_VOTING_NOT_AUTHORIZED;

/**
 * Returns true if the given proposal is authorized for voting.
 * @param {Object} voteSummary
 * @returns {Boolean} isVotingAuthorized
 */
export const isVotingAuthorizedProposal = (voteSummary) =>
  !!voteSummary && voteSummary.status === PROPOSAL_VOTING_AUTHORIZED;

/**
 * Returns true if the given proposal is public, but voting
 * has finished already
 * @param {Object} voteSummary
 * @returns {Boolean} isVotingFinished
 */
export const isVotingFinishedProposal = (voteSummary) =>
  !!voteSummary &&
  (voteSummary.status === PROPOSAL_VOTING_FINISHED ||
    voteSummary.status === PROPOSAL_VOTING_APPROVED ||
    voteSummary.status === PROPOSAL_VOTING_REJECTED);

/**
 * Returns true if the given proposal is editable
 * @param {Object} proposal
 * @param {Object} voteSummary
 * @returns {Boolean} isEditable
 */
export const isEditableProposal = (proposal, voteSummary) =>
  isUnreviewedProposal(proposal) ||
  (isUnderDiscussionProposal(proposal, voteSummary) &&
    isVotingNotAuthorizedProposal(voteSummary));

/**
 * Returns true if the given proposal is under discussion
 * @param {Object} proposal
 * @param {Object} voteSummary
 * @returns {Boolean} isUnderDiscussion
 */
export const isUnderDiscussionProposal = (proposal, voteSummary) =>
  isPublicProposal(proposal) &&
  !isVoteActiveProposal(voteSummary) &&
  !isVotingFinishedProposal(voteSummary);

/**
 * Returns true if the given proposal is abandoned
 * @param {Object} proposal
 * @returns {Boolean} isAbandoned
 */
export const isAbandonedProposal = (proposal) =>
  !!proposal && proposal.status === PROPOSAL_STATUS_ARCHIVED;

/**
 * Returns true if the given proposal is approved
 * @param {Object} proposal
 * @param {Object} voteSummary
 * @returns {Boolean} isApproved
 */
export const isApprovedProposal = (proposal, voteSummary) => {
  if (!proposal || !voteSummary || !isPublicProposal(proposal)) {
    return false;
  }
  return voteSummary.status === PROPOSAL_VOTING_APPROVED;
};

/**
 * Returns true if the proposal vote is active
 * @param {Object} voteSummary
 * @returns {Boolean} isVoteActiceProposal
 */
export const isVoteActiveProposal = (voteSummary) =>
  !!voteSummary && voteSummary.status === PROPOSAL_VOTING_ACTIVE;

/**
 * Return the amount of blocks left to the end of the voting period
 * @param {Object} voteSummary
 * @param {Number} chainHeight
 * @returns {Number} number of blocks left
 */
export const getVoteBlocksLeft = (voteSummary, chainHeight) => {
  if (!voteSummary) return null;
  const { endblockheight } = voteSummary;
  return +endblockheight - chainHeight;
};

/**
 * Returns a timestamp of vote end date
 * @param {Object} voteSummary
 * @param {Number} chainHeight
 * @param {Boolean} isTestnet
 * @returns {Number}
 */
export const getVoteEndTimestamp = (voteSummary, chainHeight, isTestnet) => {
  if (!voteSummary) {
    return "";
  }
  const blocks = getVoteBlocksLeft(voteSummary, chainHeight);
  const blockTimeMinutes = isTestnet
    ? blocks * BLOCK_DURATION_TESTNET
    : blocks * BLOCK_DURATION_MAINNET;
  const mili = blockTimeMinutes * 60000;
  const dateMs = new Date(mili + Date.now());
  return Math.round(dateMs / 1000); // returns unix timestamp
};

/**
 * Returns the markdown content from an array of proposal files
 * @param {Array} files
 * @returns {String} markdownContent
 */
export const getMarkdownContent = (files) => {
  const markdownFile = files.find((f) => f.name === "index.md");
  return markdownFile ? getTextFromIndexMd(markdownFile) : "";
};

/**
 * Returns the proposal censorship token
 * @param {Object} proposal
 * @returns {String} censorhipToken
 */
export const getProposalToken = (proposal) =>
  proposal && proposal.censorshiprecord && proposal.censorshiprecord.token;

/**
 * Retruns the propsoal url using a given token
 * if full token is passed (64 chars hex) then first 7 chars used
 * @param {String} token proposal token
 * @param {boolean} isJsEnabled true if Javascript is enabled
 * @param {Number} state proposal state constant
 */
export const getProposalUrl = (token, isJsEnabled, state) => {
  const stateStr = state === PROPOSAL_STATE_VETTED ? "" : "/unvetted";
  return isJsEnabled
    ? `/record${stateStr}/${token.substring(0, 7)}`
    : `${NOJS_ROUTE_PREFIX}/record${stateStr}/${token}`;
};

/**
 * Retruns the url proposal's comments section using a given token
 * if full token is passed (64 chars hex) then first 7 chars used
 * @param {String} token proposal token
 * @param {boolean} isJsEnabled true if Javascript is enabled
 * @param {Number} state proposal state constant
 */
export const getCommentsUrl = (token, isJsEnabled, state) => {
  const stateStr = state === PROPOSAL_STATE_VETTED ? "" : "/unvetted";
  return isJsEnabled
    ? `/record${stateStr}/${token.substring(0, 7)}?scrollToComments=true`
    : `${NOJS_ROUTE_PREFIX}/record${stateStr}/${token}?scrollToComments=true`;
};

/**
 * Returns author's account URL
 * @param {String} userid author user id
 * @param {boolean} isJsEnabled true if Javascript is enabled
 */
export const getAuthorUrl = (userid, isJsEnabled) =>
  isJsEnabled ? `/user/${userid}` : `${NOJS_ROUTE_PREFIX}/user/${userid}`;

export const goToFullProposal = (history, proposalURL) => () =>
  history.push(proposalURL);

/**
 * Returns the proposal list with RFP Proposal linked to RFP submissions
 * @param {object} proposals
 */
export const getRfpLinkedProposals = (proposalsByToken, voteSummaries) =>
  values(proposalsByToken).reduce((acc, proposal) => {
    const isRfp = !!proposal.linkby;
    const isSubmission = !!proposal.linkto;
    if (!isSubmission && !isRfp) return acc;

    if (isSubmission) {
      const linkedProposal = proposalsByToken[proposal.linkto];
      if (!linkedProposal) return acc;
      return set(
        [getProposalToken(proposal), "proposedFor"],
        linkedProposal.name
      )(acc);
    }
    if (isRfp) {
      const linkedFrom = proposal.linkedfrom;
      const rfpSubmissions = linkedFrom && {
        proposals: values(pick(proposalsByToken, linkedFrom)),
        voteSummaries: pick(voteSummaries, linkedFrom)
      };
      return {
        ...acc,
        [getProposalToken(proposal)]: {
          ...proposal,
          rfpSubmissions
        }
      };
    }
    return acc;
  }, proposalsByToken);

/**
 * Returns a formatted proposal object including the rfp links for the given proposal
 * @param {object} proposal
 * @param {object} rfpSubmissions
 * @param {object} proposals
 */
export const getProposalRfpLinks = (proposal, rfpSubmissions, proposals) => {
  if (!proposal) return;
  const isRfp = !!proposal.linkby;
  const isSubmission = !!proposal.linkto;

  if (!isRfp && !isSubmission) return proposal;
  const hasRfpSubmissions = isRfp && rfpSubmissions;
  const isSubmissionWithProposals = isSubmission && !isEmpty(proposals);
  return hasRfpSubmissions
    ? { ...proposal, rfpSubmissions }
    : isSubmissionWithProposals
    ? { ...proposal, proposedFor: proposals[proposal.linkto].name }
    : proposal;
};

/**
 * Returns the formatted state string for given state value
 * @param {number} proposalState
 */
export const getProposalStateLabel = (proposalState) =>
  get(proposalState)({
    [PROPOSAL_STATE_VETTED]: "vetted",
    [PROPOSAL_STATE_UNVETTED]: "unvetted"
  });

/**
 * Returns the formatted status string for given status value.
 * @param {number} proposalStatus
 * @param {bool} isVotingStatus
 */
export const getProposalStatusLabel = (proposalStatus, isVotingStatus) =>
  get(proposalStatus)(
    isVotingStatus
      ? {
          [PROPOSAL_VOTING_NOT_AUTHORIZED]: PRE_VOTE,
          [PROPOSAL_VOTING_AUTHORIZED]: AUTHORIZED,
          [PROPOSAL_VOTING_ACTIVE]: ACTIVE_VOTE,
          [PROPOSAL_VOTING_APPROVED]: APPROVED,
          [PROPOSAL_VOTING_REJECTED]: REJECTED,
          [PROPOSAL_VOTING_INELIGIBLE]: INELIGIBLE
        }
      : {
          [PROPOSAL_STATUS_UNREVIEWED]: UNREVIEWED,
          [PROPOSAL_STATUS_ARCHIVED]: ARCHIVED,
          [PROPOSAL_STATUS_CENSORED]: CENSORED,
          [PROPOSAL_STATUS_PUBLIC]: PUBLIC
        }
  );

/**
 * Returns the url for given proposal
 * @param {obkect} proposal
 * @param {bool} isJsEnabled
 */
export const getProposalLink = (proposal, isJsEnabled) =>
  proposal
    ? getProposalUrl(
        proposal.censorshiprecord?.token,
        isJsEnabled,
        proposal.state
      )
    : "";

/**
 * Returns the object items for given token array, compared by given substring length.
 *
 * Ex: filterBatchObjectByTokenArraySubstring(["abcdefghijk"], { "abcdefg": obj, "tuvwxyz": obj2 }, 7)
 * returns: { "abcdefgijk": obj }
 *
 */
export const filterBatchObjectByTokenArraySubstring = (
  tokens,
  object,
  length = 7
) =>
  tokens.reduce((acc, t) => {
    const token = keys(object).find(
      (ot) => t.substring(0, length) === ot.substring(0, length)
    );
    return token ? { ...acc, [t]: object[token] } : acc;
  }, {});

/**
 * Returns the object items, whose keys compared by substring length,
 *    are not included on token list.
 * Ex: filterBatchObjectDiffByTokenArraySubstring(["abcdefghijk"], { "abcdefg": obj, "tuvwxyz": obj2 }, 7)
 * returns: { "tuvwxyz": obj2 }
 * @param {array} tokens
 * @param {object} object
 */
export const filterBatchObjectDiffByTokenArraySubstring = (
  tokens,
  object,
  length = 7
) =>
  tokens.filter(
    (t) =>
      !keys(object).some(
        (vs) => vs.substring(0, length) === t.substring(0, length)
      )
  );
