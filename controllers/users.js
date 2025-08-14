const crypto = require('crypto');
const User = require("../models/user");
const { sendPasswordResetEmail , sendPasswordResetConfirmation } = require('../utils/email');

module.exports.renderSignupForm = (req, res) => {
    res.render("./users/signup.ejs");
};

module.exports.signup = async(req, res) => {
    try { 
    let{username, email, password} = req.body;
    const newUser = new User({email, username});
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "Welcome to Wanderlust");
        // res.redirect("/listings");
        res.redirect("/login");
    });  
    } catch(e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("./users/login.ejs");
};

module.exports.login = async(req, res) => {
    req.flash("success", "Welcome back to wanderlust!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if(err) {
            return next();
        }
        req.flash("success", "you are logged out!");
        res.redirect("/listings");
    });
};


module.exports.renderProfileForm = async (req, res) => {
    try {
        const currUser = await User.findById(req.user._id);
        if (!currUser) {
            req.flash('error', 'User not found');
            return res.redirect('/listings');
        }
        
        console.log("User data:", currUser);
        
        res.render("./users/profile.ejs", { 
            currUser,
            memberSince: currUser.createdAt ? currUser.createdAt.toLocaleDateString() : 'Unknown date'
        });
    } catch (e) {
        req.flash('error', 'Error loading profile');
        res.redirect('/listings');
    }
};
module.exports.showProfile = async (req, res) => {
    console.log(req);
    try {
        const currUser = req.user;
        // console.log("Current User Data=======>", currUser);
        res.redirect("/profile", { currUser });
    } catch (e) {
        req.flash('error', 'Error fetching profile');
        res.redirect('/listings');
    }
};

module.exports.renderEditForm = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            req.flash("error", "User not found!");
            return res.redirect("/profile");
        }
        res.render("users/edit.ejs", { user });
    } catch (e) {
        req.flash('error', 'Error loading edit form');
        res.redirect('/profile');
    }
};

module.exports.updateUsers = async (req, res) => {
    try {
        const { username, email } = req.body;
        console.log("Updating user:", req.user._id, username, email);
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { username, email },
            { new: true, runValidators: true }
        );
        
        if (!user) {
            req.flash("error", "User not found!");
            return res.redirect("/profile");
        }
        req.login(user, (err) => {
        if (err) {
            req.flash("error", "Error updating session");
            return res.redirect("/profile");
        }
        req.flash("success", "Profile updated successfully!");
        res.redirect("/profile");
    });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/profile/edit");
    }
};

//*================ User Reset Password ===================//
module.exports.renderForgotPasswordForm = (req, res) => {
    res.render('users/forgot-password');
};

module.exports.handleForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            req.flash('error', 'No account with that email exists.');
            return res.redirect('/forgot-password');
        }

        // Generate reset token and expiry
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
        
        await user.save();

        // send reset email
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

        try {
            await sendPasswordResetEmail(user.email, resetUrl);
            req.flash('success', 'Password reset email sent. Check your inbox.');
            return res.redirect('/login');
        } catch (emailError) {
            // Clear the token since email failed
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            
            req.flash('error', 'Failed to send password reset email. Please try again.');
            return res.redirect('/forgot-password');
        }
    } catch (e) {
        req.flash('error', 'Error processing password reset.');
        res.redirect('/forgot-password');
    }
};

module.exports.renderResetPasswordForm = async (req, res) => {
    try {
        const rawToken = req.params.token;
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

       if (user) {
            const timeRemaining = user.resetPasswordExpires - Date.now();
            return res.render('users/reset-password', { 
                token: rawToken,
                expiresIn: Math.round(timeRemaining/(60*1000)) 
            });
        } else {
            // console.log("[DEBUG] Checking for expired token...");
            const expiredUser = await User.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { $lte: Date.now() }
            });
            
            if (expiredUser) {
                console.log(`[DEBUG] Token expired at: ${new Date(expiredUser.resetPasswordExpires)}`);
            }
            
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot-password');
        }
    } catch (e) {
        console.error("[ERROR] in renderResetPasswordForm:", e);
        req.flash('error', 'Error processing password reset.');
        res.redirect('/forgot-password');
    }
};

module.exports.handleResetPassword = async (req, res) => {
    try {
        const rawToken = req.params.token || req.body.token;
        // console.log("Raw token recieved =======>6:", rawToken);

        if(!rawToken) {
            req.flash('error', 'no reset token provided');
            return res.redirect('/forget-password');
        }
         const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

         if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot-password');
        }
         if (req.body.password !== req.body.confirmPassword) {
            req.flash('error', 'Passwords do not match.');
            return res.redirect(`/reset-password/${rawToken}`);
        }

         await user.setPassword(req.body.password);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        // Send confirmation email
        await sendPasswordResetConfirmation(user.email);

        req.flash('success', 'Password updated successfully! You can now login with your new password.');
        res.redirect('/login');
    } catch (e) {
        req.flash('error', 'Error resetting password.');
        res.redirect(`/reset-password/${req.params.token}`);
    }
};
//*================ User Reset Password end===================//
