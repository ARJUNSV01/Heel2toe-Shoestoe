var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jcarl1998groove@gmail.com',
    pass: 'ljcimkghynpodvgg'
  }
});

var mailOptions = {
  from: 'jcarl1998groove@gmail.com',
  to: 'arjunsv9@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
