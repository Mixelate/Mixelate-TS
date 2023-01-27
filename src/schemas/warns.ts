// @ts-ignore
const { model, Schema } = require("mongoose");

let reasonSchema = new Schema({
    number: { type: Number },
    text: { type: String },
    by: { type: String }
})

let warnSchema = new Schema({
    user: { type: String, unique: true, required: true },
    amount: { type: Number, default: 0},
    reasons: [reasonSchema]
},
    { timestamps: true }
);

module.exports = model('Warn', warnSchema);