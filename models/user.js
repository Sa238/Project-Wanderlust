const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
     googleId: { 
        type: String,
        unique: true,
        sparse: true  
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdDate: {
        type: Date,
        default: Date.now
    }
});

// Add passport-local-mongoose plugin to your schema
userSchema.plugin(passportLocalMongoose);

userSchema.index({ googleId: 1 });  
userSchema.index({ email: 1 }, { unique: true }); 

module.exports = mongoose.model('User', userSchema);