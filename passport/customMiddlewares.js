const firebase = require("firebase");
const path = require("path");

module.exports.auth = (req, res, next) => {
  try {
    const { Team_name, Team_Secret } = req.body;
    firebase
      .firestore()
      .doc(`admin/${Team_name}`)
      .get()
      .then(data => {
        if (data.exists) {
          console.log(req.body);

          // further scann
          firebase
            .firestore()
            .doc(`admin/${Team_name}`)
            .get()
            .then(msg => {
              const presentSecret = msg.data();
              if (presentSecret.teamSecret === Team_Secret) {
                //   all went fine
                // attach user to the req object from ennovate collection
                // user must exist now
                firebase
                  .firestore()
                  .doc(`Ennovate2k20/${Team_name}`)
                  .get()
                  .then(presents => {
                    // //   everyone is correct now
                    // console.log(presents.id);
                    req.session.email = presents.data().Contact_Email;
                    req.session.method = "Local";
                    console.log("reached here");
                    req.user = presents.data();
                    req.session.curruser = presents.data();
                    next();
                  });
              } else {
                console.log("please check your email again");
                res.render("Login", {
                  msg: "the secret did not matched please check your email"
                });
              }
            });
        } else {
          res.status(403).json();
          throw new Error("user cannot sign in");
        }
      });
  } catch (err) {
    console.log(err);
  }
};
