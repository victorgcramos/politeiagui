import * as record from "../record";
import { inventory, records } from "./util";
// e49e07d512b2c830
// 3f07aff4c10ed45c

describe("core methods for records", () => {
  describe("Inventory", () => {
    const inv = record.Inventory(records);
    it("should return the correct record by short token", () => {
      expect(inv["daa0d54"].timestamp).toEqual(1625009327);
      expect(inv["5f1dc4e"].timestamp).toEqual(1625009345);
      expect(inv["daa0d"]).toEqual(undefined);
    });
    it("should return the correct record by full length tokens", () => {
      expect(inv["e49e07d512b2c830"].timestamp).toEqual(1625010754);
      expect(inv["3f07aff4c10ed45c"].timestamp).toEqual(1625010853);
    });
  });
  describe("TokenInventory", () => {
    const sameLength = record.TokenInventory([
      ...inventory.approved,
      "47b404b7451a1f20",
      "120dceca7740ef66",
      "fd83eab1cbc31b68"
    ]);
    const shortLength = record.TokenInventory([
      ...inventory.approved,
      "47b404b",
      "120dcec"
    ]);
    it("should return an array without duplicated values", () => {
      expect(sameLength.length).toEqual(3);
      expect(shortLength.length).toEqual(2);
    });
    it("should have only 1 element for repeated values", () => {
      const list = record.TokenInventory([
        "47b404b",
        "47b404baaa",
        "47b404bdasdasd"
      ]);
      expect(list.length).toEqual(1);
      expect(list.join("")).toEqual("47b404b");
    });
  });
});
