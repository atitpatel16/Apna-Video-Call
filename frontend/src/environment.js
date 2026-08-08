const IS_PROD = process.env.NODE_ENV === "production";

const servers = {
    dev: "http://localhost:8000",
    prod: "https://apnavideocallbackend-tyus.onrender.com"
};

const baseURL = IS_PROD ? servers.prod : servers.dev;

export default baseURL;