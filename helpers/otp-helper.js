/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */

// const accountSid = "AC0fd6350632d81b4a8bf064dd3e3665f4";
// const authToken = "f3f185a2c6bae4282cea05cc4ea2c678";
// const client = require('twilio')(accountSid, authToken);

// client.verify.services('VAc3013d0efa1e85674880cc328a2fd74b')
//              .verifications
//              .create({to: '+15017122661', channel: 'sms'})
//              .then(verification => console.log(verification.sid));
require('dotenv').config();
const nodemailer = require('nodemailer');

const accountSID = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_ID;

const client = require('twilio')(accountSID, authToken);

// const config = require('../config/otp-verification')
// const client = require('twilio')(config.accountSID,config.authToken)

module.exports={
    makeOtp:(phone_number)=>{
        console.log(accountSID,authToken,serviceId);
        return new Promise(async(resolve,reject)=>{
           await client.verify
            .services(serviceId)
            .verifications.create({
                to:`+91${phone_number}`,
                channel:'sms'
            }).then((verifications) =>{
                console.log(verifications.status)
                resolve(verifications)
            })
            
        })
        
    },
    verifyOtp:(otp,phone_number)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(phone_number);
           await client.verify
           .services(serviceId)
           .verificationChecks.create({
               to:`+91${phone_number}`,
               code:otp,
           }).then((verification_check)=>{
               resolve(verification_check)
           })
        })
    }
}            