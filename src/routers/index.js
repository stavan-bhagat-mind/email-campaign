const indexRouter = require("express").Router();
const authRouter = require("./auth.router");
const userRouter = require("./user.router");

indexRouter.use("/auth", authRouter);
indexRouter.use("/user", userRouter);

module.exports = indexRouter;
