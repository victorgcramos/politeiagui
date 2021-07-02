import compose from "lodash/fp/compose";
import update from "lodash/fp/update";
import keys from "lodash/fp/keys";
import reduce from "lodash/fp/reduce";
import * as act from "src/actions/types";
import {
  // status
  RECORD_STATUSES,
  RECORD_STATUS_INVALID,
  RECORD_STATUS_UNREVIEWED,
  RECORD_STATUS_PUBLIC,
  RECORD_STATUS_CENSORED,
  RECORD_STATUS_ARCHIVED,
  // state
  RECORD_STATES,
  RECORD_STATE_INVALID,
  RECORD_STATE_UNVETTED,
  RECORD_STATE_VETTED
} from "src/core/constants";
import { TokenInventory } from "src/core/record";

const DEFAULT_STATE = {
  byToken: {},
  byStatus: {
    [RECORD_STATUSES[RECORD_STATUS_INVALID]]: [],
    [RECORD_STATUSES[RECORD_STATUS_UNREVIEWED]]: [],
    [RECORD_STATUSES[RECORD_STATUS_PUBLIC]]: [],
    [RECORD_STATUSES[RECORD_STATUS_CENSORED]]: [],
    [RECORD_STATUSES[RECORD_STATUS_ARCHIVED]]: []
  },
  byState: {
    [RECORD_STATES[RECORD_STATE_INVALID]]: [],
    [RECORD_STATES[RECORD_STATE_UNVETTED]]: [],
    [RECORD_STATES[RECORD_STATE_VETTED]]: []
  }
};

const updateInventory = (payload) => (inventory) => ({
  ...inventory,
  ...compose(
    reduce((inv, status) => {
      const inventoryTokens = inventory[status] || [];
      const payloadTokens = payload[status] || [];
      return {
        ...inv,
        [status]: TokenInventory([...inventoryTokens, ...payloadTokens])
      };
    }, {}),
    keys
  )(payload)
});

export const records = (state = DEFAULT_STATE, action) =>
  action.error
    ? state
    : {
        [act.RECEIVE_RECORD_INVENTORY]: () =>
          compose(update(["byStatus"], updateInventory))
      };
