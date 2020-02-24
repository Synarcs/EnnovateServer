const firebase = require("firebase");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const upload = require("express-fileupload");
const storage = require("firebase/storage");

// template engine
// passport
const passport = require("passport");

// configure passport for auth
const setup = require("./passport/passport");

// express engine
const consolidate = require("consolidate");
// config
const { firebaseConfig, maliguns } = require("./configs/config");

const developmentUrl = "";

firebase.initializeApp(firebaseConfig);

// express functions and middlewares
const express = require("express");
const bodyParser = require("body-parser");

// config for corresponding file upload by the candidate
const multer = require("multer");

const app = express();
const firestores = firebase.firestore();

// email generator for random userid name
const randomstring = require("randomstring");

// config for hosting
const assetsPath = path.join(__dirname, "public");

// all express middlewares
// cors
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "hello asshole",
    resave: false,
    saveUninitialized: true
  })
);
app.use(cookieParser("Ennovate"));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(assetsPath));
app.use(upload());
// view engine
app.engine("ejs", consolidate.ejs);
app.set("views", "./views");
app.set("view engine", "ejs");

// facebook
app.get("/auth/facebook", (req, res, next) => {
  passport.authenticate("facebook")(req, res, next);
});

app.get("/", (req, res) => {
  res.render("Welcome", { msg: "welcome user" });
});

app.get("/auth/facebook/callback", (req, res, next) => {
  passport.authenticate("facebook", (err, user, info) => {
    if (err) {
      // call middleware parsing error
      return next(err);
    }
    if (!user) {
      // no user is received from the tokem
      return res.redirect("/login");
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      req.session.user = req.user;

      res.redirect("/Home");
    });
  })(req, res, next);
});

// github
app.get("/auth/github", (req, res, next) => {
  passport.authenticate("github")(req, res, next);
});

app.get("/auth/github/callback", (req, res, next) => {
  passport.authenticate("github", (err, user, info) => {
    if (err) {
      // call middleware parsing error
      return next(err);
    }
    if (!user) {
      // no user is received from the tokem
      return res.redirect("/login");
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      req.session.user = req.user;

      res.redirect("/Home");
    });
  })(req, res, next);
});

// google
app.get("/auth/google", (req, res, next) => {
  passport.authenticate("google")(req, res, next);
});

app.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      // call middleware parsing error
      return next(err);
    }
    if (!user) {
      // no user is received from the tokem
      return res.redirect("/login");
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      req.session.user = req.user;
      res.redirect("/Home");
    });
  })(req, res, next);
});

app.get("/Home", (req, res) => {
  if (req.user) {
    if (req.user.displayName == null) {
      // for github
      res.render("Home", { name: req.user.username, user: req.user });
    } else {
      res.render("Home", { name: req.user.displayName, user: req.user });
    }
    if (req.user.displayName == null || req.user.profile === "google") {
      console.log(req.user);
      res.render("Home", { name: req.user.username, user: req.user });
    }
  } else {
    res.redirect("/Login");
  }
});

// logout the user
app.post("/logout", (req, res, next) => {
  req.session.destroy(msg => {
    console.log("session destroyed");
  });
  req.logOut();
  res.redirect("/Login");
});

app.get("/Register", function(req, res) {
  if (req.user || req.session.email) {
    if (req.session.email && req.session.method === "Local") {
      res.redirect("/DashBoard");
    } else {
      res.redirect("/Home");
    }
  } else {
    res.render("Register", {
      openMessage: "custom Resgister",
      data: "login here with your team name and secret as password"
    });
  }
});

// workflow
// 1 register the user firsy
// 2 send email about the team code
// 3 add secret for the team in admin database
// 4 add records in firestore and corr clound functions
// 5 return login on success

app.post("/Register", function(req, res) {
  console.log("post from triggered");
  // res.set("Cache-Control", "public, max-age=300,s-maxage=900");
  const { Team_name, Team_Leader, cnumber } = req.body;
  const {
    main_email,
    alt_contact,
    alt_email,
    college_name,
    players_Names
  } = req.body;
  const random = randomstring.generate({
    length: 15,
    charset: "alphabetic"
  });

  console.log(players_Names);
  const users = players_Names.split(" ");
  //   only ma to 60 registrations
  const data = {
    from: "vedang.parasnis@somaiaya.edu",
    to: main_email,
    subject: "Registration for Ennovate",
    text: `The Team code for your Team is
        ${random}
        Thank You from BloomBox Team !!
    `
  };

  // the teamsecrets for the each team
  firestores
    .doc(`/admin/${Team_name}`)
    .set({ teamSecret: random })
    .then(msg => {})
    .catch(err => {
      console.log(err);
    });

  // create a multer storage
  const storage = multer.diskStorage({
    filename: `${Team_name} num  ${Team_Leader} ${Date.now()}`,
    destination: path.join(__dirname, "./public")
  });

  firestores
    .doc(`/Ennovate2k20/${main_email}`)
    .get()
    .then(msg => {
      if (msg.exists) {
        return res.json({ err: "please dont register again we know you!!" });
      } else {
        firestores
          .doc(`Ennovate2k20/${Team_name}`)
          .set({
            Team_name,
            Team_Leader,
            ContactNumber: cnumber,
            Contact_Email: main_email,
            Alternate_contact: alt_contact,
            Alternate_email: alt_email,
            CollegeName: college_name,
            // assign the team player in firebase
            Team_Members: users
          })
          .then(addStatus => {
            console.log("user is added and a email is been send" + addStatus);
            // send email now
            const mailgun = require("mailgun-js");
            // configure mailgun first
            const mg = mailgun({
              apiKey: maliguns.apiKey,
              domain: maliguns.DOMAIN
            });
            mg.messages().send(data, function(err, body) {
              console.log("message is send with code" + random);
            });
            res.cookie("user", {
              Team_name,
              Team_Leader,
              cnumber,
              main_email
            });
            res.redirect("/Login");
          })
          .catch(err => {
            console.log(err);
          });
      }
    });
});

// passport custom user method login here
app.get("/Login", function(req, res) {
  // login with passport local
  if (req.user || req.session.email) {
    if (req.session.email && req.session.method === "Local") {
      return res.redirect("/DashBoard");
    } else {
      return res.redirect("/Home");
    }
  } else {
    res.render("Login", {
      openMessage: "custom login",
      data: "login here with your team name and secret as password"
    });
  }
  // login before any destroy of template
});

const { auth } = require("./passport/customMiddlewares");

app.post("/Login", auth, (req, res) => {
  if (req.user) {
    console.log("got req.user");
    return res.redirect("/DashBoard");
  }
});

app.get("/DashBoard", (req, res) => {
  if (req.user || (req.session.email && req.session.method === "Local")) {
    console.log(req.session.curruser.Team_Members[0]);
    const teamPlayers = req.session.curruser.Team_Members.map(use => {
      return use;
    });
    return res.status(201).render("Dashboards", {
      data: req.user,
      username: req.session.curruser.Team_name,
      user_members: teamPlayers,
      length: teamPlayers.length
    });
  } else {
    res.redirect("/Login");
  }
  // if (req.user && req.session.email && req.session.method === "Local") {
});

// upload user resume docs to firestore
app.post("/upload", function(req, res) {
  let file;
  if (!req.files) {
    return res.status(201).render("Dashboards", { err: "file not found" });
  }
  file = req.files.FormFieldName;
  // here is the field name of the form
  const upload = firebase
    .storage()
    .ref(`${req.session.curruser.Team_name}/userData`)
    .put(file);
  // progress,error,complete
  upload.on(
    "state_changed",
    snapshot => {
      const progress =
        // Math.floor(snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.length(snapshot.totalBytes);
    },
    error => {
      console.log(error);
    },
    () => {
      firebaseStorage
        .ref(req.session.curruser.Team_name)
        .child()
        .getDownloadURL()
        .then(urls => {
          console.log(urls);
          res.render("Dashboards", {
            msg: "the file is successfully uploaded"
          });
        });
    }
  );
});

app.get("/*", (req, res) => {
  res.redirect("/");
});

app.post("/*", (req, res) => {
  res.redirect("/");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("server is running on " + port);
});