// @ts-ignore
const { model, Schema } = require("mongoose");

let ticketSchema = new Schema({
    ticketID: { type: String, unique: true, required: true },
    channelID: { type: String, unique: true },
    type: { type: String },
    user: { type: String },
    roleID: { type: String },
    cmID: { type: String },
    freelancerID: { type: String },
    quotes: { type: String},
    questions: { type: String},
    budget: { type: Number},
    claimed: { type: Number },
    msg: { type: String }
},
    { timestamps: true }
);

module.exports = model('Ticket', ticketSchema);