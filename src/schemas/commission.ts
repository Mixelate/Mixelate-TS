// @ts-ignore
const { model, Schema } = require("mongoose");

let questionSchema = new Schema({
    question: { type: String },
    answer: { type: String }
});

let quoteSchema = new Schema({
    quoterID: { type: String },
    price: { type: Number },
    commissionId: { type: String },
    accepted: { type: Boolean, default: false }
})

let commissionSchema = new Schema({
    commissionID: { type: String, unique: true, required: true },
    quotes: [quoteSchema],
    questions: [questionSchema],
    charge: { type: Number },
    budget: { type: Number },
    claimed: { type: Number },
    msg: { type: String },
    userID: { type: String },
    roleID: { type: String },
    channelID: { type: String, unique: true },
    freelancerID: { type: String },
    staffID: { type: String }
},
    { timestamps: true }
);

module.exports = model('Commission', commissionSchema);