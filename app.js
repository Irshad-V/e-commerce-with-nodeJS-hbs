var createError = require('http-errors');
var express = require('express');
var app = express();
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
// mongoDb connection
mongoose.connect('mongodb://0.0.0.0:27017/shopping', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB successfully.');
})
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });



var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var exphbs = require('express-handlebars');
var session = require("express-session")
var cors = require("cors")
// app.use(cors(
//   { origin: "http://127.0.0.1:5500" }
// ))

// Set up the session middleware
app.use(
  session({
    secret: 'your-secret-key', // Replace with a secure secret key
    resave: false,
    saveUninitialized: false,
    // You can configure additional options as needed, like store, cookie, etc.
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs', exphbs.engine({
  extname: 'hbs', defaultLayout: "layout", layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials/',
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowedProtoMethodsByDefault: true
  }
}));




app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});



// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page 
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
