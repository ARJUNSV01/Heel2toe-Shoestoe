
const accountSid = "AC0fd6350632d81b4a8bf064dd3e3665f4";
const authToken = "f3f185a2c6bae4282cea05cc4ea2c678";
const client = require('twilio')(accountSid, authToken);

client.verify.services('VAc3013d0efa1e85674880cc328a2fd74b')
             .verifications
             .create({to: '+15017122661', channel: 'sms'})
             .then(verification => console.log(verification.sid));

             