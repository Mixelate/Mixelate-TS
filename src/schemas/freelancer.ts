// @ts-ignore
const { model, Schema } = require("mongoose");

let freelancerSchema = new Schema({
    user: { type: String, unique: true, required: true },
    portfolio: { type: String, default: "No Portfolio Set!" },
    timezone: { type: String, default: "No Timezone Set!" },
    email: { type: String, default: "No Email Set!" },
    paypal: { type: String, default: "No PayPal.me Set!" },
    about: { type: String, default: "This user didn't set their bio yet!"},
    pronouns: { type: String, default: "No Pronouns Set!" },
    claims: { type: Number, default: 0},
    rating: { type: String, default: "Not Rated" },
    totalEarnings: { type: Number, default: 0},
    totalBalance: { type: Number, default: 0},
    availableBalance: { type: Number, default: 0}
},
    { timestamps: true }
);

module.exports = model('Freelancer', freelancerSchema);