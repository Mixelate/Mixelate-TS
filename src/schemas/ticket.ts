// @ts-ignore
const { model, Schema } = require("mongoose");

let qSchema = new Schema({
    question: { type: String },
    answer: { type: String }
});

let ticketSchema = new Schema({
    ticketID: { type: String, unique: true, required: true },
    channelID: { type: String, unique: true },
    questions: [qSchema],
    msgID: { type: String },
    userID: { type: String },
    reviewerID: { type: String },
    roleID: { type: String },
},
    { timestamps: true }
);

module.exports = model('Ticket', ticketSchema);