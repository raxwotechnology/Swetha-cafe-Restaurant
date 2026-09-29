// Central API base URL configuration
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:5000";
  }
  return "https://swetha-cafe-restaurant.onrender.com";
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;

