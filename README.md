# email-campaign
pnpm installation 
devdependency : pnpm add -D nodemon eslint




// // verify User
// async function userVerificationHandler(req, res) {
//   try {
//     const { token } = req.params;
//     const decoded = jwt.verify(token, process.env.VERIFY_SECRET);
//     const user = await Models.User.findOne({ email: decoded.email });
//     if (!user) {
//       return errorResponseWithoutData(
//         res,
//         STATUS_NOT_FOUND,
//         COMMON_MSG.NOT_FOUND.replace("##", "User")
//       );
//     }
//     if (user.isEmailVerified) {
//       return res.render("verifySuccess.template.ejs", {
//         userName: user.firstName,
//         email: user.email,
//         appName: APP.NAME,
//         alreadyVerified: true,
//       });
//     }
//     user.isEmailVerified = true;
//     await user.save();

//     return res.render("verifySuccess.template.ejs", {
//       userName: user.firstName,
//       email: user.email,
//       appName: APP.NAME,
//       alreadyVerified: false,
//     });
//   } catch (error) {
//     console.error("Verification error:", error);
//     if (error.name === "TokenExpiredError") {
//       return res.render("linkExpire.template.ejs", {
//         appName: APP.NAME,
//         alreadyVerified: false,
//       });
//     }
//     return errorResponseWithoutData(
//       res,
//       STATUS_INTERNAL_SERVER_ERROR,
//       MSG_INTERNAL_SERVER_ERROR
//     );
//   }
// }

// // Resend Verification Email
// async function resendVerificationEmail(req, res) {
//   try {
//     const { email } = req.body;

//     // Find user by email
//     const user = await Models.User.findOne({ email });

//     if (!user) {
//       return errorResponseWithoutData(
//         res,
//         STATUS_BAD_REQUEST,
//         COMMON_MSG.NOT_FOUND.replace("##", USER)
//       );
//     }

//     if (user.isEmailVerified) {
//       return errorResponseWithoutData(
//         res,
//         STATUS_BAD_REQUEST,
//         COMMON_MSG.ALREADY_VERIFIED.replace("##", "email")
//       );
//     }

//     const emailVerificationToken = jwt.sign(
//       { email },
//       process.env.VERIFY_SECRET,
//       { expiresIn: process.env.VERIFY_EXPIRY_TIME }
//     );
//     // Send new verification email
//     await sendVerificationEmail(email, emailVerificationToken);

//     return successResponseWithoutData(
//       res,
//       STATUS_SUCCESS,
//       VERIFICATION_EMAIL_SENT
//     );
//   } catch (error) {
//     console.error("Resend verification email error:", error);
//     return errorResponseWithoutData(
//       res,
//       STATUS_INTERNAL_SERVER_ERROR,
//       MSG_INTERNAL_SERVER_ERROR
//     );
//   }
// }
// 



---------------------------

// userRouter.post(
//   "/resend/verify",
//   createRateLimiter("verify-email"),
//   resendVerificationEmail
// );


----
  //   refreshTokenHandler,

   //   getUserDataHandler,
  //   resendVerificationEmail,
  //   forgotPasswordHandler  //   verifyAndResetPasswordHandler,