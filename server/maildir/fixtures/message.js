"use strict";


const MailComposer = require("nodemailer/lib/mail-composer");
const faker = require("faker");
const ms = require("milliseconds");
const simpleParser = require("mailparser").simpleParser;

function randomDate() {
    return new Date(Date.now() - ms.days(Math.round(Math.random() * 100)));
}

function composeEmail() {
    let dt = randomDate();

    let mailOptions = {
        references: "<sfsafsafsfsdf>, sadfsafsdfsfsdf2",
        from: `${faker.name.findName()} <${faker.internet.email()}>`,
        to: `${faker.internet.email()}, ${faker.internet.email()}`,
        subject: faker.company.catchPhrase(),
        text: faker.lorem.paragraphs(10),
        date: dt,
    };
    
    return new Promise((resolve, reject) => {
        new MailComposer(mailOptions).compile().build(function(err, msg){
            if (err) return reject(err);
            resolve([msg, mailOptions]);
        });
    });
}

module.exports.composeEmail = composeEmail;

function testEmail() {
    const mail = composeEmail();
    
    return new Promise((resolve, reject) => {
        mail.compile().build(function(err, message){
            simpleParser(message, (err, mail) => {
                if (err) return reject(err);
                resolve(mail);
            });
        });    
    });
}

module.exports.testEmail = testEmail;
