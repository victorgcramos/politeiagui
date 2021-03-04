import React from "react";
import { Button, useMediaQuery } from "pi-ui";
import { withRouter } from "react-router-dom";
import MultipleContentPage from "src/components/layout/MultipleContentPage";
import ProposalEdit from "src/containers/Proposal/Edit";
import { PROPOSAL_STATE_UNVETTED } from "src/constants";

const PageProposalEdit = ({ history, match }) => {
  const mobile = useMediaQuery("(max-width: 560px)");

  const CancelButton = () => (
    <Button
      type="button"
      kind="secondary"
      size={mobile ? "sm" : "md"}
      onClick={() => history.push(`/record/unvetted/${match.params.token}`)}>
      Cancel
    </Button>
  );

  return (
    <MultipleContentPage topBannerHeight={90}>
      {({ TopBanner, PageDetails, Main }) => (
        <>
          <TopBanner>
            <PageDetails
              title="Edit Proposal"
              actionsContent={<CancelButton />}
            />
          </TopBanner>
          <Main fillScreen>
            <ProposalEdit state={PROPOSAL_STATE_UNVETTED} />
          </Main>
        </>
      )}
    </MultipleContentPage>
  );
};

export default withRouter(PageProposalEdit);
