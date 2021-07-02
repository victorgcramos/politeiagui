import Promise from "promise";
import * as act from "src/actions/records";
import * as api from "src/lib/apiv2/records";
import * as pki from "src/lib/pki";

// fetchInventory loads the token inventory for given state, status and page.
export const onFetchInventory =
  ({ state, status, page = 0 }) =>
  (dispatch) => {
    dispatch(api.REQUEST_RECORD_INVENTORY);
    return api
      .inventory(state, status, page)
      .then(({ records }) => {
        console.log(records);
        dispatch(act.RECEIVE_RECORD_INVENTORY(records));
      })
      .catch((error) => {
        dispatch(act.REQUEST_RECORD_INVENTORY(null, error));
      });
  };

export const onFetchRecords = (requests) => (dispatch) => {};
