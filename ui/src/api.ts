import axios from "axios";

// let port = (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') ? 8000 : window.location.port;
// export const api = axios.create({
//   baseURL: `${window.location.protocol}//${window.location.hostname}:${port}/api/v1`,
// })
const port = "https://34.163.248.187";
export const api = axios.create({
  baseURL: `${port}/api/v1`,
});
