// import Promise from "promise";
import "isomorphic-fetch";
import { GET as API_GET, POST as API_POST, PUT as API_PUT } from "../api";
import get from "lodash/fp/get";

const apiBase = "/api/";
const apiRecords = `${apiBase}records/`;
const getResponse = get("response");

const POST = (...args) => API_POST(...args, apiRecords);
const GET = (...args) => API_GET(...args, apiRecords);
const PUT = (...args) => API_PUT(...args, apiRecords);

export const inventory = (state, status, page) =>
  POST("/inventory", "", { state, status, page }).then(getResponse);
