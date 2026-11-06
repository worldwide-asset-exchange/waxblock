const express = require("express");
const cors = require("cors");
const xss = require("xss-clean");
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const routes = require('./routes');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const originAuth = require('./middlewares/originAuth');


const app = express();

app.use(morgan.successHandler);
app.use(morgan.errorHandler);

// Refuse requests that did not come through the WaxBlock Cloudflare zone (when ORIGIN_AUTH_KEY is set)
app.use(originAuth.httpMiddleware);

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());

// enable cors
app.use(cors());
app.options("*", cors());

// All routes
app.use(routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
