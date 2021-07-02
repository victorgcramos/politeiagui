import reduce from "lodash/fp/reduce";
// const { string } = require("prop-types");
// import { RECORD_STATUSES } from "./constants";

// // A Record should have the following specs
// const record = {
//   state: number, //- unvetted/vetted
//   status: number, // - record status
//   version: number, //- version of the record
//   timestamp: number, // - last update
//   username: string, // - author username
//   metadata: array, // - metadata streams
//   files: array, // - user submitted files
//   censorshiprecord: {
//     // - token is a random censorship token that is generated by the
//     // server. It serves as a unique identifier for the record.
//     token: string,
//     // merkle is the ordered merkle root of all files in the record.
//     merkle: string,
//     // signature is the server signature of the Merkle+Token.
//     signature: string
//   }
// };
const SHORT_TOKEN_SIZE = 7;

const isEqualBySubstring =
  (b, length = SHORT_TOKEN_SIZE) =>
  (a) =>
    a.substring(0, length) === b.substring(0, length);

/**
 * Inventory returns a new Object with substring-keys accessors.
 * Example:
 * const a = Inventory({ abcdefghijk: "value a" })
 * a.abcdefg -> "value a"
 * a.abcdefghi -> "value a"
 * @param {Object} obj
 */
export function Inventory(obj) {
  return new Proxy(obj, {
    get(target, prop) {
      // if requested token exists
      if (target[prop]) return target[prop];
      // check if short token exists
      const key = Object.keys(target).find(isEqualBySubstring(prop));
      return key ? target[key] : undefined;
    },
    set(target, prop, value) {
      const key = Object.keys(target).find(isEqualBySubstring(prop));
      if (key) {
        target[key] = value;
        return true;
      }
      target[prop] = value;
      return true;
    }
  });
}

/**
 * TokenInventory returns an array without duplicated-prefix elements.
 * Only the first element will be preserved, and the rest will get deleted.
 * Example:
 * const a = TokenInventory(["abcdefg", "abcdefghij", "abcdefgdoaihsoihdoih", "qwerty"])
 * a -> ["abcdefg", "qwerty"]
 * @param {Array} arr
 */
export function TokenInventory(arr = []) {
  return reduce(function removeDuplicatedItems(acc, v) {
    const index = acc.findIndex(isEqualBySubstring(v));
    if (index !== -1) {
      return acc;
    }
    return [...acc, v];
  }, [])(arr);
}
