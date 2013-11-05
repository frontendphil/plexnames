var express = require("express");

var application = express();

// application.configure(function() {
//     application.use(application.router);
// });

var routes = require("./routes");

routes.setup(application);

var PORT = 5000;

application.listen(PORT, function() {
    console.log("Application running on port: " + PORT);
});
